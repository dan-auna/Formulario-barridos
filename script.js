/* ══════════════════════════════════════════════
   AUNA — PORTAL ASESORES | script.js
   ══════════════════════════════════════════════ */

const URL_GOOGLE_SCRIPT =
  "https://script.google.com/macros/s/AKfycbzg3p6evPFrvfWIAwa6MoGMEtuoyBLU2-wWapn-Ic4lYY9fzuVzrT-zAaOg18XoxvKBaA/exec";

// ─── Todos los leads (cache para búsqueda) ───
let allLeads = [];

/* ══════════════════════════════════════════════
   SHOW / HIDE PASSWORD
══════════════════════════════════════════════ */
function togglePass() {
  const input = document.getElementById("password");
  const icon  = document.getElementById("eye-icon");
  const isHidden = input.type === "password";

  input.type = isHidden ? "text" : "password";

  icon.innerHTML = isHidden
    ? `<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/>`
    : `<path d="M1 12S5 4 12 4s11 8 11 8-4 8-11 8S1 12 1 12z"/><circle cx="12" cy="12" r="3"/>`;
}

/* ══════════════════════════════════════════════
   LOGIN
══════════════════════════════════════════════ */
async function login() {
  const userIn = document.getElementById("username").value.trim();
  const passIn = document.getElementById("password").value;

  // UI: set loading state
  setLoginLoading(true);
  document.getElementById("login-error").style.display = "none";

  if (!userIn || !passIn) {
    showLoginError();
    setLoginLoading(false);
    return;
  }

  try {
    const response = await fetch(`${URL_GOOGLE_SCRIPT}?action=getUsers`);
    if (!response.ok) throw new Error("Network response was not ok");
    const usuarios = await response.json();

    const encontrado = usuarios.find(
      (u) =>
        u.usuario?.toString() === userIn &&
        u.contraseña?.toString() === passIn
    );

    if (encontrado) {
      sessionStorage.setItem("usuarioActivo", encontrado.usuario);
      sessionStorage.setItem("rolActivo",     encontrado.rol);
      sessionStorage.setItem("agenteActivo",  encontrado.agente);
      mostrarPantallaFormulario(encontrado);
    } else {
      showLoginError();
    }
  } catch (error) {
    showLoginError("Error al conectar. Verifica tu conexión.");
  } finally {
    setLoginLoading(false);
  }
}

function setLoginLoading(loading) {
  const btn    = document.getElementById("login-btn");
  const text   = btn.querySelector(".btn-text");
  const loader = btn.querySelector(".btn-loader");
  btn.disabled = loading;
  text.style.display   = loading ? "none" : "";
  loader.style.display = loading ? "flex" : "none";
}

function showLoginError(msg) {
  const el = document.getElementById("login-error");
  el.style.display = "flex";
  if (msg) el.lastChild.textContent = " " + msg;
  // Shake animation
  el.style.animation = "none";
  el.offsetHeight;
  el.style.animation = "fadeUp 0.3s ease";
}

// Allow pressing Enter to login
document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("password").addEventListener("keydown", (e) => {
    if (e.key === "Enter") login();
  });
  document.getElementById("username").addEventListener("keydown", (e) => {
    if (e.key === "Enter") document.getElementById("password").focus();
  });

  // Product select preview
  document.getElementById("producto").addEventListener("change", updateProductChip);
});

/* ══════════════════════════════════════════════
   MOSTRAR PANTALLA FORMULARIO
══════════════════════════════════════════════ */
function mostrarPantallaFormulario(user) {
  document.getElementById("login-section").style.display = "none";
  document.getElementById("form-section").style.display  = "block";

  const nombre = user.agente || user.usuario;

  // Topbar
  document.getElementById("topbar-title").textContent    = `Formulario Barrido`;
  document.getElementById("user-name-chip").textContent  = nombre;
  document.getElementById("user-avatar").textContent     = nombre.charAt(0).toUpperCase();

  // Form title
  document.getElementById("form-title").textContent = `Formulario Barrido — ${nombre}`;
}

/* ══════════════════════════════════════════════
   LOGOUT
══════════════════════════════════════════════ */
function logout() {
  sessionStorage.clear();
  document.getElementById("form-section").style.display  = "none";
  document.getElementById("login-section").style.display = "block";
  document.getElementById("username").value = "";
  document.getElementById("password").value = "";
  document.getElementById("login-error").style.display = "none";
  document.getElementById("barrido-form").reset();
  allLeads = [];
}

/* ══════════════════════════════════════════════
   TABS
══════════════════════════════════════════════ */
function switchTab(tab) {
  document.querySelectorAll(".tab").forEach((t) => t.classList.remove("active"));
  document.querySelectorAll(".tab-panel").forEach((p) => p.classList.remove("active"));

  document.getElementById(`tab-${tab}`).classList.add("active");
  document.getElementById(`panel-${tab}`).classList.add("active");

  if (tab === "records") verRegistros();
}

