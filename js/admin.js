// 1. IMPORTS (Adicionei deleteDoc e serverTimestamp)
import { db, app } from './firebase-config.js';
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js";
import { collection, onSnapshot, orderBy, query, doc, updateDoc, deleteDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js";

// 2. SEGURANÇA
const auth = getAuth(app);

onAuthStateChanged(auth, (user) => {
    if (!user) {
        window.location.href = "login.html";
    } else {
        console.log("Logado: " + user.email);
    }
});

window.fazerLogout = async () => {
    try {
        await signOut(auth);
        window.location.href = "login.html";
    } catch (error) {
        console.error("Erro ao sair: ", error);
    }
}

// 3. LÓGICA DO DASHBOARD
const colPendentes = document.getElementById('lista-pendentes');
const colAceitos = document.getElementById('lista-aceitos');
const colConcluidos = document.getElementById('lista-concluidos');
const colRecusados = document.getElementById('lista-recusados');
const inputBusca = document.getElementById('search-bar');

let todosPedidos = [];

const q = query(collection(db, "pedidos"), orderBy("data", "desc"));

onSnapshot(q, (snapshot) => {
    todosPedidos = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
    }));

    // Renderiza a tela
    renderizarQuadros(todosPedidos);
    
    // 🧹 O FAXINEIRO (Roda toda vez que atualiza)
    limparArquivadosAntigos(todosPedidos);
});

// Busca
inputBusca.addEventListener('input', (e) => {
    const termo = e.target.value.toLowerCase();
    const pedidosFiltrados = todosPedidos.filter(pedido => 
        pedido.cliente.toLowerCase().includes(termo) || 
        pedido.tipo_projeto.toLowerCase().includes(termo) ||
        (pedido.email && pedido.email.toLowerCase().includes(termo))
    );
    renderizarQuadros(pedidosFiltrados);
});

function renderizarQuadros(listaDePedidos) {
    colPendentes.innerHTML = "";
    colAceitos.innerHTML = "";
    colConcluidos.innerHTML = "";
    colRecusados.innerHTML = "";

    listaDePedidos.forEach(pedido => {
        const card = criarCard(pedido);
        if (pedido.status === "Novo" || !pedido.status) {
            colPendentes.innerHTML += card;
        } else if (pedido.status === "Aceito") {
            colAceitos.innerHTML += card;
        } else if (pedido.status === "Concluido") {
            colConcluidos.innerHTML += card;
        } else if (pedido.status === "Recusado") {
            colRecusados.innerHTML += card;
        }
    });

    ativarBotoes();
}

