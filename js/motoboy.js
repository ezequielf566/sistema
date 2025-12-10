document.addEventListener("DOMContentLoaded", () => {
  carregarEntregasMotoboy();
});

function carregarEntregasMotoboy() {
  const user = JSON.parse(localStorage.getItem("financeApp_currentUser"));
  if (!user) return (window.location.href = "../index.html");

  const entregas = JSON.parse(localStorage.getItem("motoboy_entregas") || "[]");

  const minhas = entregas
    .filter(e => e.motoboy === user.email && e.status !== "entregue")
    .sort((a, b) => new Date(a.criadoEm) - new Date(b.criadoEm));

  const div = document.getElementById("listaEntregas");
  div.innerHTML = "";

  if (minhas.length === 0) {
    div.innerHTML = `<p style="opacity:0.6;text-align:center;margin-top:20px;">Nenhuma entrega pendente.</p>`;
    return;
  }

  minhas.forEach(e => {
    const enderecoFull = `${e.clienteEndereco}, ${e.clienteCidade} - ${e.clienteEstado}, ${e.clienteCep || ""}`;
    div.innerHTML += `
      <div class="entrega-card">

        <div class="entrega-info">
          📦 <strong>${e.clienteNome}</strong>
        </div>

        <div class="entrega-info">
          📍 ${enderecoFull}
        </div>

        <div class="entrega-buttons">
          <button class="btn-small btn-whatsapp" onclick="abrirWhats('${e.clienteTelefone}')">WhatsApp</button>
          <button class="btn-small btn-mapa" onclick='abrirMapa("${enderecoFull}")'>Mapa</button>
        </div>

        <button class="btn-pdf" onclick="abrirPDF('${e.contratoId}')">📄 Abrir Contrato</button>

        <button class="btn-entregue" onclick="marcarEntregue('${e.id}')">✔ Marcar como entregue</button>

      </div>
    `;
  });
}

function abrirWhats(telefone) {
  const numero = telefone.replace(/\D/g, "");
  window.open(`https://wa.me/55${numero}`, "_blank");
}

function abrirMapa(endereco) {
  const url = "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(endereco);
  window.open(url, "_blank");
}

// Abre o contrato usando sua função existente
function abrirPDF(contratoId) {
  const contratos = JSON.parse(localStorage.getItem("contratos_clientes") || "[]");
  const contrato = contratos.find(c => c.id === contratoId);
  if (contrato) visualizarContrato(contrato);
}

function marcarEntregue(id) {
  const entregas = JSON.parse(localStorage.getItem("motoboy_entregas") || "[]");
  const entrega = entregas.find(e => e.id === id);

  entrega.status = "entregue";
  entrega.entregueEm = new Date().toISOString();

  localStorage.setItem("motoboy_entregas", JSON.stringify(entregas));

  carregarEntregasMotoboy();
}
