import { auth } from "./firebase.js";
import {
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const authBtn = document.getElementById("authBtn");
const toggleBtn = document.getElementById("toggleAuth");
const authTitle = document.getElementById("authTitle");

let isLogin = true;

// Basculer entre Login et Signup
toggleBtn.onclick = () => {
    isLogin = !isLogin;
    authTitle.innerText = isLogin ? "Bon retour !" : "Créez votre compte";
    authBtn.innerText = isLogin ? "Se connecter" : "S'inscrire";
    toggleBtn.innerText = isLogin ? "S'inscrire" : "Se connecter";
};

authBtn.onclick = async () => {
    const email = emailInput.value;
    const password = passwordInput.value;

    if (!email || !password) return alert("Remplissez les champs");

    authBtn.disabled = true;
    authBtn.innerText = "Chargement...";

    try {
        if (isLogin) {
            await signInWithEmailAndPassword(auth, email, password);
        } else {
            await createUserWithEmailAndPassword(auth, email, password);
        }
        // Redirection vers le dashboard après succès
        window.location.href = "index.html";
    } catch (error) {
        alert("Erreur: " + error.message);
    } finally {
        authBtn.disabled = false;
        authBtn.innerText = isLogin ? "Se connecter" : "S'inscrire";
    }
};