/* =========================================================
   SISTEMA FINANCEIRO - PAINEL DO CAIXA
   Versão COMPLETA Atualizada
   ========================================================= */

const STORAGE_CURRENT_USER = "financeApp_currentUser";
const STORAGE_CLIENTES = "financeApp_clientes";
const STORAGE_CONTRACTS = "financeApp_contracts";
const STORAGE_LAST_CONTRACT_ID = "financeApp_lastContractId";
const STORAGE_ENVIOS = "financeApp_envios";
const STORAGE_USERS_KEY = "financeApp_users";

/* =========================================================
   TOAST
   ========================================================= */
function showToast(message) {
  const toast = document.getElementById("toast");
  const msg = document.getElementById("toastMessage");
  if (!toast || !msg) return;
  msg.textContent = message;
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), 2200);
}

/* =========================================================
   USUÁRIO LOGADO
   ========================================================= */
function getCurrentUser() {
  try {
    const raw = localStorage.getItem(STORAGE_CURRENT_USER);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function renderUserInfo() {
  const user = getCurrentUser();
  if (!user) return;

  const name = user.name || "Usuário";
  const headerUser = document.getElementById("headerUserName");
  const sidebarName = document.getElementById("sidebarName");
  
  if (headerUser) headerUser.textContent = name;
  if (sidebarName) sidebarName.textContent = name;
}

/* =========================================================
   STORAGE HELPER FUNCTIONS
   ========================================================= */
function loadFromStorage(key) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function saveToStorage(key, data) {
  localStorage.setItem(key, JSON.stringify(data));
}

/* =========================================================
   NAVEGAÇÃO ENTRE SEÇÕES
   ========================================================= */
function setupNavigation() {
  const buttons = document.querySelectorAll(".menu-item[data-section]");
  const sections = document.querySelectorAll(".panel-section");

  buttons.forEach(btn => {
    btn.addEventListener("click", () => {
      const target = btn.getAttribute("data-section");

      buttons.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");

      sections.forEach(sec => {
        sec.classList.remove("active");
        if (sec.id === "section-" + target) {
          sec.classList.add("active");
        }
      });

      const titleMap = {
        "novo-contrato": "Novo Contrato",
        "clientes": "Clientes",
        "envios": "Envios ao Motoboy"
      };
      const descMap = {
        "novo-contrato": "Cadastro completo de cliente e contrato.",
        "clientes": "Lista de clientes cadastrados.",
        "envios": "Histórico de envios ao motoboy."
      };

      document.getElementById("mainTitle").textContent = titleMap[target];
      document.querySelector(".panel-desc").textContent = descMap[target];
    });
  });
}

/* =========================================================
   PARCELAS - ADD LINE
   ========================================================= */
function addParcelRow(container, data = {}) {
  const div = document.createElement("div");
  div.className = "parcel-row";

  div.innerHTML = `
    <input type="date" class="parcela-data" value="${data.data || ""}">
    <input type="number" class="parcela-valor" step="0.01" value="${data.valor || ""}">
    <button type="button" class="btn-small-danger">X</button>
  `;

  div.querySelector("button").addEventListener("click", () => div.remove());

  container.appendChild(div);
}

/* =========================================================
   PARCELAS - GERAR AUTOMÁTICAS COM DATAS DIÁRIAS
   ========================================================= */
function gerarParcelasAutomaticas() {
  const valor = parseFloat(document.getElementById("valorEmprestimo").value || "0");
  const percentual = parseFloat(document.getElementById("percentual").value || "0");
  const tipoJuros = document.getElementById("tipoJuros")?.value || "total";
  const diasJuros = parseInt(document.getElementById("diasJuros")?.value || "0");
  const inputQtd = document.getElementById("quantParcelas");
  let qtd = parseInt(inputQtd?.value || "0");

  const wrapper = document.getElementById("parcelListWrapper");
  wrapper.innerHTML = "";

  if (!valor) {
    showToast("Preencha o valor emprestado.");
    return;
  }

  // Contrato em dias: número de parcelas = número de dias
  if (tipoJuros === "diario_total") {
    if (!diasJuros || diasJuros <= 0) {
      showToast("Informe a quantidade de dias do contrato.");
      return;
    }
    qtd = diasJuros;
    if (inputQtd) inputQtd.value = String(qtd);
  } else {
    if (!qtd || qtd <= 0) {
      showToast("Preencha a quantidade de parcelas.");
      return;
    }
  }

  let valorParcela = 0;

  // Juros sobre valor total
  if (tipoJuros === "total") {
    const totalComJuros = valor + (valor * (percentual / 100));
    valorParcela = totalComJuros / qtd;
  }
  // Juros mensal (por parcela)
  else if (tipoJuros === "mensal") {
    const base = valor / qtd;
    valorParcela = base + (base * (percentual / 100));
  }
  // Contrato em dias: percentual sobre o valor total, dividido por dia
  else if (tipoJuros === "diario_total") {
    const totalComJuros = valor + (valor * (percentual / 100));
    valorParcela = totalComJuros / qtd;
  }

  const hoje = new Date();

  if (tipoJuros === "diario_total") {
    // Uma parcela por dia
    for (let i = 0; i < qtd; i++) {
      const d = new Date(hoje);
      d.setDate(d.getDate() + (i + 1));
      addParcelRow(wrapper, {
        data: d.toISOString().slice(0, 10),
        valor: valorParcela.toFixed(2)
      });
    }
  } else {
    // Parcelas mensais: 30 em 30 dias
    for (let i = 0; i < qtd; i++) {
      const d = new Date(hoje);
      const offsetDias = 30 * (i + 1);
      d.setDate(d.getDate() + offsetDias);
      addParcelRow(wrapper, {
        data: d.toISOString().slice(0, 10),
        valor: valorParcela.toFixed(2)
      });
    }
  }

  showToast("Parcelas geradas.");
}
/* =========================================================
   COLETAR PARCELAS
   ========================================================= */
function collectParcelas() {
  const wrapper = document.getElementById("parcelListWrapper");
  const linhas = wrapper.querySelectorAll(".parcel-row");
  const lista = [];

  linhas.forEach(linha => {
    const data = linha.querySelector(".parcela-data").value;
    const valor = parseFloat(linha.querySelector(".parcela-valor").value || "0");
    if (data && valor) lista.push({ data, valor });
  });

  return lista;
}

/* =========================================================
   DOCUMENTOS
   ========================================================= */
let docsTemp = [];

function setupDocsUpload() {
  const input = document.getElementById("docsUpload");
  const list = document.getElementById("docsList");

  input.addEventListener("change", () => {
    docsTemp = [];
    list.innerHTML = "";
    
    Array.from(input.files).forEach(file => {
      docsTemp.push({
        nome: file.name,
        tipo: file.type,
        tamanho: file.size
      });

      const div = document.createElement("div");
      div.className = "docs-item";
      div.innerHTML = `
        <span>${file.name}</span>
        <span class="docs-status saved">OK</span>
      `;
      list.appendChild(div);
    });
  });
}

function collectDocs() {
  return docsTemp.slice();
}

/* =========================================================
   SALVAR CONTRATO
   ========================================================= */
function handleContractSave() {
  const clienteNome = document.getElementById("clienteNome").value.trim();
  const clienteCpf = document.getElementById("clienteCpf").value.trim();
  const clienteRg = document.getElementById("clienteRg").value.trim();
  const clienteTelefone = document.getElementById("clienteTelefone").value.trim();
  const clienteEndereco = document.getElementById("clienteEndereco").value.trim();
  const clienteCidade = document.getElementById("clienteCidade").value.trim();
  const clienteEstado = document.getElementById("clienteEstado").value.trim();

  const valorEmprestimo = parseFloat(document.getElementById("valorEmprestimo").value);
  const percentual = parseFloat(document.getElementById("percentual").value);
  let quantParcelas = parseInt(document.getElementById("quantParcelas").value);
  const tipoJuros = document.getElementById("tipoJuros")?.value || "total";
  const diasJuros = parseInt(document.getElementById("diasJuros")?.value || "0");

  if (!clienteNome || !valorEmprestimo || !percentual) {
    showToast("Campos obrigatórios faltando.");
    return null;
  }

  // Regras para quantidade de parcelas
  if (tipoJuros === "diario_total") {
    if (!diasJuros || diasJuros <= 0) {
      showToast("Informe a quantidade de dias do contrato.");
      return null;
    }
    if (!quantParcelas || quantParcelas <= 0) {
      quantParcelas = diasJuros;
      const qtdInput = document.getElementById("quantParcelas");
      if (qtdInput) qtdInput.value = String(quantParcelas);
    }
  } else {
    if (!quantParcelas || quantParcelas <= 0) {
      showToast("Informe a quantidade de parcelas.");
      return null;
    }
  }

  let parcelas = collectParcelas();
  // Se não houver parcelas preenchidas manualmente, gera automaticamente
  if (!parcelas.length) {
    gerarParcelasAutomaticas();
    parcelas = collectParcelas();
  }

  const docs = collectDocs();

  /* === Salvar cliente ================================= */
  let clientes = loadFromStorage(STORAGE_CLIENTES);
  let clienteIndex = clientes.findIndex(c => c.cpf === clienteCpf);

  if (clienteIndex === -1) {
    clientes.push({
      id: Date.now(),
      nome: clienteNome,
      cpf: clienteCpf,
      rg: clienteRg,
      telefone: clienteTelefone,
      endereco: clienteEndereco,
      cidade: clienteCidade,
      estado: clienteEstado
    });
    clienteIndex = clientes.length - 1;
    saveToStorage(STORAGE_CLIENTES, clientes);
  }

  /* === Salvar contrato ================================ */
  let contratos = loadFromStorage(STORAGE_CONTRACTS);
  const newId = Date.now();

  const contrato = {
    id: newId,
    clienteIndex,
    valorEmprestimo,
    percentual,
    quantParcelas,
    tipoJuros,
    diasJuros,
    parcelas,
    documentos: docs,
    criadoEm: new Date().toISOString()
  };

  contratos.push(contrato);
  saveToStorage(STORAGE_CONTRACTS, contratos);
  localStorage.setItem(STORAGE_LAST_CONTRACT_ID, String(newId));

  showToast("Contrato salvo!");
  renderClientesTable();

  return contrato;
}


/* =========================================================
   LISTAR MOTOBOYS
   ========================================================= */
function preencherMotoboys() {
  const select = document.getElementById("motoboySelect");

  let users = loadFromStorage(STORAGE_USERS_KEY);
  let mts = users.filter(u => u.role === "motoboy");

  if (!mts.length) {
    select.innerHTML = `<option value="">Nenhum motoboy cadastrado</option>`;
    select.disabled = true;
    return;
  }

  select.disabled = false;
  select.innerHTML = `<option value="">Selecione um motoboy</option>`;
  mts.forEach(m => {
    const opt = document.createElement("option");
    opt.value = m.email;
    opt.textContent = `${m.name} (${m.email})`;
    select.appendChild(opt);
  });
}


/* =========================================================
   ENVIAR AO MOTOBOY
   ========================================================= */
function enviarContratoMotoboy() {
  const selectEl = document.getElementById("motoboySelect");
  if (!selectEl) return;

  if (selectEl.disabled) {
    showToast("Nenhum motoboy cadastrado no sistema.");
    return;
  }

  const select = selectEl.value;

  if (!select) {
    showToast("Selecione um motoboy.");
    return;
  }

  const lastId = localStorage.getItem(STORAGE_LAST_CONTRACT_ID);
  const contratos = loadFromStorage(STORAGE_CONTRACTS);
  const contrato = contratos.find(c => String(c.id) === lastId);

  if (!contrato) {
    showToast("Nenhum contrato encontrado para envio.");
    return;
  }

  const clientes = loadFromStorage(STORAGE_CLIENTES);
  const cliente = clientes[contrato.clienteIndex];

  const envios = loadFromStorage(STORAGE_ENVIOS);

  envios.push({
    id: Date.now(),
    contratoId: contrato.id,
    motoboyEmail: select,
    clienteNome: cliente.nome,
    clienteCidade: cliente.cidade,
    documentos: contrato.documentos,
    enviadoEm: new Date().toISOString()
  });

  saveToStorage(STORAGE_ENVIOS, envios);

  showToast("Enviado ao motoboy.");
  renderEnviosTable();
}


/* =========================================================
   TABELAS (Clientes e Envios)
   ========================================================= */

function renderClientesTable() {
  const div = document.getElementById("clientesList");
  const clientes = loadFromStorage(STORAGE_CLIENTES);
  const contratos = loadFromStorage(STORAGE_CONTRACTS);

  if (!clientes.length) {
    div.innerHTML = "<p>Nenhum cliente cadastrado ainda.</p>";
    return;
  }

  let html = `
    <table class="table-list">
      <thead>
        <tr>
          <th>Nome</th>
          <th>CPF</th>
          <th>Status</th>
          <th style="text-align:center;">Ações</th>
        </tr>
      </thead>
      <tbody>
  `;

  clientes.forEach(cliente => {
    const contratosCliente = contratos
      .filter(c => clientes[c.clienteIndex]?.cpf === cliente.cpf)
      .sort((a, b) => new Date(b.criadoEm) - new Date(a.criadoEm));

    let statusTxt = "Sem contrato";
    let statusColor = "#e5e7eb";

    if (contratosCliente.length) {
      const ultimo = contratosCliente[0];
      const datas = ultimo.parcelas.map(p => new Date(p.data));
      const ultimaData = datas.sort((a, b) => b - a)[0];

      const hoje = new Date();
      const diff = Math.ceil((ultimaData - hoje) / (1000 * 60 * 60 * 24));

      if (diff < 0) {
        statusTxt = "Vencido";
        statusColor = "#fee2e2";
      } else if (diff <= 3) {
        statusTxt = "Próximo do vencimento";
        statusColor = "#fef9c3";
      } else {
        statusTxt = "Em andamento";
        statusColor = "#d1fae5";
      }
    }

    html += `
      <tr>
        <td>${cliente.nome}</td>
        <td>${cliente.cpf}</td>
        <td>
          <span style="
            background:${statusColor};
            padding:4px 10px;
            border-radius:6px;
            font-size:0.75rem;
            display:inline-block;
          ">
            ${statusTxt}
          </span>
        </td>
        <td style="text-align:center;">
          <button class="btn-small" style="margin-right:4px;" onclick="renovarContrato('${cliente.cpf}')">
            🔄 Renovar
          </button>
          <button class="btn-small" style="background:#25D366;color:white;" onclick="realizarCobranca('${cliente.telefone}', '${cliente.nome}')">
            🟢 WhatsApp
          </button>
        </td>
      </tr>
    `;
  });

  html += "</tbody></table>";
  div.innerHTML = html;
}

function renovarContrato(cpf) {
  const clientes = loadFromStorage(STORAGE_CLIENTES);
  const contratos = loadFromStorage(STORAGE_CONTRACTS);

  const cliente = clientes.find(c => c.cpf === cpf);
  if (!cliente) {
    alert("Cliente não encontrado.");
    return;
  }

  const contratosCliente = contratos
    .filter(c => clientes[c.clienteIndex]?.cpf === cpf)
    .sort((a, b) => new Date(b.criadoEm) - new Date(a.criadoEm));

  const ultimo = contratosCliente[0];
  if (!ultimo) {
    alert("Este cliente ainda não possui contrato salvo.");
    return;
  }

  document.getElementById("clienteNome").value = cliente.nome;
  document.getElementById("clienteCpf").value = cliente.cpf;
  document.getElementById("clienteRg").value = cliente.rg;
  document.getElementById("clienteTelefone").value = cliente.telefone;
  document.getElementById("clienteEndereco").value = cliente.endereco;
  document.getElementById("clienteCidade").value = cliente.cidade;
  document.getElementById("clienteEstado").value = cliente.estado;

  document.getElementById("valorEmprestimo").value = ultimo.valorEmprestimo;
  document.getElementById("percentual").value = ultimo.percentual;
  document.getElementById("quantParcelas").value = ultimo.quantParcelas;
  document.getElementById("tipoJuros").value = ultimo.tipoJuros;

  if (ultimo.tipoJuros === "diario_total") {
    document.getElementById("diasJuros").value = ultimo.diasJuros;
  }

  const wrapper = document.getElementById("parcelListWrapper");
  wrapper.innerHTML = "";

  (ultimo.parcelas || []).forEach(p => {
    const div = document.createElement("div");
    div.className = "parcel-row";
    div.innerHTML = `
      <input type="date" class="parcela-data" value="${p.data}">
      <input type="number" class="parcela-valor" value="${p.valor}">
      <button type="button" class="btn-small-danger" onclick="this.parentElement.remove()">X</button>
    `;
    wrapper.appendChild(div);
  });

  showToast("Contrato carregado para renovação.");
}

function realizarCobranca(telefone, nome) {
  if (!telefone) {
    alert("Cliente sem telefone cadastrado.");
    return;
  }

  const msg = encodeURIComponent(
    `Olá ${nome}! 😊\nEstou passando para lembrar sobre a pendência do seu contrato. Posso te ajudar com algo?`
  );

  const link = `https://wa.me/55${telefone.replace(/\D/g,'')}?text=${msg}`;
  window.open(link, "_blank");
}

function renderEnviosTable() {
  const div = document.getElementById("enviosList");
  const envios = loadFromStorage(STORAGE_ENVIOS);

  if (!envios.length) {
    div.innerHTML = "<p>Nenhum envio registrado.</p>";
    return;
  }

  let html = `
    <table class="table-list">
      <thead>
        <tr><th>Motoboy</th><th>Cliente</th><th>Cidade</th><th>Data</th></tr>
      </thead><tbody>
  `;

  envios.forEach(e => {
    html += `
      <tr>
        <td>${e.motoboyEmail}</td>
        <td>${e.clienteNome}</td>
        <td>${e.clienteCidade}</td>
        <td>${new Date(e.enviadoEm).toLocaleString()}</td>
      </tr>`;
  });

  html += "</tbody></table>";
  div.innerHTML = html;
}

/* =========================================================
   VISUALIZAR CONTRATO (PDF)
   ========================================================= */
function visualizarUltimoContrato() {
  // Sempre salva o contrato atual antes de visualizar
  const contrato = handleContractSave();
  if (!contrato) {
    return;
  }

  const clientes = loadFromStorage(STORAGE_CLIENTES);
  const cliente = clientes[contrato.clienteIndex];

  const parcelas = contrato.parcelas || [];
  const totalLinhas = Math.max(10, parcelas.length);

  let linhas = "";
  for (let i = 0; i < totalLinhas; i++) {
    const p = parcelas[i];
    linhas += `
      <tr>
        <td>${i + 1}</td>
        <td>${p?.data || ""}</td>
        <td>${p?.valor ? "R$ " + Number(p.valor).toFixed(2) : ""}</td>
      </tr>
    `;
  }

  let tipoLabel = "";
  if (contrato.tipoJuros === "total") {
    tipoLabel = "Percentual sobre o valor total";
  } else if (contrato.tipoJuros === "mensal") {
    tipoLabel = "Percentual mensal por parcela";
  } else if (contrato.tipoJuros === "diario_total") {
    tipoLabel = `Contrato em dias — ${contrato.percentual}% sobre o valor total em ${contrato.diasJuros} dias`;
  }

  const parcelasTextoMulta =
    "Segunda a sexta, multa de R$ 100,00. Terça, quarta e quinta, multa de R$ 40,00. Nos feriados, multa de R$ 200,00.";

  const win = window.open("", "_blank");
  win.document.write(`
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Contrato</title>
      <style>
        @page { size: A4; margin: 20mm; }
  body { font-family: Arial, sans-serif; margin:0; padding: 20px; position:relative; min-height:100%; }
  .header { display:flex; gap:12px; align-items:center; margin-bottom:12px; }
  .header-logo { width:80px; }
  table { width:100%; border-collapse:collapse; }
  th,td { border:1px solid #ccc; padding:6px; font-size:13px; }
  th { background:#eee; }
  .multa { margin-top:16px; font-size:12px; }

  /* 🔥 NOVO CSS DA ASSINATURA, NO FINAL E COM ESPAÇO PRA ASSINAR 🔥 */
  .assinatura-area {
    margin-top: 80px;
    text-align: center;
    page-break-inside: avoid;
  }

  .linha-assinatura {
    width: 260px;
    height: 40px;           /* espaço visual pra assinatura */
    margin: 0 auto 8px auto;
    border-bottom: 1px solid #111;
  }
      </style>
    </head>
    <body>

      <div class="header">
        <img src="../icons/logo.png" class="header-logo">
        <div>
          <h2>Contrato de Empréstimo</h2>
        </div>
      </div>

      <p><strong>Cliente:</strong> ${cliente.nome}</p>
      <p><strong>CPF:</strong> ${cliente.cpf} — <strong>RG:</strong> ${cliente.rg}</p>
      <p><strong>Endereço:</strong> ${cliente.endereco} — ${cliente.cidade}/${cliente.estado}</p>

      <p><strong>Valor emprestado:</strong> R$ ${contrato.valorEmprestimo.toFixed(2)}</p>
      <p><strong>Percentual:</strong> ${contrato.percentual}% — <strong>Tipo:</strong> ${tipoLabel}</p>

      <h3>Parcelas</h3>
      <table>
        <thead>
          <tr><th>#</th><th>Data</th><th>Valor</th></tr>
        </thead>
        <tbody>${linhas}</tbody>
      </table>

      <p class="multa">${parcelasTextoMulta}</p>

      <div class="assinatura-area">
        <div class="linha-assinatura"></div>
        <div>${cliente.nome}</div>
      </div>

      <script>window.print()</script>
    </body>
    </html>
  `);

  win.document.close();
}
/* =========================================================
   SISTEMA - ON LOAD
   ========================================================= */

function setupTipoJurosBehavior() {
  const select = document.getElementById("tipoJuros");
  const diasGroup = document.getElementById("diasJurosGroup");
  const diasInput = document.getElementById("diasJuros");
  const qtdInput = document.getElementById("quantParcelas");

  if (!select || !diasGroup || !diasInput) return;

  function update() {
    const usarDias = select.value === "diario_total";
    diasInput.disabled = !usarDias;
    diasGroup.style.opacity = usarDias ? "1" : "0.6";

    if (usarDias && qtdInput) {
      qtdInput.placeholder = "Será igual aos dias do contrato";
    } else if (qtdInput) {
      qtdInput.placeholder = "";
    }
  }

  select.addEventListener("change", update);
  update();
}


document.addEventListener("DOMContentLoaded", () => {
  const user = getCurrentUser();
  if (!user) {
    window.location.href = "../index.html";
    return;
  }

  renderUserInfo();
  setupNavigation();
  setupDocsUpload();
  preencherMotoboys();
  renderClientesTable();
  renderEnviosTable();

  setupTipoJurosBehavior();


  document.getElementById("btnLogoutHeader").addEventListener("click", () => {
    localStorage.removeItem(STORAGE_CURRENT_USER);
    window.location.href = "../index.html";
  });

  document.getElementById("btnGerarParcelas").addEventListener("click", gerarParcelasAutomaticas);
  document.getElementById("btnAdicionarParcela").addEventListener("click", () => {
    addParcelRow(document.getElementById("parcelListWrapper"));
  });

  const btnSalvar = document.getElementById("btnSalvarContrato");
  if (btnSalvar) {
    btnSalvar.addEventListener("click", () => {
      handleContractSave();
    });
  }

  document.getElementById("btnEnviarMotoboy").addEventListener("click", () => {
    const contrato = handleContractSave();
    if (contrato) enviarContratoMotoboy();
  });

  document.getElementById("btnVerContratoGerado").addEventListener("click", visualizarUltimoContrato);
});
