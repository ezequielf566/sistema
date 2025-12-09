// =======================================================
// clientes.js — Menu Clientes (Buscar + Ver contratos)
// SISTEMA 100% COMPATÍVEL COM contratos.js
// =======================================================

const STORAGE_CONTRATOS = "contratos_clientes";
let cacheContratos = [];

// -------------------------------------------------------
// Helpers de storage
// -------------------------------------------------------
function loadContratosClientes() {
  try {
    const raw = localStorage.getItem(STORAGE_CONTRATOS);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

// -------------------------------------------------------
// Agrupar por cidade → CPF → cliente
// -------------------------------------------------------
function agruparPorCidadeECliente(contratos) {
  const mapa = {};

  contratos.forEach(c => {
    if (!c || !c.cliente) return;

    const cidade = (c.cliente.cidade || "Sem cidade").trim() || "Sem cidade";
    const cpf = (c.cliente.cpf || "SEM CPF").trim() || "SEM CPF";

    if (!mapa[cidade]) mapa[cidade] = {};
    if (!mapa[cidade][cpf]) {
      mapa[cidade][cpf] = {
        cliente: c.cliente,
        contratos: []
      };
    }
    mapa[cidade][cpf].contratos.push(c);
  });

  return mapa;
}

// -------------------------------------------------------
// Aplicar filtro (nome, cpf, cidade)
// -------------------------------------------------------
function obterClientesEstruturados(filtroTexto) {
  const termo = (filtroTexto || "").toLowerCase().trim();
  const agrupado = agruparPorCidadeECliente(cacheContratos);
  const resultado = [];

  Object.keys(agrupado)
    .sort((a, b) => a.localeCompare(b))
    .forEach(cidade => {
      const mapaClientes = agrupado[cidade];
      const clientesArr = Object.values(mapaClientes);

      const filtrados = clientesArr.filter(item => {
        const cli = item.cliente || {};

        // AJUSTE 2 — garantir string sempre
        const nome = String(cli.nome || "").toLowerCase();
        const cpf = String(cli.cpf || "").toLowerCase();
        const cid = String(cli.cidade || "").toLowerCase();

        if (!termo) return true;
        return (
          nome.includes(termo) ||
          cpf.includes(termo) ||
          cid.includes(termo)
        );
      });

      if (filtrados.length) {
        resultado.push({
          cidade,
          clientes: filtrados.sort((a, b) => {
            const n1 = String(a.cliente?.nome || "").toLowerCase();
            const n2 = String(b.cliente?.nome || "").toLowerCase();
            return n1.localeCompare(n2);
          })
        });
      }
    });

  return resultado;
}

// -------------------------------------------------------
// Render da lista de clientes por cidade
// -------------------------------------------------------
function renderClientesLista(filtroTexto) {
  const container = document.getElementById("clientesResultado");
  const detalhes = document.getElementById("clienteContratosDetalhes");
  if (!container) return;

  const grupos = obterClientesEstruturados(filtroTexto);

  container.innerHTML = "";
  if (detalhes) detalhes.innerHTML = "";

  if (!grupos.length) {
    container.innerHTML = `<p style="opacity:.7;font-size:.85rem;">Nenhum cliente encontrado.</p>`;
    return;
  }

  let html = "";

  grupos.forEach(grupo => {
    html += `<div class="clientes-cidade-bloco">`;
    html += `<div class="clientes-cidade-titulo">${grupo.cidade}</div>`;

    grupo.clientes.forEach(item => {
      const cli = item.cliente || {};
      const qtdContratos = item.contratos.length;
      const nomeExibicao = cli.nome || "Sem nome";
      const cpfExibicao = cli.cpf ? ` (${cli.cpf})` : "";

      html += `
        <div class="cliente-linha">
          <span>${nomeExibicao}${cpfExibicao}</span>
          <button
            class="btn-small"
            data-acao="ver-contratos"
            data-cpf="${cli.cpf || ""}">
            Ver contratos (${qtdContratos})
          </button>
        </div>
      `;
    });

    html += `</div>`;
  });

  container.innerHTML = html;
}

// -------------------------------------------------------
// Formatar datas (seguro mesmo se undefined)
// -------------------------------------------------------
function formatarDataHora(isoStr) {
  if (!isoStr) return "";
  const d = new Date(isoStr);
  if (isNaN(d.getTime())) return "";

  const dia = String(d.getDate()).padStart(2, "0");
  const mes = String(d.getMonth() + 1).padStart(2, "0");
  const ano = d.getFullYear();
  const hora = String(d.getHours()).padStart(2, "0");
  const min = String(d.getMinutes()).padStart(2, "0");

  return `${dia}/${mes}/${ano} ${hora}:${min}`;
}

// -------------------------------------------------------
// Mostrar contratos do cliente
// -------------------------------------------------------
function mostrarContratosDoCliente(cpf) {
  const detalhes = document.getElementById("clienteContratosDetalhes");
  if (!detalhes) return;

  const contratosCliente = cacheContratos
    .filter(c => (c.cliente?.cpf || "") === cpf)
    .sort((a, b) => {
      const da = new Date(a.criadoEm || 0).getTime();
      const db = new Date(b.criadoEm || 0).getTime();
      return db - da;
    });

  if (!contratosCliente.length) {
    detalhes.innerHTML = `<p style="opacity:.7;font-size:.85rem;">Nenhum contrato encontrado.</p>`;
    return;
  }

  const cli = contratosCliente[0].cliente || {};
  const nome = cli.nome || "Cliente";
  const cpfExibicao = cli.cpf || "";

  let html = `
    <div class="card-new">
      <h3 class="card-title">Contratos de ${nome}</h3>
      <p style="font-size:.8rem; opacity:.75; margin-bottom:8px;">
        CPF: ${cpfExibicao}
      </p>
  `;

  contratosCliente.forEach(contrato => {
    // AJUSTE 4 — fallback seguro
    const dataFormatada = formatarDataHora(contrato.criadoEm) || "Sem data";

    html += `
      <div class="cliente-contrato-row">
        <span>${dataFormatada}</span>
        <button
          class="btn-small btn-outline"
          data-acao="abrir-contrato"
          data-id="${contrato.id}">
          Abrir contrato
        </button>
        <button
          class="btn-small btn-primary-small"
          data-acao="renovar-contrato"
          data-id="${contrato.id}">
          Renovação
        </button>
      </div>
    `;
  });

  html += `</div>`;
  detalhes.innerHTML = html;
}

// -------------------------------------------------------
// Renovar contrato → preencher o cliente no menu Contratos
// -------------------------------------------------------
function renovarContratoPorId(id) {
  const contrato = cacheContratos.find(c => c.id === id);
  if (!contrato || !contrato.cliente) return;

  const cliente = contrato.cliente;

  // Ir para o menu Contratos
  const btnContratos = document.querySelector('.menu-item[data-section="novo-contrato"]');
  if (btnContratos) btnContratos.click();

  // Preencher dados pessoais
  const campos = {
    clienteNome: cliente.nome || "",
    clienteCpf: cliente.cpf || "",
    clienteRg: cliente.rg || "",
    clienteTelefone: cliente.telefone || "",
    clienteEndereco: cliente.endereco || "",
    clienteCidade: cliente.cidade || "",
    clienteEstado: cliente.estado || ""
  };
  Object.keys(campos).forEach(idCampo => {
    const el = document.getElementById(idCampo);
    if (el) el.value = campos[idCampo];
  });

  // LIMPAR CAMPOS DE CONTRATO
  const limpar = id => {
    const el = document.getElementById(id);
    if (el) el.value = "";
  };

  limpar("valorEmprestimo");
  limpar("percentual");
  limpar("quantParcelas");
  limpar("diasJuros");

  const tipoJuros = document.getElementById("tipoJuros");
  if (tipoJuros) tipoJuros.value = "total";

  const parcelWrapper = document.getElementById("parcelListWrapper");
  if (parcelWrapper) parcelWrapper.innerHTML = "";

  const docsList = document.getElementById("docsList");
  if (docsList) docsList.innerHTML = "";

  const docsUpload = document.getElementById("docsUpload");
  if (docsUpload) docsUpload.value = "";

  // AJUSTE 8 — Zerar docsTemp para evitar contaminação
  if (typeof docsTemp !== "undefined") docsTemp = [];

  // AJUSTE 6 — Reativar comportamento do tipo de juros
  if (typeof setupTipoJurosBehavior === "function") setupTipoJurosBehavior();
}

// -------------------------------------------------------
// Inicialização
// -------------------------------------------------------
document.addEventListener("DOMContentLoaded", () => {
  cacheContratos = loadContratosClientes();

  renderClientesLista("");

  const searchInput = document.getElementById("clienteSearchInput");
  const clienteContratosDetalhes = document.getElementById("clienteContratosDetalhes");

  // AJUSTE 9 — Debounce
  let clienteBuscaTimer = null;

  if (searchInput) {
    searchInput.addEventListener("input", () => {
      // AJUSTE 5 — limpar detalhes ao digitar
      if (clienteContratosDetalhes) clienteContratosDetalhes.innerHTML = "";

      clearTimeout(clienteBuscaTimer);
      clienteBuscaTimer = setTimeout(() => {
        renderClientesLista(searchInput.value);
      }, 200);
    });
  }

  // Clique em "Ver contratos (N)"
  const lista = document.getElementById("clientesResultado");
  if (lista) {
    lista.addEventListener("click", ev => {
      const btn = ev.target.closest("button[data-acao]");
      if (!btn) return;

      const acao = btn.getAttribute("data-acao");
      const cpf = btn.getAttribute("data-cpf");

      if (acao === "ver-contratos" && cpf) {
        mostrarContratosDoCliente(cpf);
      }
    });
  }

  // Clique em Abrir contrato ou Renovação
  const detalhes = document.getElementById("clienteContratosDetalhes");
  if (detalhes) {
    detalhes.addEventListener("click", ev => {
      const btn = ev.target.closest("button[data-acao]");
      if (!btn) return;

      const acao = btn.getAttribute("data-acao");
      const id = parseInt(btn.getAttribute("data-id") || "0", 10);
      if (!id) return;

      const contrato = cacheContratos.find(c => c.id === id);
      if (!contrato) return;

      if (acao === "abrir-contrato") {
        if (typeof visualizarContrato === "function") {
          visualizarContrato(contrato);
        }
      } else if (acao === "renovar-contrato") {
        renovarContratoPorId(id);
      }
    });
  }
});
