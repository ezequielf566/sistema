
const TOKEN_MASTER = "91710983";
const STORAGE_USERS_KEY = "financeApp_users";
const STORAGE_CURRENT_USER = "financeApp_currentUser";

function showToast(message) {
  const toast = document.getElementById("toast");
  const msg = document.getElementById("toastMessage");
  if (!toast || !msg) return;
  msg.textContent = message;
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), 2600);
}

function loadUsers() {
  try {
    const raw = localStorage.getItem(STORAGE_USERS_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (e) {
    console.error("Erro ao carregar usuários", e);
    return [];
  }
}

function saveUsers(users) {
  localStorage.setItem(STORAGE_USERS_KEY, JSON.stringify(users));
}

function createDefaultAdminIfNeeded() {
  const users = loadUsers();
  if (users.length === 0) {
    users.push({
      name: "Administrador",
      cpf: "",
      email: "admin@sistema.com",
      password: "admin123",
      role: "chefe",
    });
    saveUsers(users);
  }
}

function routeByRole(role) {
  if (role === "caixa") {
    window.location.href = "caixa/caixa.html";
  } else if (role === "motoboy") {
    window.location.href = "motoboy/motoboy.html";
  } else if (role === "gerencia") {
    window.location.href = "gerencia/gerencia.html";
  } else if (role === "chefe") {
    window.location.href = "chefe/chefe.html";
  } else {
    alert("Cargo sem painel definido.");
  }
}

document.addEventListener("DOMContentLoaded", () => {
  createDefaultAdminIfNeeded();

  const togglePassword = document.getElementById("togglePassword");
  const passwordInput = document.getElementById("password");
  if (togglePassword && passwordInput) {
    togglePassword.addEventListener("click", () => {
      const type = passwordInput.type === "password" ? "text" : "password";
      passwordInput.type = type;
    });
  }

  const loginForm = document.getElementById("loginForm");
  if (loginForm) {
    loginForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const email = document.getElementById("email").value.trim().toLowerCase();
      const password = document.getElementById("password").value;

      const users = loadUsers();
      const user = users.find(u => u.email.toLowerCase() === email && u.password === password);

      if (!user) {
        showToast("E-mail ou senha inválidos.");
        return;
      }

      localStorage.setItem(STORAGE_CURRENT_USER, JSON.stringify(user));
      showToast("Login realizado com sucesso!");

      setTimeout(() => routeByRole(user.role), 800);
    });
  }

  // modais
  function openModal(id) {
    const el = document.getElementById(id);
    if (el) el.classList.add("active");
  }
  function closeModal(id) {
    const el = document.getElementById(id);
    if (el) el.classList.remove("active");
  }

  document.querySelectorAll(".modal-close").forEach(btn => {
    btn.addEventListener("click", () => {
      const id = btn.getAttribute("data-close");
      if (id) closeModal(id);
    });
  });

  const btnCreateUser = document.getElementById("btnCreateUser");
  if (btnCreateUser) {
    btnCreateUser.addEventListener("click", () => openModal("modalCreateUser"));
  }

  const btnForgotPassword = document.getElementById("btnForgotPassword");
  if (btnForgotPassword) {
    btnForgotPassword.addEventListener("click", () => openModal("modalForgotPassword"));
  }

  const btnChangePassword = document.getElementById("btnChangePassword");
  if (btnChangePassword) {
    btnChangePassword.addEventListener("click", () => openModal("modalChangePassword"));
  }

  // criar usuário
  const createUserForm = document.getElementById("createUserForm");
  if (createUserForm) {
    createUserForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const name = document.getElementById("newName").value.trim();
      const cpf = document.getElementById("newCpf").value.trim();
      const email = document.getElementById("newEmail").value.trim().toLowerCase();
      const password = document.getElementById("newPassword").value;
      const confirm = document.getElementById("newPasswordConfirm").value;
      const role = document.getElementById("newRole").value;
      const token = document.getElementById("newToken").value.trim();
      const msgEl = document.getElementById("createUserMessage");

      msgEl.textContent = "";
      msgEl.className = "feedback-message";

      if (token !== TOKEN_MASTER) {
        msgEl.textContent = "Token inválido. Apenas pessoal autorizado pode cadastrar usuários.";
        msgEl.classList.add("error");
        return;
      }
      if (!name || !email || !password || !role) {
        msgEl.textContent = "Preencha todos os campos obrigatórios.";
        msgEl.classList.add("error");
        return;
      }
      if (password !== confirm) {
        msgEl.textContent = "As senhas não conferem.";
        msgEl.classList.add("error");
        return;
      }

      const users = loadUsers();
      if (users.find(u => u.email.toLowerCase() === email)) {
        msgEl.textContent = "Já existe um usuário com este e-mail.";
        msgEl.classList.add("error");
        return;
      }

      users.push({ name, cpf, email, password, role });
      saveUsers(users);

      msgEl.textContent = "Usuário criado com sucesso.";
      msgEl.classList.add("success");
      showToast("Usuário cadastrado!");

      createUserForm.reset();
    });
  }
});
