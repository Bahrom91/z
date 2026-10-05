const STORAGE_KEY = "private_vault_data";

let accounts = [];
let masterKey = null;


/* =========================
   ELEMENTS
========================= */

const loginScreen = document.getElementById("loginScreen");
const app = document.getElementById("app");

const masterPassword = document.getElementById("masterPassword");
const loginBtn = document.getElementById("loginBtn");
const loginMessage = document.getElementById("loginMessage");

const addBtn = document.getElementById("addBtn");
const logoutBtn = document.getElementById("logoutBtn");

const modal = document.getElementById("modal");
const closeModal = document.getElementById("closeModal");

const site = document.getElementById("site");
const username = document.getElementById("username");
const password = document.getElementById("password");
const note = document.getElementById("note");

const saveBtn = document.getElementById("saveBtn");
const showPassword = document.getElementById("showPassword");

const vault = document.getElementById("vault");
const empty = document.getElementById("empty");


/* =========================
   CRYPTO
========================= */

async function makeKey(passwordText) {

  const encoder = new TextEncoder();

  const hash = await crypto.subtle.digest(
    "SHA-256",
    encoder.encode(passwordText)
  );

  return crypto.subtle.importKey(
    "raw",
    hash,
    {
      name: "AES-GCM"
    },
    false,
    [
      "encrypt",
      "decrypt"
    ]
  );
}


async function encryptData(data) {

  const iv = crypto.getRandomValues(
    new Uint8Array(12)
  );

  const encoded = new TextEncoder().encode(
    JSON.stringify(data)
  );

  const encrypted = await crypto.subtle.encrypt(
    {
      name: "AES-GCM",
      iv: iv
    },
    masterKey,
    encoded
  );

  return {
    iv: Array.from(iv),
    data: Array.from(
      new Uint8Array(encrypted)
    )
  };
}


async function decryptData(saved) {

  const iv = new Uint8Array(saved.iv);

  const encrypted = new Uint8Array(
    saved.data
  );

  const decrypted =
    await crypto.subtle.decrypt(
      {
        name: "AES-GCM",
        iv: iv
      },
      masterKey,
      encrypted
    );

  return JSON.parse(
    new TextDecoder().decode(decrypted)
  );
}


/* =========================
   LOGIN
========================= */

loginBtn.addEventListener("click", login);

masterPassword.addEventListener(
  "keydown",
  function(event) {

    if (event.key === "Enter") {
      login();
    }

  }
);


async function login() {

  const pass = masterPassword.value;

  if (!pass) {

    loginMessage.textContent =
      "Master passwordni kiriting.";

    return;
  }

  try {

    masterKey = await makeKey(pass);

    const saved =
      localStorage.getItem(STORAGE_KEY);

    if (saved) {

      accounts =
        await decryptData(
          JSON.parse(saved)
        );

    } else {

      accounts = [];

      await saveVault();
    }

    loginScreen.classList.add("hidden");
    app.classList.remove("hidden");

    masterPassword.value = "";

    render();

  } catch {

    masterKey = null;

    loginMessage.textContent =
      "Master password noto‘g‘ri.";

  }
}


/* =========================
   SAVE
========================= */

async function saveVault() {

  const encrypted =
    await encryptData(accounts);

  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(encrypted)
  );
}


/* =========================
   RENDER
========================= */

function render() {

  vault.innerHTML = "";

  if (accounts.length === 0) {

    empty.classList.remove("hidden");

    return;
  }

  empty.classList.add("hidden");

  accounts.forEach(
    (account, index) => {

      const card =
        document.createElement("div");

      card.className = "card";

      card.innerHTML = `

        <div class="card-top">

          <div>
            <div class="site">
              ${escapeHTML(account.site)}
            </div>

            <small>
              ${account.note
                ? escapeHTML(account.note)
                : "Shaxsiy akkaunt"}
            </small>
          </div>

          <div>🔐</div>

        </div>


        <div class="info">

          <span>LOGIN</span>

          <strong>
            ${escapeHTML(account.username)}
          </strong>

        </div>


        <div class="info">

          <span>PAROL</span>

          <strong
            id="pass-${index}"
          >
            ••••••••••••
          </strong>

        </div>


        <div class="actions">

          <button
            onclick="togglePassword(${index})"
          >
            👁 Ko‘rish
          </button>

          <button
            onclick="copyPassword(${index})"
          >
            📋 Nusxalash
          </button>

          <button
            class="delete"
            onclick="deleteAccount(${index})"
          >
            🗑
          </button>

        </div>

      `;

      vault.appendChild(card);

    }
  );
}


/* =========================
   ADD ACCOUNT
========================= */

addBtn.addEventListener(
  "click",
  function() {

    site.value = "";
    username.value = "";
    password.value = "";
    note.value = "";

    modal.classList.remove("hidden");

  }
);


closeModal.addEventListener(
  "click",
  function() {

    modal.classList.add("hidden");

  }
);


saveBtn.addEventListener(
  "click",
  async function() {

    if (
      !site.value.trim() ||
      !username.value.trim() ||
      !password.value
    ) {

      alert(
        "Platforma, login va parolni kiriting."
      );

      return;
    }


    accounts.push({

      site: site.value.trim(),

      username:
        username.value.trim(),

      password:
        password.value,

      note:
        note.value.trim()

    });


    await saveVault();

    modal.classList.add("hidden");

    render();

  }
);


/* =========================
   PASSWORD ACTIONS
========================= */

window.togglePassword =
  function(index) {

    const element =
      document.getElementById(
        `pass-${index}`
      );

    if (
      element.textContent ===
      "••••••••••••"
    ) {

      element.textContent =
        accounts[index].password;

    } else {

      element.textContent =
        "••••••••••••";

    }

  };


window.copyPassword =
  async function(index) {

    await navigator.clipboard.writeText(
      accounts[index].password
    );

    alert("Parol nusxalandi.");

  };


window.deleteAccount =
  async function(index) {

    const ok =
      confirm(
        "Bu akkauntni o‘chirmoqchimisiz?"
      );

    if (!ok) return;

    accounts.splice(index, 1);

    await saveVault();

    render();

  };


/* =========================
   SHOW PASSWORD IN FORM
========================= */

showPassword.addEventListener(
  "click",
  function() {

    if (password.type === "password") {

      password.type = "text";

    } else {

      password.type = "password";

    }

  }
);


/* =========================
   LOGOUT
========================= */

logoutBtn.addEventListener(
  "click",
  function() {

    masterKey = null;

    accounts = [];

    app.classList.add("hidden");

    loginScreen.classList.remove("hidden");

    loginMessage.textContent = "";

  }
);


/* =========================
   BASIC HTML ESCAPE
========================= */

function escapeHTML(value) {

  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

}
