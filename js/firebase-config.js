// js/firebase-config.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyCty3UyZSHR7-1EGIEWezEzDhPdDsR14fM",
  authDomain: "feijosystems-bc97d.firebaseapp.com",
  projectId: "feijosystems-bc97d",
  storageBucket: "feijosystems-bc97d.firebasestorage.app",
  messagingSenderId: "463944584434",
  appId: "1:463944584434:web:8a224dfcdbc5e1f05c146b"
};

// 👇 AQUI ESTAVA O ERRO: Adicionei "export" para os outros arquivos poderem usar
export const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);