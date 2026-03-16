import { auth, db } from "./firebase.js";
import {
    signOut,
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
    collection,
    addDoc,
    query,
    orderBy,
    onSnapshot
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// --- Sélecteurs DOM ---
const projectsDiv = document.getElementById("projects");
const loader = document.getElementById("loader");
const searchInput = document.getElementById("search");
const createProjectBtn = document.getElementById("createProject");
const logoutBtn = document.getElementById("logout");
const modal = document.getElementById("createModal");
const openModalBtn = document.getElementById("openModal");
const closeModalBtn = document.getElementById("closeModal");
const tabs = document.querySelectorAll(".tab");

// --- État de l'Application ---
let allProjects = [];
let currentUser = null;

// --- 1. Gestion de l'Authentification ---
onAuthStateChanged(auth, (user) => {
    currentUser = user;
    const userAvatar = document.getElementById("userAvatar");
    const userName = document.getElementById("userName");

    if (user) {
        userName.innerText = user.email.split('@')[0];
        userAvatar.innerText = user.email[0].toUpperCase();
        console.log("Connecté en tant que:", user.email);
    } else {
        userName.innerText = "Invité";
        userAvatar.innerText = "?";
        // Optionnel : rediriger vers une page de login
    }
});

logoutBtn.onclick = () => {
    signOut(auth)
        .then(() => showToast("Déconnexion réussie", "info"))
        .catch(() => showToast("Erreur de déconnexion", "error"));
};

// --- 2. Gestion des Projets (Firestore) ---
const q = query(collection(db, "projects"), orderBy("createdAt", "desc"));

onSnapshot(q, (snapshot) => {
    allProjects = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    // Mise à jour des statistiques
    const statTotal = document.getElementById("statTotal");
    if (statTotal) statTotal.innerText = allProjects.length;

    // Simulation de chargement pour le feeling SaaS
    setTimeout(() => {
        if (loader) loader.style.display = "none";
        projectsDiv.style.display = "grid";
        renderProjects(allProjects);
    }, 500);
});

// Création d'un projet
createProjectBtn.onclick = async () => {
    if (!currentUser) return showToast("Connectez-vous pour publier", "error");

    const title = document.getElementById("title").value;
    const description = document.getElementById("description").value;
    const stack = document.getElementById("stack").value;

    if (!title || !description) return showToast("Champs requis manquants", "error");

    createProjectBtn.disabled = true;
    createProjectBtn.innerHTML = "Publication...";

    try {
        await addDoc(collection(db, "projects"), {
            title,
            description,
            stack,
            status: "recherche",
            ownerId: currentUser.uid,
            ownerEmail: currentUser.email,
            createdAt: Date.now()
        });

        showToast("Projet publié !", "success");
        closeModal();
        // Reset formulaire
        document.getElementById("title").value = "";
        document.getElementById("description").value = "";
        document.getElementById("stack").value = "";
    } catch (e) {
        showToast("Erreur Firestore", "error");
        console.error(e);
    } finally {
        createProjectBtn.disabled = false;
        createProjectBtn.innerHTML = "Publier";
    }
};

// --- 3. Moteur de Rendu & Filtres ---
function renderProjects(projectsArray) {
    projectsDiv.innerHTML = "";

    if (projectsArray.length === 0) {
        projectsDiv.innerHTML = `<p style="grid-column: 1/-1; text-align: center; padding: 40px; color: #94a3b8;">Aucun projet trouvé.</p>`;
        return;
    }

    projectsArray.forEach((project) => {
        const isOwner = currentUser && project.ownerId === currentUser.uid;
        const card = document.createElement("div");
        card.className = "project-card";
        card.innerHTML = `
            <div style="display:flex; justify-content:space-between; align-items:start; margin-bottom:15px;">
                <span class="tag">${project.stack}</span>
                <span style="font-size:10px; color:#94a3b8;">${isOwner ? '⭐ Votre projet' : 'Nouveau'}</span>
            </div>
            <h3 style="margin-bottom:10px; color:#38bdf8;">${escapeHTML(project.title)}</h3>
            <p style="font-size:0.9rem; color:#94a3b8; line-height:1.5; margin-bottom:20px;">
                ${escapeHTML(project.description)}
            </p>
            <div style="display:flex; justify-content:space-between; align-items:center; border-top:1px solid rgba(255,255,255,0.05); pt-15px; margin-top:auto;">
                <span style="font-size:0.8rem; color:#10b981;">● ${project.status}</span>
                <button class="btn-primary" style="padding: 5px 12px; font-size: 0.8rem;">
                    ${isOwner ? 'Gérer' : 'Voir'}
                </button>
            </div>
        `;
        projectsDiv.appendChild(card);
    });
}

// Recherche temps réel
searchInput.oninput = (e) => {
    const term = e.target.value.toLowerCase();
    const filtered = allProjects.filter(p =>
        p.title.toLowerCase().includes(term) ||
        p.stack.toLowerCase().includes(term)
    );
    renderProjects(filtered);
};

// Gestion des onglets de statut
tabs.forEach(tab => {
    tab.onclick = () => {
        document.querySelector(".tab.active").classList.remove("active");
        tab.classList.add("active");
        const filter = tab.dataset.filter;
        const filtered = filter === "all" ? allProjects : allProjects.filter(p => p.status === filter);
        renderProjects(filtered);
    };
});

// --- 4. Utilitaires UI ---

// Modal
if (openModalBtn) openModalBtn.onclick = () => modal.style.display = "flex";
if (closeModalBtn) closeModalBtn.onclick = closeModal;
function closeModal() { modal.style.display = "none"; }

// Toast System
function showToast(message, type = "success") {
    const toast = document.createElement("div");
    toast.style.cssText = `
        position: fixed; bottom: 20px; right: 20px; 
        background: ${type === 'success' ? '#10b981' : '#1e293b'};
        color: white; padding: 12px 24px; border-radius: 8px;
        box-shadow: 0 10px 20px rgba(0,0,0,0.3); z-index: 1000;
        transition: 0.3s; transform: translateY(100px);
    `;
    toast.innerText = message;
    document.body.appendChild(toast);
    setTimeout(() => {
        toast.style.transform = "translateY(0)";
        setTimeout(() => {
            toast.style.transform = "translateY(100px)";
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }, 100);
}

// Sécurité XSS
function escapeHTML(str) {
    const p = document.createElement('p');
    p.textContent = str;
    return p.innerHTML;
}

const navButtons = {
    'navProjects': 'view-dashboard',
    'navMyProjects': 'view-my-projects',
    'navMessages': 'view-messages',
    'navSettings': 'view-settings'
};

Object.keys(navButtons).forEach(id => {
    document.getElementById(id).onclick = () => {
        // Switch active class
        document.querySelectorAll('.nav-item').forEach(btn => btn.classList.remove('active'));
        document.getElementById(id).classList.add('active');

        // Switch views
        document.querySelectorAll('.view').forEach(v => v.style.display = 'none');
        document.getElementById(navButtons[id]).style.display = 'block';

        // Update Title
        document.getElementById('view-title').innerText = document.getElementById(id).innerText;
    };
});

// --- Gestion Spécifique "Mes Projets" ---
function renderMyProjects(projects) {
    const container = document.getElementById("my-projects-list");
    container.innerHTML = "";

    const myProjects = projects.filter(p => p.ownerId === auth.currentUser?.uid);
    document.getElementById('statMine').innerText = myProjects.length;

    myProjects.forEach(p => {
        const card = document.createElement("div");
        card.className = "project-card";
        card.innerHTML = `
            <div style="display:flex; justify-content:space-between;">
                <span class="tag">${p.stack}</span>
                <div>
                    <button class="btn-edit" onclick="editProject('${p.id}')">Modifier</button>
                    <button class="btn-delete" onclick="deleteProject('${p.id}')">Supprimer</button>
                </div>
            </div>
            <h3>${p.title}</h3>
            <p>${p.description}</p>
            <div style="margin-top:15px;">
                <select onchange="updateStatus('${p.id}', this.value)" class="status-select">
                    <option value="recherche" ${p.status === 'recherche' ? 'selected' : ''}>🔍 Recherche</option>
                    <option value="en cours" ${p.status === 'en cours' ? 'selected' : ''}>🛠️ En cours</option>
                    <option value="termine" ${p.status === 'termine' ? 'selected' : ''}>✅ Terminé</option>
                </select>
            </div>
        `;
        container.appendChild(card);
    });
}

// --- Fonctions de Gestion (Globales pour onclick HTML) ---
window.deleteProject = async (id) => {
    if (confirm("Supprimer ce projet définitivement ?")) {
        await deleteDoc(doc(db, "projects", id));
        showToast("Projet supprimé", "error");
    }
};

window.updateStatus = async (id, newStatus) => {
    await updateDoc(doc(db, "projects", id), { status: newStatus });
    showToast("Statut mis à jour");
};

// --- Intégration dans le Snapshot existant ---
onSnapshot(query(collection(db, "projects"), orderBy("createdAt", "desc")), (snapshot) => {
    const projects = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    renderProjects(projects); // Ta fonction dashboard
    renderMyProjects(projects); // Ta fonction de gestion
});