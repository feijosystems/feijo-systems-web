import { db } from './firebase-config.js';
import { collection, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js";

// --- CONTROLE DO CAMPO "OUTRO" ---
const selectTipo = document.getElementById('type');
const divOutro = document.getElementById('outro-container');
const inputOutro = document.getElementById('outro-input');

selectTipo.addEventListener('change', () => {
    if (selectTipo.value === 'outro') {
        divOutro.style.display = 'block'; // Aparece a caixinha
        inputOutro.setAttribute('required', 'true'); // Obriga a escrever
    } else {
        divOutro.style.display = 'none'; // Some
        inputOutro.removeAttribute('required'); // Não obriga mais
        inputOutro.value = ''; // Limpa o texto se mudar de ideia
    }
});

// Elementos do Form
const form = document.getElementById('projectForm');
const modal = document.getElementById('modal-confirmacao');
const btnConfirmar = document.getElementById('btn-confirmar');
const btnVoltar = document.getElementById('btn-voltar');

// Variável pra guardar os dados temporariamente
let dadosParaEnviar = {};

// --- 1. MÁSCARA DE TELEFONE (Formata enquanto digita) ---
document.getElementById('whatsapp').addEventListener('input', function (e) {
    let x = e.target.value.replace(/\D/g, '').match(/(\d{0,2})(\d{0,5})(\d{0,4})/);
    e.target.value = !x[2] ? x[1] : '(' + x[1] + ') ' + x[2] + (x[3] ? '-' + x[3] : '');
});

// --- 2. INTERCEPTAR O ENVIO (Abre o Modal) ---
form.addEventListener('submit', (e) => {
    e.preventDefault(); // PARE! Não envia ainda.

    // --- LÓGICA INTELIGENTE DO TIPO DE PROJETO ---
    // Verifica se escolheu "Outro" ou um da lista
    let tipoFinal = document.getElementById('type').value;
    
    if (tipoFinal === 'outro') {
        // Se for "outro", pega o que a pessoa escreveu na caixinha
        tipoFinal = document.getElementById('outro-input').value;
    }

    // Pega os valores (Usando o tipoFinal que calculamos acima)
    dadosParaEnviar = {
        cliente: document.getElementById('name').value,
        email: document.getElementById('email').value,
        contato: document.getElementById('whatsapp').value,
        tipo_projeto: tipoFinal, // <--- AQUI ESTÁ A MÁGICA
        descricao: document.getElementById('details').value
    };

    // Preenche o Modal para conferência
    document.getElementById('rev-nome').innerText = dadosParaEnviar.cliente;
    document.getElementById('rev-email').innerText = dadosParaEnviar.email;
    document.getElementById('rev-zap').innerText = dadosParaEnviar.contato;
    document.getElementById('rev-tipo').innerText = dadosParaEnviar.tipo_projeto;

    // Mostra o Modal
    modal.style.display = "flex";
});

// --- 3. BOTÃO "CORRIGIR" (Só fecha o modal) ---
btnVoltar.addEventListener('click', () => {
    modal.style.display = "none";
});

// --- 4. BOTÃO "CONFIRMAR" (Envia pro Firebase) ---
btnConfirmar.addEventListener('click', async () => {
    
    // Feedback visual
    btnConfirmar.innerText = "ENVIANDO...";
    btnConfirmar.disabled = true;

    try {
        await addDoc(collection(db, "pedidos"), {
            ...dadosParaEnviar, // Espalha os dados que guardamos
            data: serverTimestamp(),
            status: "Novo"
        });

        // Função pra mostrar o Toast
        const toast = document.getElementById("toast");
        toast.className = "show";
        toast.innerText = "✅ Recebido! Entraremos em contato.";

        // Some depois de 3 segundos
        setTimeout(function(){ 
            toast.className = toast.className.replace("show", ""); 
        }, 3000);
        
        form.reset(); // Limpa o formulário
        
        // Esconde o campo "outro" e reseta ele também
        divOutro.style.display = 'none';
        
        modal.style.display = "none"; // Fecha modal

    } catch (error) {
        console.error("Erro:", error);
        alert("❌ Erro no sistema. Tente novamente.");
    } finally {
        btnConfirmar.innerText = "🚀 Confirmar e Enviar";
        btnConfirmar.disabled = false;
    }
});