function criarCard(pedido) {
    let dataFormatada = "--/--";
    if(pedido.data) {
        const d = pedido.data.toDate();
        dataFormatada = d.toLocaleDateString('pt-BR') + ' ' + d.toLocaleTimeString('pt-BR').slice(0,5);
    }

    const emailDisplay = pedido.email ? pedido.email : "Sem e-mail";
    const btnEmail = pedido.email ? 
        `<a href="mailto:${pedido.email}" class="btn-zap" style="background: #ea4335; color: white;">📧 E-mail</a>` : 
        `<span class="btn-zap" style="background: #333; color: #555; cursor: not-allowed;">🚫 Sem E-mail</span>`;

    let botoesHTML = '';

    if (pedido.status === "Novo" || !pedido.status) {
        botoesHTML = `
            <div class="actions">
                <button class="btn-action btn-reject" data-id="${pedido.id}" data-action="Recusado">✖ Recusar</button>
                <button class="btn-action btn-accept" data-id="${pedido.id}" data-action="Aceito">✔ Pegar Projeto</button>
            </div>`;
    } else if (pedido.status === "Aceito") {
        botoesHTML = `
            <div class="actions">
                <button class="btn-action btn-reject" data-id="${pedido.id}" data-action="Recusado">✖ Cancelar</button>
                <button class="btn-action btn-finish" data-id="${pedido.id}" data-action="Concluido">🚀 Finalizar</button>
            </div>`;
    } else if (pedido.status === "Concluido") {
        botoesHTML = `
             <div class="actions">
                <button class="btn-action btn-reject" data-id="${pedido.id}" data-action="Recusado">📂 Arquivar</button>
            </div>`;
    } 
    // NOVO: Se estiver no Arquivo, mostra quando vai sumir
    else if (pedido.status === "Recusado") {
        let textoExpira = "";
        if (pedido.data_arquivamento) {
            const dataArq = pedido.data_arquivamento.toDate();
            // Data que vai apagar = DataArq + 35 dias
            const dataDelete = new Date(dataArq.getTime() + (35 * 24 * 60 * 60 * 1000));
            textoExpira = `<p style="color: #FF4444; font-size: 0.7rem; margin-top:5px;">🗑️ Auto-delete em: ${dataDelete.toLocaleDateString('pt-BR')}</p>`;
        }
        
        botoesHTML = `
            <div class="actions">
                ${textoExpira}
                <button class="btn-action btn-reject" style="opacity:0.5; cursor: default;">No Arquivo</button>
            </div>
        `;
    }

    return `
        <div class="card">
            <h3>${pedido.cliente}</h3>
            <span class="badge">${pedido.tipo_projeto}</span>
            <p>${pedido.descricao}</p>
            
            <div style="margin: 10px 0; font-size: 0.85rem; color: #ccc; border-top: 1px solid #333; padding-top:5px;">
                <p>📧 ${emailDisplay}</p>
                <p>📅 ${dataFormatada}</p>
            </div>
            
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 5px;">
                <a href="https://wa.me/55${limparTelefone(pedido.contato)}" target="_blank" class="btn-zap">📱 WhatsApp</a>
                ${btnEmail}
            </div>
            ${botoesHTML}
        </div>
    `;
}

function ativarBotoes() {
    const botoes = document.querySelectorAll('.btn-action');
    botoes.forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const id = e.target.getAttribute('data-id');
            const novoStatus = e.target.getAttribute('data-action');
            
            // Só executa se tiver ação real (ignora botões visuais)
            if(!novoStatus) return;

            e.target.innerText = "...";
            e.target.disabled = true;

            try {
                const pedidoRef = doc(db, "pedidos", id);
                
                // NOVO: Prepara os dados para atualizar
                const dadosUpdate = { status: novoStatus };
                
                // Se estiver mandando pro Arquivo (Recusado), carimba a data de hoje!
                if (novoStatus === "Recusado") {
                    dadosUpdate.data_arquivamento = serverTimestamp();
                }

                await updateDoc(pedidoRef, dadosUpdate);
            } catch (erro) {
                console.error(erro);
                alert("Erro ao atualizar.");
            }
        });
    });
}

function limparTelefone(tel) {
    return tel.replace(/\D/g, '');
}

// 🧹 FUNÇÃO NOVA: O FAXINEIRO
function limparArquivadosAntigos(lista) {
    const AGORA = new Date();
    const DIAS_LIMITE = 35;
    const MILISEGUNDOS_LIMITE = DIAS_LIMITE * 24 * 60 * 60 * 1000;

    lista.forEach(async (pedido) => {
        // Só olha quem tá no Arquivo E tem data de arquivamento gravada
        if (pedido.status === "Recusado" && pedido.data_arquivamento) {
            
            const dataArquivamento = pedido.data_arquivamento.toDate();
            const diferencaTempo = AGORA - dataArquivamento;

            // Se já passou de 35 dias (diferença maior que o limite)
            if (diferencaTempo > MILISEGUNDOS_LIMITE) {
                console.log(`🗑️ Deletando projeto antigo: ${pedido.cliente}`);
                
                // DELETA DO BANCO PRA SEMPRE
                try {
                    await deleteDoc(doc(db, "pedidos", pedido.id));
                } catch (err) {
                    console.error("Erro ao limpar automático:", err);
                }
            }
        }
    });
}