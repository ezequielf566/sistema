
const STORAGE_CURRENT_USER = "financeApp_currentUser";
const STORAGE_CLIENTES = "financeApp_clientes";
const STORAGE_CONTRACTS = "financeApp_contracts";
const STORAGE_LAST_CONTRACT_ID = "financeApp_lastContractId";
const STORAGE_ENVIOS = "financeApp_envios";
const STORAGE_USERS_KEY = "financeApp_users";

function showToast(message) {
  const toast = document.getElementById("toast");
  const msg = document.getElementById("toastMessage");
  if (!toast || !msg) return;
  msg.textContent = message;
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), 2600);
}

function getCurrentUser() {
  try {
    const raw = localStorage.getItem(STORAGE_CURRENT_USER);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (e) {
    console.error(e);
    return null;
  }
}

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

function renderUserInfo() {
  const user = getCurrentUser();
  if (!user) return;
  const name = user.name || "Caixa";
  const headerUser = document.getElementById("headerUserName");
  const sidebarName = document.getElementById("sidebarName");
  if (headerUser) headerUser.textContent = name;
  if (sidebarName) sidebarName.textContent = name;
}

function setupNavigation() {
  const items = document.querySelectorAll(".menu-item");
  const sections = document.querySelectorAll(".panel-section");
  items.forEach(btn => {
    const sectionId = btn.getAttribute("data-section");
    if (!sectionId) return;
    btn.addEventListener("click", () => {
      if (btn.classList.contains("disabled")) return;
      items.forEach(i => i.classList.remove("active"));
      btn.classList.add("active");
      sections.forEach(sec => {
        if (sec.id === "section-" + sectionId) {
          sec.classList.add("active");
        } else {
          sec.classList.remove("active");
        }
      });
      const titleMap = {
        "novo-contrato": "Novo Contrato",
        "clientes": "Clientes",
        "envios": "Envios ao Motoboy"
      };
      const descMap = {
        "novo-contrato": "Cadastro completo de cliente, contrato, documentos e envio.",
        "clientes": "Lista de clientes cadastrados neste dispositivo.",
        "envios": "Histórico de envios de contratos para motoboys."
      };
      const mainTitle = document.getElementById("mainTitle");
      const panelDesc = document.querySelector(".panel-desc");
      if (mainTitle && titleMap[sectionId]) mainTitle.textContent = titleMap[sectionId];
      if (panelDesc && descMap[sectionId]) panelDesc.textContent = descMap[sectionId];
    });
  });
}

function addParcelRow(container, data = {}) {
  const row = document.createElement("div");
  row.className = "parcel-row";
  row.innerHTML = `
    <input type="date" class="parcela-data" value="${data.data || ""}">
    <input type="number" step="0.01" class="parcela-valor" placeholder="Valor" value="${data.valor || ""}">
    <button type="button" class="btn-small-danger">Remover</button>
  `;
  row.querySelector("button").addEventListener("click", () => row.remove());
  container.appendChild(row);
}

function gerarParcelasAutomaticas() {
  const valor = parseFloat(document.getElementById("valorEmprestimo").value || "0");
  const qtd = parseInt(document.getElementById("quantParcelas").value || "0", 10);
  const wrapper = document.getElementById("parcelListWrapper");
  if (!wrapper) return;
  wrapper.innerHTML = "";
  if (!valor || !qtd || qtd <= 0) {
    showToast("Informe valor e quantidade de parcelas.");
    return;
  }
  const valorParcela = (valor / qtd);
  for (let i = 0; i < qtd; i++) {
    addParcelRow(wrapper, { valor: valorParcela.toFixed(2) });
  }
}

function collectParcelas() {
  const wrapper = document.getElementById("parcelListWrapper");
  if (!wrapper) return [];
  const rows = wrapper.querySelectorAll(".parcel-row");
  const list = [];
  rows.forEach(row => {
    const dataInput = row.querySelector(".parcela-data");
    const valorInput = row.querySelector(".parcela-valor");
    const data = dataInput ? dataInput.value : "";
    const valor = valorInput ? parseFloat(valorInput.value || "0") : 0;
    if (data && valor) {
      list.push({ data, valor });
    }
  });
  return list;
}

function handleContractSave() {
  const clienteNome = document.getElementById("clienteNome").value.trim();
  const clienteCpf = document.getElementById("clienteCpf").value.trim();
  const clienteRg = document.getElementById("clienteRg").value.trim();
  const clienteTelefone = document.getElementById("clienteTelefone").value.trim();
  const clienteEndereco = document.getElementById("clienteEndereco").value.trim();
  const clienteCidade = document.getElementById("clienteCidade").value.trim();
  const clienteEstado = document.getElementById("clienteEstado").value.trim();

  const valorEmprestimo = parseFloat(document.getElementById("valorEmprestimo").value || "0");
  const percentual = parseFloat(document.getElementById("percentual").value || "0");
  const quantParcelas = parseInt(document.getElementById("quantParcelas").value || "0", 10);

  if (!clienteNome || !valorEmprestimo || !percentual || !quantParcelas) {
    showToast("Preencha nome, valor, porcentagem e quantidade de parcelas.");
    return null;
  }

  const parcelas = collectParcelas();
  const docs = collectDocs();

  const clientes = loadFromStorage(STORAGE_CLIENTES);
  let clienteId = clientes.findIndex(c => c.cpf === clienteCpf && clienteCpf);
  if (clienteId === -1) {
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
    clienteId = clientes.length - 1;
    saveToStorage(STORAGE_CLIENTES, clientes);
  }

  const contracts = loadFromStorage(STORAGE_CONTRACTS);
  const newId = Date.now();
  const contrato = {
    id: newId,
    clienteIndex: clienteId,
    valorEmprestimo,
    percentual,
    quantParcelas,
    parcelas,
    documentos: docs,
    criadoEm: new Date().toISOString()
  };
  contracts.push(contrato);
  saveToStorage(STORAGE_CONTRACTS, contracts);
  localStorage.setItem(STORAGE_LAST_CONTRACT_ID, String(newId));

  showToast("Contrato salvo com sucesso.");
  renderClientesTable();
  return contrato;
}

let docsTemp = [];

function collectDocs() {
  return docsTemp.slice();
}

function setupDocsUpload() {
  const input = document.getElementById("docsUpload");
  const list = document.getElementById("docsList");
  if (!input || !list) return;

  input.addEventListener("change", () => {
    docsTemp = [];
    list.innerHTML = "";
    Array.from(input.files || []).forEach(file => {
      docsTemp.push({
        nome: file.name,
        tamanho: file.size,
        tipo: file.type
      });
    });

    docsTemp.forEach(d => {
      const div = document.createElement("div");
      div.className = "docs-item";
      div.innerHTML = `
        <span>${d.nome}</span>
        <span class="docs-status pending">Pendente envio</span>
      `;
      list.appendChild(div);
    });
  });
}

function preencherMotoboys() {
  const select = document.getElementById("motoboySelect");
  if (!select) return;
  const usersRaw = localStorage.getItem(STORAGE_USERS_KEY);
  let users = [];
  if (usersRaw) {
    try { users = JSON.parse(usersRaw); } catch {}
  }
  const motoboys = users.filter(u => u.role === "motoboy");
  select.innerHTML = `<option value="">Selecione um motoboy cadastrado</option>`;
  motoboys.forEach(m => {
    const opt = document.createElement("option");
    opt.value = m.email;
    opt.textContent = `${m.name} (${m.email})`;
    select.appendChild(opt);
  });
}

function enviarContratoMotoboy() {
  const select = document.getElementById("motoboySelect");
  if (!select || !select.value) {
    showToast("Selecione um motoboy.");
    return;
  }
  const lastId = localStorage.getItem(STORAGE_LAST_CONTRACT_ID);
  if (!lastId) {
    showToast("Nenhum contrato encontrado para envio.");
    return;
  }
  const contracts = loadFromStorage(STORAGE_CONTRACTS);
  const contrato = contracts.find(c => String(c.id) === String(lastId));
  if (!contrato) {
    showToast("Contrato não localizado.");
    return;
  }
  const clientes = loadFromStorage(STORAGE_CLIENTES);
  const cliente = clientes[contrato.clienteIndex];

  const envios = loadFromStorage(STORAGE_ENVIOS);
  envios.push({
    id: Date.now(),
    contratoId: contrato.id,
    motoboyEmail: select.value,
    clienteNome: cliente ? cliente.nome : "",
    clienteCidade: cliente ? cliente.cidade : "",
    documentos: contrato.documentos,
    enviadoEm: new Date().toISOString()
  });
  saveToStorage(STORAGE_ENVIOS, envios);

  showToast("Envio registrado para o motoboy.");
  renderEnviosTable();
}

function renderClientesTable() {
  const container = document.getElementById("clientesList");
  if (!container) return;
  const clientes = loadFromStorage(STORAGE_CLIENTES);
  if (!clientes.length) {
    container.innerHTML = "<p>Nenhum cliente cadastrado ainda.</p>";
    return;
  }
  let html = '<table class="table-list"><thead><tr><th>Nome</th><th>CPF</th><th>Cidade</th><th>Telefone</th></tr></thead><tbody>';
  clientes.forEach(c => {
    html += `<tr><td>${c.nome}</td><td>${c.cpf || "-"}</td><td>${c.cidade || "-"}</td><td>${c.telefone || "-"}</td></tr>`;
  });
  html += "</tbody></table>";
  container.innerHTML = html;
}

function renderEnviosTable() {
  const container = document.getElementById("enviosList");
  if (!container) return;
  const envios = loadFromStorage(STORAGE_ENVIOS);
  if (!envios.length) {
    container.innerHTML = "<p>Nenhum envio registrado.</p>";
    return;
  }
  let html = '<table class="table-list"><thead><tr><th>Motoboy</th><th>Cliente</th><th>Cidade</th><th>Data envio</th></tr></thead><tbody>';
  envios.forEach(e => {
    const data = new Date(e.enviadoEm).toLocaleString();
    html += `<tr><td>${e.motoboyEmail}</td><td>${e.clienteNome}</td><td>${e.clienteCidade}</td><td>${data}</td></tr>`;
  });
  html += "</tbody></table>";
  container.innerHTML = html;
}

function visualizarUltimoContrato() {
  const lastId = localStorage.getItem(STORAGE_LAST_CONTRACT_ID);
  if (!lastId) {
    showToast("Nenhum contrato gerado ainda.");
    return;
  }
  const contracts = loadFromStorage(STORAGE_CONTRACTS);
  const contrato = contracts.find(c => String(c.id) === String(lastId));
  if (!contrato) {
    showToast("Contrato não localizado.");
    return;
  }
  const clientes = loadFromStorage(STORAGE_CLIENTES);
  const cliente = clientes[contrato.clienteIndex];

  const win = window.open("", "_blank");
  if (!win) return;
  const parcelasHtml = contrato.parcelas.map((p, idx) => `
    <tr>
      <td>${idx + 1}</td>
      <td>${p.data}</td>
      <td>R$ ${Number(p.valor).toFixed(2)}</td>
    </tr>
  `).join("");

  win.document.write(`
    <html>
    <head>
      <meta charset="UTF-8" />
      <title>Contrato - ${cliente ? cliente.nome : ""}</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 24px; }
        h1 { font-size: 20px; margin-bottom: 8px; }
        h2 { font-size: 16px; margin-top: 18px; }
        table { width: 100%; border-collapse: collapse; margin-top: 8px; }
        th, td { border: 1px solid #e5e7eb; padding: 6px 8px; font-size: 13px; }
        th { background: #f3f4f6; text-align: left; }
        .linha { margin-top: 18px; border-top: 1px solid #111827; width: 260px; }
        .assinatura { margin-top: 4px; font-size: 13px; }
        .small { font-size: 12px; color: #4b5563; margin-top: 12px; }
      </style>
    </head>
    <body>
      <h1>Contrato de Empréstimo</h1>
      <p><strong>Empresa:</strong> Nome da Empresa — CNPJ 00.000.000/0000-00</p>
      <p><strong>Cliente:</strong> ${cliente ? cliente.nome : ""}</p>
      <p><strong>CPF:</strong> ${cliente ? cliente.cpf : ""} — <strong>RG:</strong> ${cliente ? cliente.rg : ""}</p>
      <p><strong>Endereço:</strong> ${cliente ? cliente.endereco : ""} — ${cliente ? cliente.cidade : ""}/${cliente ? cliente.estado : ""}</p>

      <h2>Dados do Empréstimo</h2>
      <p><strong>Valor emprestado:</strong> R$ ${Number(contrato.valorEmprestimo).toFixed(2)}</p>
      <p><strong>Porcentagem:</strong> ${contrato.percentual}% — <strong>Quantidade de parcelas:</strong> ${contrato.quantParcelas}</p>

      <h2>Parcelas</h2>
      <table>
        <thead>
          <tr><th>#</th><th>Vencimento</th><th>Valor</th></tr>
        </thead>
        <tbody>
          ${parcelasHtml}
        </tbody>
      </table>

      <p class="small">
        Segunda a sexta, multa de R$ 100,00. Terça, quarta e quinta, multa de R$ 40,00.
        Nos feriados, multa de R$ 200,00.
      </p>

      <div class="linha"></div>
      <div class="assinatura">${cliente ? cliente.nome : ""}</div>

      <script>
        window.print();
      </script>
    </body>
    </html>
  `);
  win.document.close();
}

document.addEventListener("DOMContentLoaded", () => {
  // segurança básica: se não tiver usuário atual, manda para login
  const user = getCurrentUser();
  if (!user) {
    window.location.href = "../index.html";
    return;
  }
  if (user.role !== "caixa") {
    // rota mesmo assim, mas ideal seria bloquear
  }

  renderUserInfo();
  setupNavigation();
  setupDocsUpload();
  preencherMotoboys();
  renderClientesTable();
  renderEnviosTable();

  const btnLogout = document.getElementById("btnLogout");
  if (btnLogout) {
    btnLogout.addEventListener("click", () => {
      localStorage.removeItem(STORAGE_CURRENT_USER);
      window.location.href = "../index.html";
    });
  }

  const btnGerarParcelas = document.getElementById("btnGerarParcelas");
  if (btnGerarParcelas) btnGerarParcelas.addEventListener("click", gerarParcelasAutomaticas);

  const btnAdicionarParcela = document.getElementById("btnAdicionarParcela");
  if (btnAdicionarParcela) {
    btnAdicionarParcela.addEventListener("click", () => {
      const wrapper = document.getElementById("parcelListWrapper");
      if (wrapper) addParcelRow(wrapper);
    });
  }

  const btnEnviarMotoboy = document.getElementById("btnEnviarMotoboy");
  if (btnEnviarMotoboy) btnEnviarMotoboy.addEventListener("click", () => {
    const contrato = handleContractSave();
    if (contrato) enviarContratoMotoboy();
  });

  const btnVerContratoGerado = document.getElementById("btnVerContratoGerado");
  if (btnVerContratoGerado) btnVerContratoGerado.addEventListener("click", visualizarUltimoContrato);
});
