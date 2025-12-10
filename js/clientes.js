// ======================================================
// CLIENTES.JS — Sistema de busca, listagem e renovação
// ======================================================

// Cache interno
let cacheContratos = [];
let debounceTimer = null;


// ======================================================
// 1. Carrega todos os contratos do storage oficial
// ======================================================
function carregarContratos() {
  const data = localStorage.getItem("contratos_clientes");
  cacheContratos = data ? JSON.parse(data) : [];
}


// ======================================================
// 2. Agrupa clientes por CIDADE → CPF
// ======================================================
function agruparClientes(termoBusca = "") {
  const grupos = {};

  cacheContratos.forEach(contrato => {
    if (!contrato.cliente) return;

    const c = contrato.cliente;
    const chaveCidade = c.cidade?.trim() || "Sem Cidade";
    const chaveCPF = c.cpf?.trim() || "Sem CPF";

    // Filtro de busca
    const texto = termoBusca.toLowerCase();
    if (
      !c.nome?.toLowerCase().includes(texto) &&
      !c.cpf?.toLowerCase().includes(texto) &&
      !c.cidade?.toLowerCase().includes(texto)
    ) {
      return; // não corresponde à busca
    }

    // Criar grupo da cidade
    if (!grupos[chaveCidade]) grupos[chaveCidade] = {};
    // Criar grupo por CPF
    if (!grupos[chaveCidade][chaveCPF]) grupos[chaveCidade][chaveCPF] = [];

    grupos[chaveCidade][chaveCPF].push(contrato);
  });

  return grupos;
}


// ======================================================
// 3. Renderiza a LISTA DE CLIENTES na tela
// ======================================================
function renderizarClientes(grupos) {
  const container = document.getElementById("clientesResultado");
  container.innerHTML = "";

  const cidades = Object.keys(grupos);

  if (cidades.length === 0) {
    container.innerHTML = `
      <p style="text-align:center;opacity:.7;margin-top:20px;">
        Nenhum cliente encontrado.
      </p>`;
    return;
  }

  cidades.forEach(cidade => {
    const blocoCidade = document.createElement("div");
    blocoCidade.className = "city-block";

    blocoCidade.innerHTML = `
      <div class="city-title">${cidade}</div>
    `;

    const clientesDaCidade = grupos[cidade];

    Object.keys(clientesDaCidade).forEach(cpf => {
      const contratosDoCliente = clientesDaCidade[cpf];
      const cliente = contratosDoCliente[0].cliente;

      const card = document.createElement("div");
      card.className = "client-item";

      card.innerHTML = `
        <div class="client-name">${cliente.nome}</div>
        <div class="client-info">${cliente.cpf} • ${contratosDoCliente.length} contrato(s)</div>

        <div class="btn-actions">
          <button class="btn-view" onclick="verContratos('${cpf.replace(/[^0-9]/g,'')}')">Ver</button>
          <button class="btn-renew" onclick="renovarCliente('${cpf.replace(/[^0-9]/g,'')}')">Renovar</button>
        </div>
      `;

      blocoCidade.appendChild(card);
    });

    container.appendChild(blocoCidade);
  });
}


// ======================================================
// 4. MOSTRA OS CONTRATOS de um cliente
// ======================================================
function verContratos(cpfLimpo) {
  const container = document.getElementById("clienteContratosDetalhes");
  container.innerHTML = "";

  const lista = cacheContratos.filter(c =>
    c.cliente?.cpf?.replace(/[^0-9]/g, "") === cpfLimpo
  );

  if (!lista.length) {
    container.innerHTML = "<p>Nenhum contrato encontrado.</p>";
    return;
  }

  lista.sort((a, b) => new Date(b.criadoEm) - new Date(a.criadoEm));

  lista.forEach((contrato, index) => {
    const box = document.createElement("div");
    box.className = "contract-box";

    box.innerHTML = `
      <div class="contract-title">
        Contrato ${index + 1} • ${new Date(contrato.criadoEm).toLocaleDateString('pt-BR')}
      </div>

      <div class="contract-actions">
        <button class="btn-view" onclick="abrirContratoPDF(${contrato.id})">Abrir</button>
        <button class="btn-renew" onclick="renovarPorContrato(${contrato.id})">Renovar</button>
      </div>
    `;

    container.appendChild(box);
  });
}


// ======================================================
// 5. Abrir contrato (usa função visualizarContrato do contratos.js)
// ======================================================
function abrirContratoPDF(id) {
  const contrato = cacheContratos.find(c => c.id === id);
  if (!contrato) return alert("Contrato não encontrado.");

  visualizarContrato(contrato);
}


// ======================================================
// 6. Fluxo de RENOVAÇÃO — envia dados para ficha.html
// ======================================================
function renovarCliente(cpfLimpo) {
  const contratos = cacheContratos.filter(c =>
    c.cliente?.cpf?.replace(/[^0-9]/g, "") === cpfLimpo
  );

  if (!contratos.length) return alert("Cliente não encontrado.");

  const cliente = contratos[0].cliente;

  // salvar dados para ficha.html
  localStorage.setItem("renovar_cliente", JSON.stringify(cliente));

  // redirecionar
  window.location.href = "ficha.html?renovar=1";
}

function renovarPorContrato(id) {
  const contrato = cacheContratos.find(c => c.id === id);
  if (!contrato) return alert("Contrato não encontrado.");

  localStorage.setItem("renovar_cliente", JSON.stringify(contrato.cliente));

  window.location.href = "ficha.html?renovar=1";
}


// ======================================================
// 7. BUSCA COM DEBOUNCE
// ======================================================
document.getElementById("clienteSearchInput").addEventListener("input", (e) => {
  const termo = e.target.value;

  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    const grupos = agruparClientes(termo);
    renderizarClientes(grupos);
  }, 200);
});


// ======================================================
// 8. INICIALIZAÇÃO DA PÁGINA
// ======================================================
function initClientes() {
  carregarContratos();
  const grupos = agruparClientes("");
  renderizarClientes(grupos);
}

document.addEventListener("DOMContentLoaded", initClientes);
