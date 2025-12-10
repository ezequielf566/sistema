// ======================================================
// PAGAMENTOS.JS — Controle de status e relatórios
// ======================================================

const STORAGE_CONTRATOS = "contratos_clientes";
const STORAGE_PAGAMENTOS = "pagamentos_clientes";

let cacheContratos = [];
let cachePagamentos = [];
let debounceTimerPag = null;

// =================== Storage helpers ===================
function loadContratosPag() {
  const raw = localStorage.getItem(STORAGE_CONTRATOS);
  cacheContratos = raw ? JSON.parse(raw) : [];
}

function loadPagamentos() {
  const raw = localStorage.getItem(STORAGE_PAGAMENTOS);
  cachePagamentos = raw ? JSON.parse(raw) : [];
}

function savePagamentos() {
  localStorage.setItem(STORAGE_PAGAMENTOS, JSON.stringify(cachePagamentos));
}

function getPagRecord(contrato) {
  const cpf = contrato.cliente?.cpf || "";
  let rec = cachePagamentos.find(
    p => p.contratoId === contrato.id && p.cpf === cpf
  );
  if (!rec) {
    rec = {
      contratoId: contrato.id,
      cpf,
      parcelasPagas: [],
      concluido: false,
    };
    cachePagamentos.push(rec);
  }
  return rec;
}

// =================== Cálculo de status ===================
// Retorna: { status, proximaParcela, indiceProxima, totalParcelas, qtdPagas }
function calcularStatusContrato(contrato) {
  const parcelas = contrato.parcelas || [];
  const rec = getPagRecord(contrato);
  const pagas = new Set(rec.parcelasPagas || []);

  const totalParcelas = parcelas.length;
  const qtdPagas = pagas.size;

  // Todas pagas => concluído
  if (totalParcelas > 0 && qtdPagas >= totalParcelas) {
    rec.concluido = true;
    return {
      status: "concluido",
      proximaParcela: null,
      indiceProxima: -1,
      totalParcelas,
      qtdPagas,
    };
  }

  rec.concluido = false;

  // Achar próxima parcela não paga
  let indiceProxima = -1;
  for (let i = 0; i < parcelas.length; i++) {
    if (!pagas.has(i)) {
      indiceProxima = i;
      break;
    }
  }

  if (indiceProxima === -1) {
    // sem parcela registrada, mas não concluído => trata como concluído
    rec.concluido = true;
    return {
      status: "concluido",
      proximaParcela: null,
      indiceProxima: -1,
      totalParcelas,
      qtdPagas,
    };
  }

  const proximaParcela = parcelas[indiceProxima];
  let status = "andamento";

  // Cálculo de datas
  try {
    const hoje = new Date();
    const dataStr = proximaParcela.data; // "YYYY-MM-DD"
    // Vence às 18h do dia da parcela
    const vencimento = new Date(`${dataStr}T18:00:00`);

    const diffMs = vencimento.getTime() - hoje.getTime();
    const diffDias = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMs < 0) {
      // Já passou do horário de vencimento => vencido
      status = "vencido";
    } else {
      if (diffDias >= 5) {
        status = "andamento";
      } else if (diffDias >= 1 && diffDias <= 4) {
        status = "proximo";
      } else {
        // diffDias === 0 => dia do vencimento
        const horaAtual = hoje.getHours();
        if (horaAtual >= 18) {
          status = "vencido";
        } else {
          status = "proximo";
        }
      }
    }
  } catch (e) {
    status = "andamento";
  }

  return {
    status,
    proximaParcela,
    indiceProxima,
    totalParcelas,
    qtdPagas,
  };
}

// =================== Filtros ===================
function coletarCidadesEstados() {
  const cidades = new Set();
  const estados = new Set();

  cacheContratos.forEach(c => {
    const cli = c.cliente || {};
    if (cli.cidade) cidades.add(cli.cidade.trim());
    if (cli.estado) estados.add(cli.estado.trim().toUpperCase());
  });

  return {
    cidades: Array.from(cidades).sort(),
    estados: Array.from(estados).sort(),
  };
}

function montarFiltrosCidadesEstados() {
  const { cidades, estados } = coletarCidadesEstados();

  const divCidades = document.getElementById("filtrosCidades");
  const divEstados = document.getElementById("filtrosEstados");
  if (!divCidades || !divEstados) return;

  divCidades.innerHTML = "";
  cidades.forEach(c => {
    const lbl = document.createElement("label");
    lbl.innerHTML = `<input type="checkbox" class="filtro-cidade" value="${c}"> ${c}`;
    divCidades.appendChild(lbl);
  });

  divEstados.innerHTML = "";
  estados.forEach(e => {
    const lbl = document.createElement("label");
    lbl.innerHTML = `<input type="checkbox" class="filtro-estado" value="${e}"> ${e}`;
    divEstados.appendChild(lbl);
  });
}

