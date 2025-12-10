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

  try {
    const hoje = new Date();
    const dataStr = proximaParcela.data; // "YYYY-MM-DD"
    const vencimento = new Date(`${dataStr}T18:00:00`);

    const diffMs = vencimento.getTime() - hoje.getTime();
    const diffDias = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMs < 0) {
      status = "vencido";
    } else {
      if (diffDias >= 5) {
        status = "andamento";
      } else if (diffDias >= 1 && diffDias <= 4) {
        status = "proximo";
      } else {
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

    const texto = `${nome} ${cpf} ${cidade}`.toLowerCase();
    if (filtros.termo && !texto.includes(filtros.termo)) return;

    if (filtros.selectedCidades.length > 0 && !filtros.selectedCidades.includes(cidade)) {
      return;
    }

    if (filtros.selectedEstados.length > 0 && (!estado || !filtros.selectedEstados.includes(estado))) {
      return;
    }

    const infoStatus = calcularStatusContrato(contrato);
    const st = infoStatus.status;

    if (st === "andamento" && !filtros.statusAnd) return;
    if (st === "proximo" && !filtros.statusProx) return;
    if (st === "vencido" && !filtros.statusVenc) return;
    if (st === "concluido" && !filtros.statusConc) return;

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

// =================== Relatório PDF de pagamentos (independente) ===================
function gerarRelatorioPagamento(contratoId) {
  const contrato = cacheContratos.find(c => c.id === contratoId);
  if (!contrato) {
    alert("Contrato não encontrado.");
    return;
  }

  const rec = getPagRecord(contrato);
  const pagas = new Set(rec.parcelasPagas || []);
  const cliente = contrato.cliente || {};
  const parcelas = contrato.parcelas || [];

  const totalLinhas = Math.max(10, parcelas.length);

  let linhas = "";
  for (let i = 0; i < totalLinhas; i++) {
    const p = parcelas[i];
    if (!p) {
      linhas += `
        <tr>
          <td>${i + 1}</td>
          <td></td>
          <td></td>
        </tr>
      `;
      continue;
    }

    const valorTxt = p.valor ? "R$ " + Number(p.valor).toFixed(2) : "";
    const paga = pagas.has(i);

    if (paga) {
      linhas += `
        <tr>
          <td>${i + 1}</td>
          <td style="color:#0f5132;font-weight:600;">${p.data} (PAGA)</td>
          <td style="color:#0f5132;font-weight:600;">${valorTxt}</td>
        </tr>
      `;
    } else {
      linhas += `
        <tr>
          <td>${i + 1}</td>
          <td>${p.data || ""}</td>
          <td>${valorTxt}</td>
        </tr>
      `;
    }
  }

  let tipoLabel = "Percentual sobre o valor total";
  if (contrato.tipoJuros === "diario_total") {
    tipoLabel = "Percentual por dias (fixo sobre o total)";
  } else if (contrato.tipoJuros === "mensal") {
    tipoLabel = "Percentual mensal";
  }

  const dataHoje = new Date();
  const dataFormatada = dataHoje.toLocaleDateString("pt-BR");

  const win = window.open("", "_blank", "width=900,height=1200");
  if (!win) {
    alert("Não foi possível abrir a janela do relatório. Verifique o bloqueador de pop-ups.");
    return;
  }

  win.document.write(`
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8">
      <title>Relatório de Pagamentos</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          margin: 24px;
          color: #111827;
        }
        .header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 16px;
        }
        .header-logo {
          height: 40px;
        }
        h2 {
          margin: 0;
          font-size: 1.4rem;
        }
        h3 {
          margin-top: 20px;
          margin-bottom: 8px;
        }
        p {
          margin: 2px 0;
          font-size: 0.9rem;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 8px;
          font-size: 0.85rem;
        }
        th, td {
          border: 1px solid #e5e7eb;
          padding: 6px 8px;
          text-align: left;
        }
        th {
          background: #f3f4f6;
        }
        .multa {
          margin-top: 10px;
          font-size: 0.8rem;
          color: #4b5563;
        }
        .assinatura-area {
          margin-top: 40px;
          text-align: center;
        }
        .linha-assinatura {
          border-top: 1px solid #000;
          margin: 0 auto 4px auto;
          width: 60%;
        }
      </style>
    </head>
    <body>

      <div class="header">
        <img src="../icons/logo.png" class="header-logo">
        <div>
          <h2>Relatório de Pagamentos</h2>
          <p>${dataFormatada}</p>
        </div>
      </div>

      <h3>Dados do Cliente</h3>
      <p><strong>Nome:</strong> ${cliente.nome || ""}</p>
      <p><strong>CPF:</strong> ${cliente.cpf || ""} — <strong>RG:</strong> ${cliente.rg || ""}</p>
      <p><strong>Endereço:</strong> ${cliente.endereco || ""} — ${(cliente.cidade || "")}/${(cliente.estado || "")}</p>

      <h3>Dados do Contrato</h3>
      <p><strong>ID do contrato:</strong> ${contrato.id || ""}</p>
      <p><strong>Valor emprestado:</strong> R$ ${Number(contrato.valorEmprestimo || 0).toFixed(2)}</p>
      <p><strong>Percentual:</strong> ${contrato.percentual || 0}% — <strong>Tipo:</strong> ${tipoLabel}</p>

      <h3>Parcelas</h3>
      <table>
        <thead>
          <tr><th>#</th><th>Data</th><th>Valor</th></tr>
        </thead>
        <tbody>${linhas}</tbody>
      </table>

      <p class="multa">
        Parcelas pagas em destaque verde com a indicação "(PAGA)".
      </p>

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
