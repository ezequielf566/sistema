// renovacao.js - módulo de renovação de contratos

const STORAGE_CLIENTES = "financeApp_clientes";
const STORAGE_USERS = "financeApp_users";
const STORAGE_RENOVACOES = "financeApp_renovacoes";
const STORAGE_CURRENT_USER = "financeApp_currentUser";

let renDocsTemp = [];
let funcionarioSelecionado = null;

function renLoadStorage(key) {
  try {
    return JSON.parse(localStorage.getItem(key) || "[]");
  } catch (e) {
    console.error("Erro ao ler storage", key, e);
    return [];
  }
}

function renSaveStorage(key, data) {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.error("Erro ao salvar storage", key, e);
  }
}

function renToast(msg) {
  const t = document.getElementById("toast");
  const tm = document.getElementById("toastMessage");
  if (!t || !tm) {
    alert(msg);
    return;
  }
  tm.textContent = msg;
  t.classList.add("show");
  setTimeout(() => t.classList.remove("show"), 2200);
}

// Buscar cliente por CPF
(function initRenovacao() {
  const btnBuscar = document.getElementById("btnBuscarRenovacao");
  const inputCpf = document.getElementById("renovacaoCpf");
  const dadosDiv = document.getElementById("renovacaoDados");

  if (!btnBuscar || !inputCpf || !dadosDiv) return;

  btnBuscar.addEventListener("click", () => {
    const cpf = inputCpf.value.trim();
    if (!cpf) {
      renToast("Digite o CPF do cliente.");
      return;
    }

    const clientes = renLoadStorage(STORAGE_CLIENTES);
    const cliente = clientes.find(c => c.cpf === cpf);

    if (!cliente) {
      renToast("Cliente não encontrado.");
      dadosDiv.style.display = "none";
      return;
    }

    // Preenche os dados
    document.getElementById("renCliNome").textContent = cliente.nome || "";
    document.getElementById("renCliCpf").textContent = cliente.cpf || "";
    document.getElementById("renCliRg").textContent = cliente.rg || "";
    document.getElementById("renCliTelefone").textContent = cliente.telefone || "";
    document.getElementById("renCliEndereco").textContent = cliente.endereco || "";
    document.getElementById("renCliCidade").textContent = cliente.cidade || "";
    document.getElementById("renCliEstado").textContent = cliente.estado || "";

    dadosDiv.style.display = "block";
  });

  // Upload de documentos
  const inputDocs = document.getElementById("renDocsUpload");
  const listDocs = document.getElementById("renDocsList");

  if (inputDocs && listDocs) {
    inputDocs.addEventListener("change", (e) => {
      renDocsTemp = [];
      listDocs.innerHTML = "";

      const files = Array.from(e.target.files || []);
      files.forEach(file => {
        renDocsTemp.push({
          nome: file.name,
          tipo: file.type,
          tamanho: file.size
        });

        const div = document.createElement("div");
        div.className = "docs-item";
        div.innerHTML = `<span>${file.name}</span><span class="docs-status saved">OK</span>`;
        listDocs.appendChild(div);
      });
    });
  }

  // Gerar pedido -> listar funcionários
  const btnGerar = document.getElementById("btnGerarPedidoRenovacao");
  const cardFuncionarios = document.getElementById("renovacaoFuncionarios");
  const listaFuncionarios = document.getElementById("listaFuncionariosRenovacao");
  const btnEnviar = document.getElementById("btnEnviarRenovacao");

  if (btnGerar && cardFuncionarios && listaFuncionarios && btnEnviar) {
    btnGerar.addEventListener("click", () => {
      const cpfSpan = document.getElementById("renCliCpf");
      if (!cpfSpan || !cpfSpan.textContent) {
        renToast("Busque um cliente antes de gerar o pedido.");
        return;
      }

      const users = renLoadStorage(STORAGE_USERS);
      const funcionarios = users.filter(u => u.role && u.role !== "motoboy");

      listaFuncionarios.innerHTML = "";
      funcionarioSelecionado = null;
      btnEnviar.disabled = true;

      if (!funcionarios.length) {
        listaFuncionarios.innerHTML = "<p>Nenhum funcionário cadastrado para receber renovações.</p>";
      } else {
        funcionarios.forEach(f => {
          const item = document.createElement("div");
          item.className = "func-item";
          item.innerHTML = `
            <span>${f.name || f.email || "Funcionário"}</span>
            <span class="func-role">${f.role || ""}</span>
          `;
          item.addEventListener("click", () => {
            funcionarioSelecionado = f;

            // destaque visual
            listaFuncionarios.querySelectorAll(".func-item").forEach(el => {
              el.style.backgroundColor = "#ffffff";
            });
            item.style.backgroundColor = "#e0f2fe";

            btnEnviar.disabled = false;
          });
          listaFuncionarios.appendChild(item);
        });
      }

      cardFuncionarios.style.display = "block";
    });

    // Enviar renovação
    btnEnviar.addEventListener("click", () => {
      if (!funcionarioSelecionado) {
        renToast("Selecione um funcionário para enviar.");
        return;
      }

      const cliente = {
        nome: document.getElementById("renCliNome").textContent,
        cpf: document.getElementById("renCliCpf").textContent,
        rg: document.getElementById("renCliRg").textContent,
        telefone: document.getElementById("renCliTelefone").textContent,
        endereco: document.getElementById("renCliEndereco").textContent,
        cidade: document.getElementById("renCliCidade").textContent,
        estado: document.getElementById("renCliEstado").textContent
      };

      if (!cliente.cpf) {
        renToast("Dados do cliente não encontrados.");
        return;
      }

      const currentUser = (() => {
        try {
          return JSON.parse(localStorage.getItem(STORAGE_CURRENT_USER) || "null");
        } catch (e) {
          return null;
        }
      })();

      const renovacoes = renLoadStorage(STORAGE_RENOVACOES);
      renovacoes.push({
        id: Date.now(),
        cliente,
        anexos: renDocsTemp,
        funcionarioDestino: funcionarioSelecionado.email || "",
        criadoPor: currentUser?.email || "caixa",
        criadoEm: new Date().toISOString(),
        status: "pendente"
      });

      renSaveStorage(STORAGE_RENOVACOES, renovacoes);
      renToast("Pedido de renovação salvo com sucesso!");

      // Reset visual básico
      document.getElementById("renovacaoDados").style.display = "none";
      cardFuncionarios.style.display = "none";
      btnEnviar.disabled = true;
      renDocsTemp = [];
      const listDocs = document.getElementById("renDocsList");
      if (listDocs) listDocs.innerHTML = "";
      const inputDocs = document.getElementById("renDocsUpload");
      if (inputDocs) inputDocs.value = "";
    });
  }
})();