function obterFiltrosAtuais() {
  const termo = (document.getElementById("pagSearchInput")?.value || "").toLowerCase();

  const statusAnd = document.getElementById("filtroStatusAndamento")?.checked;
  const statusProx = document.getElementById("filtroStatusProximo")?.checked;
  const statusVenc = document.getElementById("filtroStatusVencido")?.checked;
  const statusConc = document.getElementById("filtroStatusConcluido")?.checked;

  const selectedCidades = Array.from(
    document.querySelectorAll(".filtro-cidade:checked")
  ).map(i => i.value);

  const selectedEstados = Array.from(
    document.querySelectorAll(".filtro-estado:checked")
  ).map(i => i.value);

  return {
    termo,
    statusAnd,
    statusProx,
    statusVenc,
    statusConc,
    selectedCidades,
    selectedEstados,
  };
}

// =================== Renderização ===================
function renderizarPagamentos() {
  const container = document.getElementById("pagamentosResultado");
  if (!container) return;

  const filtros = obterFiltrosAtuais();
  const resultadoPorCidade = {};

  cacheContratos.forEach(contrato => {
    const cli = contrato.cliente || {};
    const cidade = cli.cidade?.trim() || "Sem cidade";
    const estado = (cli.estado || "").toUpperCase();
    const nome = cli.nome || "";
    const cpf = cli.cpf || "";

    // Filtro texto
    const texto = `${nome} ${cpf} ${cidade}`.toLowerCase();
    if (filtros.termo && !texto.includes(filtros.termo)) return;

    // Filtro cidade
    if (filtros.selectedCidades.length > 0 && !filtros.selectedCidades.includes(cidade)) {
      return;
    }

    // Filtro estado
    if (filtros.selectedEstados.length > 0 && (!estado || !filtros.selectedEstados.includes(estado))) {
      return;
    }

    // Status
    const infoStatus = calcularStatusContrato(contrato);
    const st = infoStatus.status;

    // Filtro status
    if (st === "andamento" && !filtros.statusAnd) return;
    if (st === "proximo" && !filtros.statusProx) return;
    if (st === "vencido" && !filtros.statusVenc) return;
    if (st === "concluido" && !filtros.statusConc) return;

    // Agrupar por cidade -> cliente
    if (!resultadoPorCidade[cidade]) resultadoPorCidade[cidade] = {};
    if (!resultadoPorCidade[cidade][cpf]) {
      resultadoPorCidade[cidade][cpf] = {
        cliente: cli,
        contratos: [],
      };
    }
    resultadoPorCidade[cidade][cpf].contratos.push({
      contrato,
      infoStatus,
    });
  });

  const cidades = Object.keys(resultadoPorCidade);
  container.innerHTML = "";

  if (cidades.length === 0) {
    container.innerHTML = `
      <div class="info-empty">
        Nenhum contrato encontrado com os filtros atuais.
      </div>
    `;
    return;
  }

  cidades.forEach(cidade => {
    const blocoCidade = document.createElement("div");
    blocoCidade.className = "city-block";

    blocoCidade.innerHTML = `<div class="city-title">${cidade}</div>`;

    const clientesCidade = resultadoPorCidade[cidade];
    Object.keys(clientesCidade).forEach(cpf => {
      const { cliente, contratos } = clientesCidade[cpf];

      const blocoCliente = document.createElement("div");
      blocoCliente.className = "cliente-bloco";

      blocoCliente.innerHTML = `
        <div class="cliente-nome">${cliente.nome || "Sem nome"}</div>
        <div class="cliente-doc">${cliente.cpf || ""} • ${cliente.estado || ""}</div>
      `;

      contratos.forEach(item => {
        const { contrato, infoStatus } = item;
        const { status, proximaParcela, indiceProxima, totalParcelas, qtdPagas } = infoStatus;

        let statusLabel = "";
        let statusClass = "";

        if (status === "andamento") {
          statusLabel = "Em andamento";
          statusClass = "status-andamento";
        } else if (status === "proximo") {
          statusLabel = "Próximo do vencimento";
          statusClass = "status-proximo";
        } else if (status === "vencido") {
          statusLabel = "Vencido";
          statusClass = "status-vencido";
        } else {
          statusLabel = "Concluído";
          statusClass = "status-concluido";
        }

        const card = document.createElement("div");
        card.className = "contrato-card";

        const proxTexto = proximaParcela
          ? `Próxima parcela: ${proximaParcela.data} — R$ ${Number(proximaParcela.valor || 0).toFixed(2)}`
          : "Todas as parcelas estão pagas.";

        card.innerHTML = `
          <div class="contrato-linha-top">
            <div class="contrato-id">Contrato #${contrato.id || "s/ID"}</div>
            <div class="status-badge ${statusClass}">${statusLabel}</div>
          </div>
          <div class="contrato-info">
            Parcelas pagas: ${qtdPagas} / ${totalParcelas}
          </div>
          <div class="parcela-linha">
            ${proxTexto}
          </div>
        `;

        const acoes = document.createElement("div");
        acoes.className = "contrato-acoes";

        if (status !== "concluido" && proximaParcela) {
          const linhaCheck = document.createElement("div");
          linhaCheck.className = "checkbox-pagar";

          const idCheck = `chk-pagar-${contrato.id}-${indiceProxima}`;

          linhaCheck.innerHTML = `
            <input type="checkbox" id="${idCheck}">
            <label for="${idCheck}">Marcar próxima parcela como paga</label>
          `;

          linhaCheck.querySelector("input").addEventListener("change", (e) => {
            if (e.target.checked) {
              const ok = window.confirm("Confirmar pagamento desta parcela?");
              if (!ok) {
                e.target.checked = false;
                return;
              }
              marcarParcelaPaga(contrato.id, indiceProxima);
            }
          });

          acoes.appendChild(linhaCheck);
        }

        const botoes = document.createElement("div");
        botoes.className = "contrato-botoes";

        const btnRelatorio = document.createElement("button");
        btnRelatorio.className = "btn-mini btn-pdf";
        btnRelatorio.textContent = "Relatório de pagamentos";
        btnRelatorio.addEventListener("click", () => {
          gerarRelatorioPagamento(contrato.id);
        });

        botoes.appendChild(btnRelatorio);
        acoes.appendChild(botoes);

        card.appendChild(acoes);
        blocoCliente.appendChild(card);
      });

      blocoCidade.appendChild(blocoCliente);
    });

    container.appendChild(blocoCidade);
  });
}

