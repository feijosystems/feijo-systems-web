import { getAuth, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js";
import { app } from './firebase-config.js'; // Agora sim ele acha o app exportado!

const auth = getAuth(app);
const form = document.getElementById('loginForm');
const erroMsg = document.getElementById('erro');

form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const btn = document.querySelector('.btn-submit');

    // Feedback Visual
    btn.innerText = "VERIFICANDO...";
    btn.disabled = true;

    try {
        await signInWithEmailAndPassword(auth, email, password);
        // Sucesso: Manda pro Admin
        window.location.href = "admin.html";
    } catch (error) {
        console.error("Erro no login:", error);
        
        // Mostra erro na tela
        erroMsg.style.display = "block";
        erroMsg.innerText = "❌ E-mail ou senha incorretos.";
        
        // Reseta botão
        btn.innerText = "ACESSAR SISTEMA";
        btn.disabled = false;
    }
});