/* ══════════════════════════════════════════════
   PRODUCT CHIP PREVIEW
══════════════════════════════════════════════ */
function updateProductChip() {
  const val     = document.getElementById("producto").value;
  const preview = document.getElementById("product-preview");
  const chip    = document.getElementById("product-chip-display");

  if (val) {
    preview.style.display = "block";
    chip.textContent = `✔ ${val} seleccionado`;
  } else {
    preview.style.display = "none";
  }
}

/* ══════════════════════════════════════════════
   VALIDACIÓN
══════════════════════════════════════════════ */
function validateForm() {
  let valid = true;

  const fields = [
    { id: "nombre",    errId: "err-nombre",   msg: "Ingresa el nombre completo",   check: (v) => v.trim().length >= 3 },
    { id: "telefono",  errId: "err-telefono", msg: "Ingresa un teléfono válido",   check: (v) => /^\d{7,15}$/.test(v.replace(/\s/g, "")) },
    { id: "edad",      errId: "err-edad",     msg: "Ingresa una edad válida (1–120)", check: (v) => +v >= 1 && +v <= 120 },
    { id: "producto",  errId: "err-producto", msg: "Selecciona un producto",       check: (v) => v !== "" },
  ];

  fields.forEach(({ id, errId, msg, check }) => {
    const el  = document.getElementById(id);
    const err = document.getElementById(errId);
    const val = el.value;

    if (!check(val)) {
      el.classList.add("invalid");
      err.textContent = msg;
      valid = false;
    } else {
      el.classList.remove("invalid");
      err.textContent = "";
    }
  });

  return valid;
}

// Remove invalid class on input
["nombre", "telefono", "edad", "producto"].forEach((id) => {
  const el = document.getElementById(id);
  if (el) {
    el.addEventListener("input",  () => { el.classList.remove("invalid"); document.getElementById(`err-${id}`)?.textContent && (document.getElementById(`err-${id}`).textContent = ""); });
    el.addEventListener("change", () => { el.classList.remove("invalid"); });
  }
});

/* ══════════════════════════════════════════════
   GUARDAR LEAD
══════════════════════════════════════════════ */
document.getElementById("barrido-form").addEventListener("submit", async function (e) {
  e.preventDefault();
  if (!validateForm()) return;

  setSubmitLoading(true);

  const datos = {
    usuario:     sessionStorage.getItem("usuarioActivo"),
    agente:      sessionStorage.getItem("agenteActivo"),
    fecha:       (() => {
                   const now = new Date();
                   const parts = new Intl.DateTimeFormat("en-US", {
                     timeZone: "America/Lima",
                     day:    "2-digit",
                     month:  "2-digit",
                     year:   "numeric",
                     hour:   "numeric",
                     minute: "2-digit",
                     hour12: true,
                   }).formatToParts(now);
                   const get = (t) => parts.find(p => p.type === t)?.value ?? "";
                   const ampm = get("dayPeriod").toLowerCase();
                   return `${get("month")}/${get("day")}/${get("year")} ${get("hour")}:${get("minute")} ${ampm}`;
                 })(),
    nombre:      document.getElementById("nombre").value.trim(),
    telefono:    document.getElementById("telefono").value.trim(),
    edad:        document.getElementById("edad").value,
    producto:    document.getElementById("producto").value,
    comentarios: document.getElementById("comentarios").value.trim(),
  };

  try {
    await fetch(URL_GOOGLE_SCRIPT, {
      method: "POST",
      mode:   "no-cors",
      body:   JSON.stringify(datos),
    });

    this.reset();
    document.getElementById("product-preview").style.display = "none";
    showToast();

    // Clear validation states
    ["nombre", "telefono", "edad", "producto"].forEach((id) => {
      document.getElementById(id)?.classList.remove("invalid");
    });

  } catch (error) {
    alert("Error al guardar. Verifica tu conexión e intenta de nuevo.");
  } finally {
    setSubmitLoading(false);
  }
});

function setSubmitLoading(loading) {
  const btn  = document.getElementById("submit-btn");
  const text = btn.querySelector(".btn-text");
  const ldr  = btn.querySelector(".btn-loader");
  btn.disabled         = loading;
  text.style.display   = loading ? "none" : "flex";
  ldr.style.display    = loading ? "flex" : "none";
}

/* ══════════════════════════════════════════════
   TOAST
══════════════════════════════════════════════ */
function showToast() {
  const toast = document.getElementById("toast");
  toast.style.display = "flex";
  setTimeout(() => {
    toast.style.animation = "none";
    toast.style.display   = "none";
    toast.style.animation = "";
  }, 3500);
}