// =================== Marcar parcela como paga ===================
function marcarParcelaPaga(contratoId, indiceParcela) {
  const contrato = cacheContratos.find(c => c.id === contratoId);
  if (!contrato) {
    alert("Contrato não encontrado.");
    return;
  }

  const rec = getPagRecord(contrato);
  if (!Array.isArray(rec.parcelasPagas)) rec.parcelasPagas = [];

  if (!rec.parcelasPagas.includes(indiceParcela)) {
    rec.parcelasPagas.push(indiceParcela);
    rec.parcelasPagas.sort((a, b) => a - b);
  }

  // Atualiza concluído se necessário
  const totalParcelas = (contrato.parcelas || []).length;
  if (rec.parcelasPagas.length >= totalParcelas) {
    rec.concluido = true;
  }

  savePagamentos();

  if (typeof showToast === "function") {
    showToast("Parcela marcada como paga.");
  }

  renderizarPagamentos();
}

// =================== Relatório PDF de pagamentos ===================
// Usa o MESMO visualizarContrato do contratos.js
// Mas marca as parcelas pagas em VERDE via HTML no campo data
function gerarRelatorioPagamento(contratoId) {
  const contratoOriginal = cacheContratos.find(c => c.id === contratoId);
  if (!contratoOriginal) {
    alert("Contrato não encontrado.");
    return;
  }

  const rec = getPagRecord(contratoOriginal);
  const pagas = new Set(rec.parcelasPagas || []);

  // Clone profundo para não alterar o original
  const clone = JSON.parse(JSON.stringify(contratoOriginal));
  const parcelas = clone.parcelas || [];

  parcelas.forEach((p, idx) => {
    if (pagas.has(idx) && p.data) {
      const dataTexto = p.data;
      p.data = `<span style="color:#0f5132;font-weight:600;">${dataTexto} (PAGA)</span>`;
    }
  });

  // Usa a mesma função já existente para gerar o PDF
  if (typeof visualizarContrato === "function") {
    visualizarContrato(clone);
  } else {
    alert("Função visualizarContrato não encontrada.");
  }
}

// =================== Eventos de filtro/busca ===================
function setupEventosPagamentos() {
  const inputBusca = document.getElementById("pagSearchInput");
  if (inputBusca) {
    inputBusca.addEventListener("input", () => {
      clearTimeout(debounceTimerPag);
      debounceTimerPag = setTimeout(renderizarPagamentos, 200);
    });
  }

  document.querySelectorAll(
    "#filtroStatusAndamento, #filtroStatusProximo, #filtroStatusVencido, #filtroStatusConcluido"
  ).forEach(el => {
    el.addEventListener("change", renderizarPagamentos);
  });

  // Filtros de cidades/estados (delegados após montagem)
  document.addEventListener("change", (e) => {
    if (e.target.classList.contains("filtro-cidade") ||
        e.target.classList.contains("filtro-estado")) {
      renderizarPagamentos();
    }
  });
}

// =================== Inicialização ===================
function initPagamentos() {
  loadContratosPag();
  loadPagamentos();
  montarFiltrosCidadesEstados();
  setupEventosPagamentos();
  renderizarPagamentos();
}

document.addEventListener("DOMContentLoaded", initPagamentos);
