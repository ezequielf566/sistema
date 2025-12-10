/* =====================================================================
   SISTEMA FINANCEIRO — CONTRATOS.JS (VERSÃO FINAL COMPATÍVEL)
   Mantém toda a estrutura original do seu sistema.
   Apenas adiciona o envio ao motoboy nos 2 storages.
======================================================================== */

const STORAGE_CONTRATOS = "contratos_clientes";

/* --------------------------
   UTILITÁRIOS
--------------------------- */

function loadContratos() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_CONTRATOS)) || [];
  } catch (e) {
    console.error("Erro ao carregar contratos", e);
    return [];
  }
}

function saveContratos(lista) {
  localStorage.setItem(STORAGE_CONTRATOS, JSON.stringify(lista));
}

function showToast(msg) {
  const toast = document.getElementById("toastMessage");
  const box = document.getElementById("toast");
  if (!toast || !box) return;
  toast.textContent = msg;
  box.classList.add("show");
  setTimeout(() => box.classList.remove("show"), 2600);
}

/* ============================================================
   SALVAR CONTRATO (seu original mantido)
============================================================ */

function handleContractSave() {
  try {
    const nome = document.getElementById("clienteNome")?.value?.trim() || "";
    const cpf = document.getElementById("clienteCpf")?.value?.trim() || "";
    const rg = document.getElementById("clienteRg")?.value?.trim() || "";
    const telefone = document.getElementById("clienteTelefone")?.value?.trim() || "";
    const endereco = document.getElementById("clienteEndereco")?.value?.trim() || "";
    const cidade = document.getElementById("clienteCidade")?.value?.trim() || "";
    const estado = document.getElementById("clienteEstado")?.value?.trim() || "";

    const valorEmprestimo = Number(document.getElementById("valorEmprestimo")?.value || 0);
    const percentual = Number(document.getElementById("percentual")?.value || 0);
    const quantParcelas = Number(document.getElementById("quantParcelas")?.value || 0);
    const tipoJuros = document.getElementById("tipoJuros")?.value || "total";
    const diasJuros = Number(document.getElementById("diasJuros")?.value || 0);

    const parcelasNodes = document.querySelectorAll(".parcel-row");
    const parcelas = [];

    parcelasNodes.forEach(div => {
      const data = div.querySelector(".parcela-data")?.value;
      const valor = Number(div.querySelector(".parcela-valor")?.value || 0);
      if (data && valor) parcelas.push({ data, valor, pago: false });
    });

    if (!nome || !cpf || parcelas.length === 0) {
      showToast("Preencha os dados corretamente.");
      return;
    }

    const contratos = loadContratos();

    const contrato = {
      id: "ctr-" + Date.now(),
      criadoEm: new Date().toISOString(),
      cliente: { nome, cpf, rg, telefone, endereco, cidade, estado },
      valorEmprestimo,
      percentual,
      quantParcelas,
      tipoJuros,
      diasJuros,
      parcelas,
      documentos: [],
      envios: []  // histórico
    };

    contratos.push(contrato);
    saveContratos(contratos);

    showToast("Contrato salvo!");
  } catch (e) {
    console.error("Erro ao salvar contrato", e);
    showToast("Erro ao salvar contrato.");
  }
}

/* ============================================================
   GERAR PARCELAS AUTOMÁTICAS (mantido)
============================================================ */

document.getElementById("btnGerarParcelas")?.addEventListener("click", () => {
  try {
    const qtd = Number(document.getElementById("quantParcelas")?.value || 0);
    const valor = Number(document.getElementById("valorEmprestimo")?.value || 0);
    const percentual = Number(document.getElementById("percentual")?.value || 0);

    if (qtd <= 0 || valor <= 0) {
      showToast("Informe valor e parcelas.");
      return;
    }

    const total = valor + valor * (percentual / 100);
    const vlParcela = (total / qtd).toFixed(2);

    const wrapper = document.getElementById("parcelListWrapper");
    wrapper.innerHTML = "";

    const hoje = new Date();

    for (let i = 0; i < qtd; i++) {
      const d = new Date(hoje);
      d.setDate(d.getDate() + i);

      wrapper.innerHTML += `
        <div class="parcel-row">
          <input type="date" class="parcela-data" value="${d.toISOString().slice(0, 10)}">
          <input type="number" class="parcela-valor" step="0.01" value="${vlParcela}">
          <button type="button" class="btn-small-danger" onclick="this.parentElement.remove()">X</button>
        </div>
      `;
    }

    showToast("Parcelas geradas!");
  } catch (e) {
    console.error("Erro ao gerar parcelas", e);
  }
});

/* ============================================================
   ENVIO AO MOTOBOY — VERSÃO FINAL
============================================================ */

function enviarContratoMotoboy(contratoId) {
  try {
    const motoboyEmail = document.getElementById("motoboySelect")?.value;

    if (!motoboyEmail) {
      showToast("Selecione um motoboy.");
      return;
    }

    const contratos = loadContratos();
    const idx = contratos.findIndex(c => c.id === contratoId);

    if (idx === -1) {
      showToast("Contrato não encontrado.");
      return;
    }

    const contrato = contratos[idx];

    if (!Array.isArray(contrato.envios)) contrato.envios = [];

    const envio = {
      id: "env-" + Date.now(),
      motoboy: motoboyEmail,
      status: "pendente",
      enviadoEm: new Date().toISOString(),
      entregueEm: null
    };

    /* ✔ 1. SALVAR DENTRO DO CONTRATO */
    contrato.envios.push(envio);

    contratos[idx] = contrato;
    saveContratos(contratos);

    /* ✔ 2. SALVAR NA FILA GLOBAL DO MOTOBOY */
    let entregas = JSON.parse(localStorage.getItem("motoboy_entregas") || "[]");

    entregas.push({
      id: envio.id,
      contratoId: contrato.id,
      clienteNome: contrato.cliente.nome,
      clienteEndereco: contrato.cliente.endereco,
      clienteCidade: contrato.cliente.cidade,
      clienteEstado: contrato.cliente.estado,
      clienteTelefone: contrato.cliente.telefone,
      motoboy: motoboyEmail,
      status: "pendente",
      criadoEm: envio.enviadoEm
    });

    localStorage.setItem("motoboy_entregas", JSON.stringify(entregas));

    showToast("Enviado ao motoboy!");
  } catch (e) {
    console.error("Erro ao enviar ao motoboy", e);
    showToast("Erro ao enviar.");
  }
}

/* ============================================================
   FINAL DO ARQUIVO
============================================================ */
