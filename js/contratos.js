/* =========================================================
   CONTRATOS — MÓDULO COMPLETO DO MENU CONTRATOS
   Versão baseada no caixa.js original, porém com:
   - 1 único localStorage para dados: "contratos_clientes"
   - cliente embutido dentro do contrato
   ========================================================= */

// 🔑 Storage principal (cliente + contrato + parcelas + docs + envios)
const STORAGE_CONTRATOS = "contratos_clientes";

// 🔑 Storage de usuários (já existe no sistema, usado só para motoboy)
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
   HELPERS DE STORAGE
   ========================================================= */
function loadContratos() {
  try {
    const raw = localStorage.getItem(STORAGE_CONTRATOS);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function saveContratos(lista) {
  localStorage.setItem(STORAGE_CONTRATOS, JSON.stringify(lista));
}

function loadUsers() {
  try {
    const raw = localStorage.getItem(STORAGE_USERS_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

/* =========================================================
   PARCELAS - ADD LINE
   (igual ao original)
   ========================================================= */
function addParcelRow(container, data = {}) {
  if (!container) return;
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
   PARCELAS - GERAR AUTOMÁTICAS
   (copiado da lógica original: total, mensal, diario_total)
   ========================================================= */
function gerarParcelasAutomaticas() {
  const valor = parseFloat(document.getElementById("valorEmprestimo").value || "0");
  const percentual = parseFloat(document.getElementById("percentual").value || "0");
  const tipoJuros = document.getElementById("tipoJuros")?.value || "total";
  const diasJuros = parseInt(document.getElementById("diasJuros")?.value || "0");
  const inputQtd = document.getElementById("quantParcelas");
  let qtd = parseInt(inputQtd?.value || "0");

  const wrapper = document.getElementById("parcelListWrapper");
  if (!wrapper) return;
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
  if (!wrapper) return [];
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
  if (!input || !list) return;

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
   SALVAR CONTRATO (AGORA EM UM ÚNICO STORAGE)
   - cliente embutido no objeto contrato
   ========================================================= */
function handleContractSave() {
  // Dados do cliente
  const clienteNome = document.getElementById("clienteNome").value.trim();
  const clienteCpf = document.getElementById("clienteCpf").value.trim();
  const clienteRg = document.getElementById("clienteRg").value.trim();
  const clienteTelefone = document.getElementById("clienteTelefone").value.trim();
  const clienteEndereco = document.getElementById("clienteEndereco").value.trim();
  const clienteCidade = document.getElementById("clienteCidade").value.trim();
  const clienteEstado = document.getElementById("clienteEstado").value.trim();

  // Dados do contrato
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

  // Parcelas
  let parcelas = collectParcelas();
  // Se não houver parcelas preenchidas manualmente, gera automaticamente
  if (!parcelas.length) {
    gerarParcelasAutomaticas();
    parcelas = collectParcelas();
  }

  const docs = collectDocs();

  // Montar objeto contrato completo (cliente embutido)
  const contratos = loadContratos();
  const newId = Date.now();

  const contrato = {
    id: newId,
    cliente: {
      nome: clienteNome,
      cpf: clienteCpf,
      rg: clienteRg,
      telefone: clienteTelefone,
      endereco: clienteEndereco,
      cidade: clienteCidade,
      estado: clienteEstado
    },
    valorEmprestimo,
    percentual,
    quantParcelas,
    tipoJuros,
    diasJuros,
    parcelas,
    documentos: docs,
    envios: [],              // histórico de envios ao motoboy (se houver)
    criadoEm: new Date().toISOString()
  };

  contratos.push(contrato);
  saveContratos(contratos);

  showToast("Contrato salvo!");

  return contrato;
}

/* =========================================================
   LISTAR MOTOBOYS
   (igual ao original, mas usando loadUsers local)
   ========================================================= */
function preencherMotoboys() {
  const select = document.getElementById("motoboySelect");
  if (!select) return;

  let users = loadUsers();
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
   ENVIAR CONTRATO AO MOTOBOY
   - agora grava envio dentro do próprio contrato (campo envios)
   ========================================================= */
function enviarContratoMotoboy(contratoId) {
  const selectEl = document.getElementById("motoboySelect");
  if (!selectEl) return;

  if (selectEl.disabled) {
    showToast("Nenhum motoboy cadastrado no sistema.");
    return;
  }

  const motoboyEmail = selectEl.value;

  if (!motoboyEmail) {
    showToast("Selecione um motoboy.");
    return;
  }

  const contratos = loadContratos();
  const idx = contratos.findIndex(c => c.id === contratoId);
  if (idx === -1) {
    showToast("Nenhum contrato encontrado para envio.");
    return;
  }

  const contrato = contratos[idx];

  if (!Array.isArray(contrato.envios)) {
    contrato.envios = [];
  }

  contrato.envios.push({
    id: Date.now(),
    motoboyEmail,
    enviadoEm: new Date().toISOString()
  });

  contratos[idx] = contrato;
  saveContratos(contratos);

  showToast("Enviado ao motoboy.");
}

/* =========================================================
   VISUALIZAR CONTRATO (PDF COMPLETO)
   - baseado no visualizarUltimoContrato original
   ========================================================= */
function visualizarContrato(contrato) {
  if (!contrato) return;

  const cliente = contrato.cliente || {};
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

        .assinatura-area {
          margin-top: 80px;
          text-align: center;
          page-break-inside: avoid;
        }

        .linha-assinatura {
          width: 260px;
          height: 40px;
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

      <p><strong>Cliente:</strong> ${cliente.nome || ""}</p>
      <p><strong>CPF:</strong> ${cliente.cpf || ""} — <strong>RG:</strong> ${cliente.rg || ""}</p>
      <p><strong>Endereço:</strong> ${cliente.endereco || ""} — ${(cliente.cidade || "")}/${(cliente.estado || "")}</p>

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
        <div>${cliente.nome || ""}</div>
      </div>

      <script>window.print()</script>
    </body>
    </html>
  `);

  win.document.close();
}

/* =========================================================
   COMPORTAMENTO DO TIPO DE JUROS
   (habilita/desabilita campo de dias igual ao original)
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

/* =========================================================
   INICIALIZAÇÃO DO MÓDULO (DOMContentLoaded)
   ========================================================= */
document.addEventListener("DOMContentLoaded", () => {
  // Upload de documentos
  setupDocsUpload();

  // Comportamento do tipo de juros
  setupTipoJurosBehavior();

  // Preencher motoboys (se houver)
  preencherMotoboys();

  // Botões
  const btnGerar = document.getElementById("btnGerarParcelas");
  const btnAdd = document.getElementById("btnAdicionarParcela");
  const btnSalvar = document.getElementById("btnSalvarContrato");
  const btnVer = document.getElementById("btnVerContratoGerado");
  const btnEnviar = document.getElementById("btnEnviarMotoboy");
  const wrapper = document.getElementById("parcelListWrapper");

  if (btnGerar) {
    btnGerar.addEventListener("click", gerarParcelasAutomaticas);
  }

  if (btnAdd && wrapper) {
    btnAdd.addEventListener("click", () => addParcelRow(wrapper));
  }

  if (btnSalvar) {
    btnSalvar.addEventListener("click", () => {
      handleContractSave();
    });
  }

  if (btnVer) {
    btnVer.addEventListener("click", () => {
      const contrato = handleContractSave();
      if (contrato) visualizarContrato(contrato);
    });
  }

  if (btnEnviar) {
    btnEnviar.addEventListener("click", () => {
      const contrato = handleContractSave();
      if (contrato) enviarContratoMotoboy(contrato.id);
    });
  }
});