/* ══════════════════════════════════════════════
   VER REGISTROS
══════════════════════════════════════════════ */
async function verRegistros() {
  const contenedor = document.getElementById("tabla-registros");
  const btn        = document.querySelector(".btn-refresh");

  btn.classList.add("spinning");
  contenedor.innerHTML = `
    <div class="loading-state">
      <div class="loading-dots"><span></span><span></span><span></span></div>
      <p>Cargando registros...</p>
    </div>`;

  const rol    = sessionStorage.getItem("rolActivo");
  const miUser = sessionStorage.getItem("usuarioActivo");

  try {
    const response = await fetch(`${URL_GOOGLE_SCRIPT}?action=getLeads`);
    if (!response.ok) throw new Error("Error");
    const todosLosLeads = await response.json();

    allLeads = rol === "Administrador"
      ? todosLosLeads
      : todosLosLeads.filter((l) => l.usuario === miUser);

    document.getElementById("records-sub").textContent =
      `${allLeads.length} lead${allLeads.length !== 1 ? "s" : ""} encontrado${allLeads.length !== 1 ? "s" : ""}`;

    renderTable(allLeads, contenedor);

  } catch (e) {
    contenedor.innerHTML = `
      <div class="empty-state">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
        <p>No se pudieron cargar los registros.<br>Verifica tu conexión.</p>
      </div>`;
  } finally {
    btn.classList.remove("spinning");
  }
}

/* ══════════════════════════════════════════════
   FILTRAR TABLA
══════════════════════════════════════════════ */
function filtrarTabla() {
  const q = document.getElementById("search-input").value.toLowerCase();
  const filtrados = allLeads.filter(
    (l) =>
      (l.nombre    || "").toLowerCase().includes(q) ||
      (l.producto  || "").toLowerCase().includes(q) ||
      (l.telefono  || "").toString().includes(q)     ||
      (l.agente    || l.usuario || "").toLowerCase().includes(q)
  );
  renderTable(filtrados, document.getElementById("tabla-registros"));
}

/* ══════════════════════════════════════════════
   RENDER TABLE
══════════════════════════════════════════════ */
function formatFecha(valor) {
  if (!valor) return "—";
  // Intenta parsear cualquier formato (ISO, string de texto, Date de Sheets, etc.)
  const date = new Date(valor);
  if (isNaN(date.getTime())) return valor; // Si no se puede parsear, muestra tal cual
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Lima",
    day:    "2-digit",
    month:  "2-digit",
    year:   "numeric",
    hour:   "numeric",
    minute: "2-digit",
    hour12: true,
  }).formatToParts(date);
  const get = (t) => parts.find(p => p.type === t)?.value ?? "";
  const ampm = get("dayPeriod").toLowerCase();
  return `${get("month")}/${get("day")}/${get("year")} ${get("hour")}:${get("minute")} ${ampm}`;
}

function getBadgeClass(producto) {
  const map = {
    "Auna Classic":  "badge-classic",
    "Auna Premium":  "badge-premium",
    "Auna Senior":   "badge-senior",
    "Onco Pro":      "badge-oncopro",
    "Onco Plus":     "badge-oncoplus",
  };
  return map[producto] || "badge-classic";
}

function renderTable(datos, contenedor) {
  if (datos.length === 0) {
    contenedor.innerHTML = `
      <div class="empty-state">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/></svg>
        <p>No hay registros que mostrar.</p>
      </div>`;
    return;
  }

  const rol = sessionStorage.getItem("rolActivo");
  const mostrarAsesor = rol === "Administrador";

  let html = `
    <div style="overflow-x:auto">
    <table class="data-table">
      <thead>
        <tr>
          <th>Fecha</th>
          <th>Nombre</th>
          <th>Teléfono</th>
          <th>Edad</th>
          <th>Producto</th>
          ${mostrarAsesor ? "<th>Asesor</th>" : ""}
          <th>Comentarios</th>
        </tr>
      </thead>
      <tbody>`;

  datos.forEach((d) => {
    const badgeClass = getBadgeClass(d.producto);
    html += `
      <tr>
        <td style="white-space:nowrap; color:var(--slate-500); font-size:0.8rem">${formatFecha(d.fecha)}</td>
        <td style="font-weight:600">${d.nombre || "—"}</td>
        <td>${d.telefono || "—"}</td>
        <td style="text-align:center">${d.edad || "—"}</td>
        <td><span class="badge-product ${badgeClass}">${d.producto || "—"}</span></td>
        ${mostrarAsesor ? `<td style="color:var(--slate-500); font-size:0.82rem">${d.agente || d.usuario || "—"}</td>` : ""}
        <td style="color:var(--slate-500); font-size:0.82rem; max-width:180px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap" title="${d.comentarios || ""}">${d.comentarios || "—"}</td>
      </tr>`;
  });

  html += `
      </tbody>
    </table>
    </div>
    <div class="table-footer">${datos.length} registro${datos.length !== 1 ? "s" : ""}</div>`;

  contenedor.innerHTML = html;
}
