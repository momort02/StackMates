// Import Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// Config
const firebaseConfig = {
    apiKey: "AIzaSyBWqF4_uiur-XOD8lQy2X9cJciWo9vkUZg",
    authDomain: "stackmates-a674e.firebaseapp.com",
    projectId: "stackmates-a674e",
    storageBucket: "stackmates-a674e.firebasestorage.app",
    messagingSenderId: "485803590862",
    appId: "1:485803590862:web:875a4dda0c2c31605dbc9f"
};

// Init
const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);