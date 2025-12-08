/* =========================================================
   SISTEMA — MÓDULO DE CONTRATO (VERSÃO ENXUTA)
   ========================================================= */

const STORAGE_CONTRATOS = "contratos_clientes";

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
   STORAGE HELPERS
   ========================================================= */
function loadContratos() {
  try {
    const raw = localStorage.getItem(STORAGE_CONTRATOS);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveContratos(lista) {
  localStorage.setItem(STORAGE_CONTRATOS, JSON.stringify(lista));
}

/* =========================================================
   ADICIONAR PARCELA MANUAL
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
   GERAR PARCELAS AUTOMATICAMENTE
   ========================================================= */
function gerarParcelasAutomaticas() {
  const valor = parseFloat(document.getElementById("valorEmprestimo").value || "0");
  const percentual = parseFloat(document.getElementById("percentual").value || "0");
  const qtd = parseInt(document.getElementById("quantParcelas").value || "0");

  if (!valor || !percentual || !qtd) {
    showToast("Preencha valor, percentual e quantidade de parcelas.");
    return;
  }

  const wrapper = document.getElementById("parcelListWrapper");
  wrapper.innerHTML = "";

  const totalComJuros = valor + (valor * (percentual / 100));
  const valorParcela = totalComJuros / qtd;

  const hoje = new Date();

  for (let i = 0; i < qtd; i++) {
    const d = new Date(hoje);
    d.setDate(d.getDate() + (i + 1));

    addParcelRow(wrapper, {
      data: d.toISOString().slice(0, 10),
      valor: valorParcela.toFixed(2)
    });
  }

  showToast("Parcelas geradas.");
}

/* =========================================================
   COLETAR PARCELAS
   ========================================================= */
function collectParcelas() {
  const wrapper = document.getElementById("parcelListWrapper");
  const rows = wrapper.querySelectorAll(".parcel-row");
  const list = [];

  rows.forEach(r => {
    const data = r.querySelector(".parcela-data").value;
    const valor = parseFloat(r.querySelector(".parcela-valor").value || "0");
    if (data && valor) list.push({ data, valor });
  });

  return list;
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
  return [...docsTemp];
}

/* =========================================================
   SALVAR CONTRATO
   ========================================================= */
function salvarContrato() {
  const nome = document.getElementById("clienteNome").value.trim();
  const cpf = document.getElementById("clienteCpf").value.trim();
  const telefone = document.getElementById("clienteTelefone").value.trim();
  const endereco = document.getElementById("clienteEndereco").value.trim();

  const valor = parseFloat(document.getElementById("valorEmprestimo").value || "0");
  const percentual = parseFloat(document.getElementById("percentual").value || "0");
  const parcelas = collectParcelas();
  const docs = collectDocs();

  if (!nome || !cpf || !valor || !percentual) {
    showToast("Campos obrigatórios faltando.");
    return null;
  }

  const contratos = loadContratos();
  const novo = {
    id: Date.now(),
    cliente: { nome, cpf, telefone, endereco },
    valor,
    percentual,
    parcelas,
    documentos: docs,
    criadoEm: new Date().toISOString()
  };

  contratos.push(novo);
  saveContratos(contratos);

  showToast("Contrato salvo!");
  return novo;
}

/* =========================================================
   VISUALIZAR CONTRATO (PDF)
   ========================================================= */
function visualizarContrato() {
  const contrato = salvarContrato();
  if (!contrato) return;

  const parcelas = contrato.parcelas;
  const linhas = parcelas.map((p, i) => `
    <tr>
      <td>${i + 1}</td>
      <td>${p.data}</td>
      <td>R$ ${p.valor.toFixed(2)}</td>
    </tr>
  `).join("");

  const win = window.open("", "_blank");

  win.document.write(`
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Contrato</title>
      <style>
        body { font-family: Arial; padding: 20px; }
        table { width:100%; border-collapse: collapse; }
        th,td { border:1px solid #ccc; padding:6px; }
      </style>
    </head>
    <body>

      <h2>Contrato de Empréstimo</h2>

      <p><strong>Cliente:</strong> ${contrato.cliente.nome}</p>
      <p><strong>CPF:</strong> ${contrato.cliente.cpf}</p>
      <p><strong>Endereço:</strong> ${contrato.cliente.endereco}</p>

      <p><strong>Valor:</strong> R$ ${contrato.valor.toFixed(2)}</p>
      <p><strong>Percentual:</strong> ${contrato.percentual}%</p>

      <h3>Parcelas</h3>

      <table>
        <thead><tr><th>#</th><th>Data</th><th>Valor</th></tr></thead>
        <tbody>${linhas}</tbody>
      </table>

      <script>window.print();</script>
    </body>
    </html>
  `);

  win.document.close();
}

/* =========================================================
   LOAD
   ========================================================= */
document.addEventListener("DOMContentLoaded", () => {
  setupDocsUpload();

  document.getElementById("btnGerarParcelas").addEventListener("click", gerarParcelasAutomaticas);
  document.getElementById("btnSalvarContrato").addEventListener("click", salvarContrato);
  document.getElementById("btnVerContratoGerado").addEventListener("click", visualizarContrato);
});
