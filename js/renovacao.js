/* =========================================================
   RENOVAÇÃO - Módulo separado
   ========================================================= */

const STORAGE_CLIENTES = "financeApp_clientes";
const STORAGE_USERS = "financeApp_users";
const STORAGE_RENOVACOES = "financeApp_renovacoes";
const STORAGE_CURRENT_USER = "financeApp_currentUser";

let renDocsTemp = [];
let funcionarioSelecionado = null;

/* UTIL */
function loadStorage(key) {
  return JSON.parse(localStorage.getItem(key) || "[]");
}

function saveStorage(key, data) {
  localStorage.setItem(key, JSON.stringify(data));
}

function toast(msg) {
  const t = document.getElementById("toast");
  const tm = document.getElementById("toastMessage");
  tm.textContent = msg;
  t.classList.add("show");
  setTimeout(() => t.classList.remove("show"), 2000);
}

/* =========================================================
   BUSCAR CLIENTE POR CPF
   ========================================================= */
document.getElementById("btnBuscarRenovacao").addEventListener("click", () => {
  const cpf = document.getElementById("renovacaoCpf").value.trim();
  if (!cpf) return toast("Digite um CPF.");

  const clientes = loadStorage(STORAGE_CLIENTES);
  const cliente = clientes.find(c => c.cpf === cpf);

  if (!cliente) {
    toast("Cliente não encontrado.");
    return;
  }

  // Preencher dados
  document.getElementById("renCliNome").textContent = cliente.nome;
  document.getElementById("renCliCpf").textContent = cliente.cpf;
  document.getElementById("renCliRg").textContent = cliente.rg;
  document.getElementById("renCliTelefone").textContent = cliente.telefone;
  document.getElementById("renCliEndereco").textContent = cliente.endereco;
  document.getElementById("renCliCidade").textContent = cliente.cidade;
  document.getElementById("renCliEstado").textContent = cliente.estado;

  document.getElementById("renovacaoDados").style.display = "block";
});

/* =========================================================
   UPLOAD DOCUMENTOS
   ========================================================= */
document.getElementById("renDocsUpload").addEventListener("change", (e) => {
  renDocsTemp = [];
  const list = document.getElementById("renDocsList");
  list.innerHTML = "";

  Array.from(e.target.files).forEach(f => {
    renDocsTemp.push({
      nome: f.name,
      tipo: f.type,
      tamanho: f.size
    });

    const div = document.createElement("div");
    div.className = "docs-item";
    div.innerHTML = `<span>${f.name}</span><span class="docs-status saved">OK</span>`;
    list.appendChild(div);
  });
});

/* =========================================================
   GERAR PEDIDO
   ========================================================= */
document.getElementById("btnGerarPedidoRenovacao").addEventListener("click", () => {

  const cpf = document.getElementById("renCliCpf").textContent;
  if (!cpf) return toast("Busque um cliente antes.");

  const funcionarios = loadStorage(STORAGE_USERS).filter(u => u.role !== "motoboy");

  const lista = document.getElementById("listaFuncionariosRenovacao");
  lista.innerHTML = "";

  funcionarios.forEach(f => {
    const div = document.createElement("div");
    div.className = "func-item";
    div.style = `
      padding:10px;
      border:1px solid #ddd;
      border-radius:8px;
      margin-bottom:8px;
      cursor:pointer;
    `;
    div.textContent = `${f.name} (${f.role})`;
    div.addEventListener("click", () => {
      funcionarioSelecionado = f;
      document.getElementById("btnEnviarRenovacao").disabled = false;

      // highlight
      lista.querySelectorAll(".func-item").forEach(e => e.style.background = "#fff");
      div.style.background = "#e0f2fe";
    });

    lista.appendChild(div);
  });

  document.getElementById("renovacaoFuncionarios").style.display = "block";
});

/* =========================================================
   ENVIAR RENOVAÇÃO
   ========================================================= */
document.getElementById("btnEnviarRenovacao").addEventListener("click", () => {

  if (!funcionarioSelecionado) return toast("Selecione um funcionário.");

  const cliente = {
    nome: document.getElementById("renCliNome").textContent,
    cpf: document.getElementById("renCliCpf").textContent,
    rg: document.getElementById("renCliRg").textContent,
    telefone: document.getElementById("renCliTelefone").textContent,
    endereco: document.getElementById("renCliEndereco").textContent,
    cidade: document.getElementById("renCliCidade").textContent,
    estado: document.getElementById("renCliEstado").textContent
  };

  const user = JSON.parse(localStorage.getItem(STORAGE_CURRENT_USER));

  const renovacoes = loadStorage(STORAGE_RENOVACOES);
  renovacoes.push({
    id: Date.now(),
    cliente,
    anexos: renDocsTemp,
    funcionarioDestino: funcionarioSelecionado.email,
    criadoPor: user?.email || "caixa",
    criadoEm: new Date().toISOString(),
    status: "pendente"
  });

  saveStorage(STORAGE_RENOVACOES, renovacoes);
  toast("Pedido de renovação enviado!");

  // Reset visual
  document.getElementById("renovacaoFuncionarios").style.display = "none";
  document.getElementById("renovacaoDados").style.display = "none";
  document.getElementById("btnEnviarRenovacao").disabled = true;
  funcionarioSelecionado = null;
});
