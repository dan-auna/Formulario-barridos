/* ══════════════════════════════════════════════
   AUNA — PORTAL ASESORES | script.js
   ══════════════════════════════════════════════ */

const URL_GOOGLE_SCRIPT =
  "https://script.google.com/macros/s/AKfycbzg3p6evPFrvfWIAwa6MoGMEtuoyBLU2-wWapn-Ic4lYY9fzuVzrT-zAaOg18XoxvKBaA/exec";

// ─── Todos los leads (cache para búsqueda) ───
let allLeads    = [];
let currentPage = 1;
const PAGE_SIZE = 20;

/* ══════════════════════════════════════════════
   SESIÓN — localStorage con expiración 15 min
══════════════════════════════════════════════ */
const SESSION_KEY     = "auna_session";
const SESSION_MINUTES = 15;

function guardarSesion(usuario, rol, agente) {
  const sesion = {
    usuario,
    rol,
    agente,
    expira: Date.now() + SESSION_MINUTES * 60 * 1000,
  };
  localStorage.setItem(SESSION_KEY, JSON.stringify(sesion));
}

function leerSesion() {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const sesion = JSON.parse(raw);
    if (Date.now() > sesion.expira) {
      localStorage.removeItem(SESSION_KEY);
      return null;
    }
    // Renovar los 15 minutos con cada actividad
    sesion.expira = Date.now() + SESSION_MINUTES * 60 * 1000;
    localStorage.setItem(SESSION_KEY, JSON.stringify(sesion));
    return sesion;
  } catch {
    localStorage.removeItem(SESSION_KEY);
    return null;
  }
}

function borrarSesion() {
  localStorage.removeItem(SESSION_KEY);
}

// Verificar sesión al cargar la página
(function verificarSesionAlCargar() {
  const sesion = leerSesion();
  if (sesion) {
    // Restaurar la UI directamente sin pedir login
    mostrarPantallaFormulario({
      usuario: sesion.usuario,
      rol:     sesion.rol,
      agente:  sesion.agente,
    });
  }
})();

// Renovar expiración con cualquier interacción del usuario
document.addEventListener("click",    () => leerSesion());
document.addEventListener("keydown",  () => leerSesion());
document.addEventListener("touchstart", () => leerSesion());

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
      guardarSesion(encontrado.usuario, encontrado.rol, encontrado.agente);
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

  // Product select preview — removed (product field no longer exists)

  // ── Restricciones en inputs numéricos ──
  // Teléfono: solo dígitos, máximo 9
  ["telefono", "edit-telefono"].forEach((id) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.setAttribute("maxlength", "9");
    el.setAttribute("inputmode", "numeric");
    el.addEventListener("input", () => {
      el.value = el.value.replace(/\D/g, "").slice(0, 9);
    });
    el.addEventListener("keydown", (e) => {
      const allowed = ["Backspace","Delete","ArrowLeft","ArrowRight","Tab","Home","End"];
      if (!allowed.includes(e.key) && !/^\d$/.test(e.key)) e.preventDefault();
    });
  });

  // Edad: solo dígitos, máximo 3
  ["edad", "edit-edad"].forEach((id) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.setAttribute("maxlength", "3");
    el.setAttribute("inputmode", "numeric");
    el.addEventListener("input", () => {
      el.value = el.value.replace(/\D/g, "").slice(0, 3);
    });
    el.addEventListener("keydown", (e) => {
      const allowed = ["Backspace","Delete","ArrowLeft","ArrowRight","Tab","Home","End"];
      if (!allowed.includes(e.key) && !/^\d$/.test(e.key)) e.preventDefault();
    });
  });
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
  borrarSesion();
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

  if (tab === "records")  verRegistros();
  if (tab === "encuesta") iniciarEncuesta();
  if (tab === "cotizador") cot_init();
}

/* ══════════════════════════════════════════════
   VALIDACIÓN
══════════════════════════════════════════════ */
function validateForm() {
  let valid = true;

  const fields = [
    { id: "nombre",      errId: "err-nombre",      msg: "Ingresa el nombre completo",                   check: (v) => v.trim().length >= 3 },
    { id: "telefono",    errId: "err-telefono",    msg: "El teléfono debe tener exactamente 9 dígitos", check: (v) => /^\d{9}$/.test(v.replace(/\s/g, "")) },
    { id: "edad",        errId: "err-edad",        msg: "Ingresa una edad válida (1–120)",               check: (v) => /^\d+$/.test(v) && +v >= 1 && +v <= 120 },
    { id: "producto",    errId: "err-producto",    msg: "Selecciona un producto",                       check: (v) => v !== "" },
    { id: "temperatura", errId: "err-temperatura", msg: "Selecciona la temperatura del lead",           check: (v) => v !== "" },
  ];

  fields.forEach(({ id, errId, msg, check }) => {
    const el  = document.getElementById(id);
    const err = document.getElementById(errId);
    if (!check(el.value)) {
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
["nombre", "telefono", "edad", "producto", "temperatura"].forEach((id) => {
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
    usuario:     leerSesion()?.usuario,
    agente:      leerSesion()?.agente,
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
                   return `${get("day")}/${get("month")}/${get("year")} ${get("hour")}:${get("minute")} ${ampm}`;
                 })(),
    nombre:      document.getElementById("nombre").value.trim(),
    telefono:    parseInt(document.getElementById("telefono").value.replace(/\s/g, ""), 10),
    edad:        parseInt(document.getElementById("edad").value, 10),
    producto:    document.getElementById("producto").value,
    temperatura: document.getElementById("temperatura").value,
    referencia:  document.getElementById("referencia").value.trim(),
    comentarios: document.getElementById("comentarios").value.trim(),
  };

  try {
    await fetch(URL_GOOGLE_SCRIPT, {
      method: "POST",
      mode:   "no-cors",
      body:   JSON.stringify(datos),
    });

    // Guardar datos del lead recién registrado para usarlos en el modal de WhatsApp
    window._ultimoLead = {
      nombre:   datos.nombre,
      telefono: String(datos.telefono),
      producto: datos.producto,
    };

    this.reset();
    showToast();

    // Clear validation states
    ["nombre", "telefono", "edad", "producto", "temperatura"].forEach((id) => {
      document.getElementById(id)?.classList.remove("invalid");
    });

    // Abrir el modal de WhatsApp
    abrirWaModal(window._ultimoLead);

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
   NORMALIZAR CLAVES (elimina tildes de los headers)
══════════════════════════════════════════════ */
function normalizarClaves(obj) {
  const resultado = {};
  Object.keys(obj).forEach((key) => {
    const keyNorm = key
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "") // elimina diacríticos (tildes)
      .toLowerCase()
      .trim();
    resultado[keyNorm] = obj[key];
  });
  // Preservar _rowIndex sin modificar
  if (obj._rowIndex !== undefined) resultado._rowIndex = obj._rowIndex;
  return resultado;
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

  const rol    = leerSesion()?.rol;
  const miUser = leerSesion()?.usuario;

  try {
    const response = await fetch(`${URL_GOOGLE_SCRIPT}?action=getLeads`);
    if (!response.ok) throw new Error("Error");
    const todosLosLeads = await response.json();

    allLeads = rol === "Administrador"
      ? todosLosLeads.map(normalizarClaves)
      : todosLosLeads.filter((l) => l.usuario === miUser).map(normalizarClaves);

    // Ordenar de más nuevo a más antiguo (usando parseFechaParaFiltro para manejar todos los formatos)
    allLeads.sort((a, b) => {
      const da = parseFechaParaFiltro(a.fecha);
      const db = parseFechaParaFiltro(b.fecha);
      if (da && db) return db - da;
      if (!da) return 1;
      if (!db) return -1;
      return 0;
    });

    currentPage = 1;

    // ── Mostrar botón de estadísticas para TODOS los usuarios ──
    document.getElementById("btn-ir-stats").style.display = "flex";

    // ── Controles exclusivos de administrador ──
    if (rol === "Administrador") {
      document.getElementById("wrap-filtro-asesor").style.display = "flex";
      document.getElementById("wrap-stats-asesor").style.display  = "flex";
      poblarSelectAsesores();
    }

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
   FILTROS RÁPIDOS
══════════════════════════════════════════════ */
let activeQuickFilter = "todos";

function setQuickFilter(tipo) {
  activeQuickFilter = tipo;

  // Actualizar botones activos
  ["todos","hoy","semana","mes","rango"].forEach(t => {
    const btn = document.getElementById("qf-" + t);
    if (btn) btn.classList.toggle("active", t === tipo);
  });

  // Mostrar/ocultar rango personalizado
  const rangoWrap = document.getElementById("rango-wrap");
  if (rangoWrap) rangoWrap.style.display = tipo === "rango" ? "block" : "none";

  // Limpiar fechas si no es rango
  if (tipo !== "rango") {
    const d = document.getElementById("fecha-desde");
    const h = document.getElementById("fecha-hasta");
    if (d) d.value = "";
    if (h) h.value = "";
  }

  aplicarFiltros();
}

function toggleRangoPersonalizado() {
  const esRango = activeQuickFilter === "rango";
  setQuickFilter(esRango ? "todos" : "rango");
}

/* ══════════════════════════════════════════════
   FILTROS: BÚSQUEDA + FECHA
══════════════════════════════════════════════ */
function aplicarFiltros() {
  const q          = document.getElementById("search-input")?.value.toLowerCase() || "";
  const desde      = document.getElementById("fecha-desde")?.value || "";
  const hasta      = document.getElementById("fecha-hasta")?.value || "";
  const asesorSel  = document.getElementById("filtro-asesor")?.value || "todos";

  const filtrados = allLeads.filter((l) => {
    // Filtro asesor
    const asesorOk = asesorSel === "todos" ||
      (l.usuario || "").toLowerCase() === asesorSel.toLowerCase() ||
      (l.agente  || "").toLowerCase() === asesorSel.toLowerCase();

    // Filtro texto
    const textoOk =
      !q ||
      (l.nombre   || "").toLowerCase().includes(q) ||
      (l.producto || "").toLowerCase().includes(q) ||
      (l.telefono || "").toString().includes(q)    ||
      (l.agente   || l.usuario || "").toLowerCase().includes(q);

    // Filtro fecha
    let fechaOk = true;
    const fechaLead = parseFechaParaFiltro(l.fecha);

    if (activeQuickFilter === "hoy") {
      const b = getLimaBounds("hoy");
      fechaOk = fechaLead ? fechaLead >= b.ini && fechaLead <= b.fin : false;
    } else if (activeQuickFilter === "semana") {
      const b = getLimaBounds("semana");
      fechaOk = fechaLead ? fechaLead >= b.ini && fechaLead <= b.fin : false;
    } else if (activeQuickFilter === "mes") {
      const b = getLimaBounds("mes");
      fechaOk = fechaLead ? fechaLead >= b.ini && fechaLead <= b.fin : false;
    } else if (activeQuickFilter === "rango" && (desde || hasta)) {
      if (desde && fechaLead) fechaOk = fechaOk && fechaLead >= new Date(desde + "T05:00:00Z");
      if (hasta && fechaLead) fechaOk = fechaOk && fechaLead <= new Date(hasta + "T28:59:59Z");
      if (!fechaLead) fechaOk = false;
    }

    return asesorOk && textoOk && fechaOk;
  });

  currentPage = 1;
  renderTable(filtrados, document.getElementById("tabla-registros"));
}

// Parsear fecha del lead para comparación
// Retorna un Date cuya hora local refleja la hora en Lima
function parseFechaParaFiltro(valor) {
  if (!valor) return null;

  // Formato propio: "dd/mm/yyyy h:mm am/pm"
  // Interpretamos los valores directamente como hora Lima → creamos Date local equivalente
  const mDDMMYYYY = String(valor).match(
    /^(\d{1,2})\/(\d{1,2})\/(\d{4})\s+(\d{1,2}):(\d{2})\s*(am|pm)$/i
  );
  if (mDDMMYYYY) {
    const day  = parseInt(mDDMMYYYY[1], 10);
    const mon  = parseInt(mDDMMYYYY[2], 10) - 1;
    const yr   = parseInt(mDDMMYYYY[3], 10);
    let   h    = parseInt(mDDMMYYYY[4], 10);
    const min  = parseInt(mDDMMYYYY[5], 10);
    const ampm = mDDMMYYYY[6].toLowerCase();
    if (ampm === "pm" && h !== 12) h += 12;
    if (ampm === "am" && h === 12) h = 0;
    // Construir como UTC con offset Lima (-05:00) para que la comparación sea correcta
    // Lima = UTC-5, así que sumamos 5 horas para obtener el UTC equivalente
    return new Date(Date.UTC(yr, mon, day, h + 5, min, 0, 0));
  }

  // ISO u otro formato nativo (Google Sheets serializa como ISO)
  const iso = new Date(valor);
  if (!isNaN(iso.getTime())) return iso;

  return null;
}

// Obtener los límites de hoy/semana/mes en UTC equivalente a Lima (UTC-5)
function getLimaBounds(tipo) {
  // Hora actual en Lima
  const nowLima  = new Date(new Date().toLocaleString("en-US", { timeZone: "America/Lima" }));
  const yr  = nowLima.getFullYear();
  const mon = nowLima.getMonth();
  const day = nowLima.getDate();
  const dow = nowLima.getDay(); // 0=dom, 1=lun...

  if (tipo === "hoy") {
    // ini = 00:00 Lima = 05:00 UTC
    const ini = new Date(Date.UTC(yr, mon, day, 5, 0, 0, 0));
    const fin = new Date(Date.UTC(yr, mon, day, 28, 59, 59, 999)); // 28 = 23+5
    return { ini, fin };
  }
  if (tipo === "semana") {
    const diffLunes = (dow + 6) % 7; // días desde el lunes
    const lunes = new Date(Date.UTC(yr, mon, day - diffLunes, 5, 0, 0, 0));
    const domingo = new Date(Date.UTC(yr, mon, day - diffLunes + 6, 28, 59, 59, 999));
    return { ini: lunes, fin: domingo };
  }
  if (tipo === "mes") {
    const ini = new Date(Date.UTC(yr, mon, 1, 5, 0, 0, 0));
    const fin = new Date(Date.UTC(yr, mon + 1, 0, 28, 59, 59, 999));
    return { ini, fin };
  }
  return null;
}

function limpiarFechas() {
  document.getElementById("fecha-desde").value = "";
  document.getElementById("fecha-hasta").value = "";
  aplicarFiltros();
}

function filtrarTabla() { aplicarFiltros(); }

/* ══════════════════════════════════════════════
   MODAL DE EXPORTACIÓN
══════════════════════════════════════════════ */
let exportPeriod = "todos";

function exportarExcel() {
  const overlay = document.getElementById("export-modal-overlay");
  overlay.style.display = "flex";
  overlay.offsetHeight;
  overlay.classList.add("active");
  document.body.style.overflow = "hidden";

  // Sincronizar período activo con la vista actual
  exportPeriod = activeQuickFilter;
  document.querySelectorAll(".export-period-btn").forEach(b => b.classList.remove("active"));
  const syncBtn = document.getElementById("ep-" + exportPeriod);
  if (syncBtn) syncBtn.classList.add("active");

  // Nombre de archivo por defecto
  const usuario = leerSesion()?.agente || leerSesion()?.usuario || "Leads";
  document.getElementById("export-filename").value = `Leads_${usuario}`;
  actualizarPreview();

  // Rango personalizado
  document.getElementById("export-rango-wrap").style.display = exportPeriod === "rango" ? "flex" : "none";

  // Preview filename on input
  document.getElementById("export-filename").oninput = () => {
    const val = document.getElementById("export-filename").value.trim() || "Mis_Leads";
    document.getElementById("filename-preview").textContent = val + ".xlsx";
  };
  document.getElementById("filename-preview").textContent =
    (document.getElementById("export-filename").value.trim() || "Mis_Leads") + ".xlsx";
}

function closeExportModal(event) {
  if (event && event.target !== document.getElementById("export-modal-overlay")) return;
  const overlay = document.getElementById("export-modal-overlay");
  overlay.classList.remove("active");
  setTimeout(() => { overlay.style.display = "none"; document.body.style.overflow = ""; }, 250);
}

function selectExportPeriod(period, btn) {
  exportPeriod = period;
  document.querySelectorAll(".export-period-btn").forEach(b => b.classList.remove("active"));
  btn.classList.add("active");
  document.getElementById("export-rango-wrap").style.display = period === "rango" ? "flex" : "none";
  actualizarPreview();
}

function getLeadsFiltradosParaExportar() {
  const desde = document.getElementById("exp-desde")?.value || "";
  const hasta = document.getElementById("exp-hasta")?.value || "";

  return allLeads.filter((l) => {
    const fechaLead = parseFechaParaFiltro(l.fecha);

    if (exportPeriod === "hoy") {
      const b = getLimaBounds("hoy");
      return fechaLead ? fechaLead >= b.ini && fechaLead <= b.fin : false;
    }
    if (exportPeriod === "semana") {
      const b = getLimaBounds("semana");
      return fechaLead ? fechaLead >= b.ini && fechaLead <= b.fin : false;
    }
    if (exportPeriod === "mes") {
      const b = getLimaBounds("mes");
      return fechaLead ? fechaLead >= b.ini && fechaLead <= b.fin : false;
    }
    if (exportPeriod === "rango") {
      let ok = true;
      if (desde && fechaLead) ok = ok && fechaLead >= new Date(desde + "T05:00:00Z");
      if (hasta && fechaLead) ok = ok && fechaLead <= new Date(hasta + "T28:59:59Z");
      if (!fechaLead && (desde || hasta)) ok = false;
      return ok;
    }
    return true; // "todos"
  });
}

function actualizarPreview() {
  const datos  = getLeadsFiltradosParaExportar();
  const labels = { todos: "Todos los registros", hoy: "Hoy", semana: "Esta semana", mes: "Este mes", rango: "Rango personalizado" };
  document.getElementById("preview-count").textContent  = datos.length;
  document.getElementById("preview-period").textContent = labels[exportPeriod] || "—";
}

function ejecutarExportacion() {
  const datos = getLeadsFiltradosParaExportar();

  if (datos.length === 0) {
    alert("No hay leads en el período seleccionado para exportar.");
    return;
  }

  const rol           = leerSesion()?.rol;
  const mostrarAsesor = rol === "Administrador";
  const usuario       = leerSesion()?.agente || leerSesion()?.usuario || "";
  const filename      = (document.getElementById("export-filename").value.trim() || "Mis_Leads") + ".xlsx";

  // Construir filas
  const headers = ["Fecha", "Nombre", "Teléfono", "Edad", "Producto", "Temperatura", ...(mostrarAsesor ? ["Asesor"] : []), "Referencia", "Comentarios"];

  const filas = datos.map(d => {
    const row = {
      "Fecha":        formatFecha(d.fecha),
      "Nombre":       d.nombre || "",
      "Teléfono":     String(d.telefono ?? d["teléfono"] ?? ""),
      "Edad":         d.edad ?? "",
      "Producto":     d.producto || "",
      "Temperatura":  d.temperatura || "",
      "Referencia":   d.referencia || "",
      "Comentarios":  d.comentarios || "",
    };
    if (mostrarAsesor) row["Asesor"] = d.agente || d.usuario || "";
    const ordered = {};
    headers.forEach(h => { ordered[h] = row[h] ?? ""; });
    return ordered;
  });

  // Crear workbook con SheetJS
  const ws = XLSX.utils.json_to_sheet(filas, { header: headers });

  // Estilos de ancho de columna
  ws["!cols"] = [
    { wch: 22 }, // Fecha
    { wch: 28 }, // Nombre
    { wch: 14 }, // Teléfono
    { wch: 8  }, // Edad
    { wch: 18 }, // Producto
    { wch: 12 }, // Temperatura
    ...(mostrarAsesor ? [{ wch: 16 }] : []), // Asesor
    { wch: 28 }, // Referencia
    { wch: 36 }, // Comentarios
  ];

  const wb = XLSX.utils.book_new();
  const sheetName = `Leads ${usuario}`.slice(0, 31); // Excel limit
  XLSX.utils.book_append_sheet(wb, ws, sheetName);

  // Descargar
  XLSX.writeFile(wb, filename);

  // Cerrar modal con pequeño delay
  setTimeout(() => closeExportModal(), 300);

  // Toast de confirmación
  showToastExport(datos.length);
}

function showToastExport(count) {
  // Reutilizamos el toast de edición con texto diferente
  const toast = document.getElementById("toast-edit");
  toast.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg> ${count} lead${count !== 1 ? "s" : ""} exportado${count !== 1 ? "s" : ""} correctamente`;
  toast.style.display = "flex";
  setTimeout(() => {
    toast.style.display = "none";
    toast.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg> ¡Lead actualizado con éxito!`;
  }, 3500);
}

/* ══════════════════════════════════════════════
   RENDER TABLE
══════════════════════════════════════════════ */
function formatFecha(valor) {
  if (!valor) return "—";

  // Si ya está en nuestro formato "dd/mm/yyyy h:mm am/pm", devolverlo directo
  if (/^\d{1,2}\/\d{1,2}\/\d{4}\s+\d{1,2}:\d{2}\s*(am|pm)$/i.test(String(valor).trim())) {
    return String(valor).trim();
  }

  // Para fechas ISO u otros formatos que sí parsea new Date() correctamente
  const date = new Date(valor);
  if (isNaN(date.getTime())) return String(valor); // fallback: mostrar tal cual
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Lima",
    day:    "2-digit",
    month:  "2-digit",
    year:   "numeric",
    hour:   "numeric",
    minute: "2-digit",
    hour12: true,
  }).formatToParts(date);
  const get  = (t) => parts.find(p => p.type === t)?.value ?? "";
  const ampm = get("dayPeriod").toLowerCase();
  return `${get("day")}/${get("month")}/${get("year")} ${get("hour")}:${get("minute")} ${ampm}`;
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

function getTempBadge(temp) {
  if (!temp) return `<span style="color:var(--slate-300)">—</span>`;
  const cfg = {
    "Frío":     { bg: "#fee2e2", color: "#b91c1c", dot: "#ef4444" },
    "Tibio":    { bg: "#fef9c3", color: "#92400e", dot: "#f59e0b" },
    "Caliente": { bg: "#dcfce7", color: "#166534", dot: "#22c55e" },
  };
  const c = cfg[temp];
  if (!c) return temp;
  return `<span class="badge-temp" style="background:${c.bg};color:${c.color}">
    <span style="width:7px;height:7px;border-radius:50%;background:${c.dot};display:inline-block;margin-right:4px;flex-shrink:0"></span>${temp}
  </span>`;
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

  const rol           = leerSesion()?.rol;
  const mostrarAsesor = rol === "Administrador";
  const totalPages    = Math.ceil(datos.length / PAGE_SIZE);

  // Clamp currentPage
  if (currentPage < 1)           currentPage = 1;
  if (currentPage > totalPages)  currentPage = totalPages;

  const start    = (currentPage - 1) * PAGE_SIZE;
  const end      = Math.min(start + PAGE_SIZE, datos.length);
  const pagSlice = datos.slice(start, end);

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
          <th>Temp.</th>
          ${mostrarAsesor ? "<th>Asesor</th>" : ""}
          <th>Referencia</th>
          <th>Comentarios</th>
          <th style="width:40px"></th>
        </tr>
      </thead>
      <tbody>`;

  pagSlice.forEach((d) => {
    const badgeClass = getBadgeClass(d.producto);
    const globalIdx  = allLeads.indexOf(d);
    const tempBadge  = getTempBadge(d.temperatura);
    html += `
      <tr class="row-clickable" onclick="abrirEditModal(${globalIdx})" title="Clic para editar este lead">
        <td style="white-space:nowrap; color:var(--slate-500); font-size:0.8rem">${formatFecha(d.fecha)}</td>
        <td style="font-weight:600">${d.nombre || d["nombre"] || "—"}</td>
        <td>${String(d.telefono ?? d["teléfono"] ?? "").trim() || "—"}</td>
        <td style="text-align:center">${d.edad ?? d["edad"] ?? "—"}</td>
        <td><span class="badge-product ${badgeClass}">${d.producto || "—"}</span></td>
        <td>${tempBadge}</td>
        ${mostrarAsesor ? `<td style="color:var(--slate-500); font-size:0.82rem">${d.agente || d.usuario || "—"}</td>` : ""}
        <td style="color:var(--slate-500); font-size:0.82rem; max-width:140px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap" title="${d.referencia || ""}">${d.referencia || "—"}</td>
        <td style="color:var(--slate-500); font-size:0.82rem; max-width:160px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap" title="${d.comentarios || ""}">${d.comentarios || "—"}</td>
        <td class="td-edit-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg></td>
      </tr>`;
  });

  html += `</tbody></table></div>`;

  // ── Footer con paginación ──
  html += `<div class="table-footer">`;

  if (totalPages > 1) {
    html += `<div class="pagination">`;

    // Botón anterior
    html += `<button class="pag-btn" onclick="cambiarPagina(${currentPage - 1}, ${JSON.stringify(datos).replace(/"/g, '&quot;')})" ${currentPage === 1 ? "disabled" : ""}>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="15 18 9 12 15 6"/></svg>
    </button>`;

    // Números de página
    const range = paginationRange(currentPage, totalPages);
    range.forEach((item) => {
      if (item === "…") {
        html += `<span class="pag-ellipsis">…</span>`;
      } else {
        html += `<button class="pag-btn pag-num ${item === currentPage ? "active" : ""}" onclick="cambiarPagina(${item}, ${JSON.stringify(datos).replace(/"/g, '&quot;')})">${item}</button>`;
      }
    });

    // Botón siguiente
    html += `<button class="pag-btn" onclick="cambiarPagina(${currentPage + 1}, ${JSON.stringify(datos).replace(/"/g, '&quot;')})" ${currentPage === totalPages ? "disabled" : ""}>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 18 15 12 9 6"/></svg>
    </button>`;

    html += `</div>`; // /pagination
  }

  html += `<span class="footer-count">Mostrando ${start + 1}–${end} de ${datos.length} registro${datos.length !== 1 ? "s" : ""}</span>`;
  html += `</div>`; // /table-footer

  contenedor.innerHTML = html;
}

// ── Rango de páginas con elipsis ──
function paginationRange(current, total) {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages = [];
  if (current <= 4) {
    pages.push(1, 2, 3, 4, 5, "…", total);
  } else if (current >= total - 3) {
    pages.push(1, "…", total - 4, total - 3, total - 2, total - 1, total);
  } else {
    pages.push(1, "…", current - 1, current, current + 1, "…", total);
  }
  return pages;
}

// ── Cambiar página ──
function cambiarPagina(page, datos) {
  currentPage = page;
  renderTable(datos, document.getElementById("tabla-registros"));
  // Scroll suave al inicio de la tabla
  document.getElementById("tabla-registros").scrollIntoView({ behavior: "smooth", block: "start" });
}

/* ══════════════════════════════════════════════
   MODAL EDITAR LEAD
══════════════════════════════════════════════ */
function abrirEditModal(idx) {
  const lead = allLeads[idx];
  if (!lead) return;

  // Guardar índice para usarlo al guardar
  document.getElementById("edit-row-index").value = idx;

  // Rellenar campos
  document.getElementById("edit-nombre").value      = lead.nombre      || "";
  document.getElementById("edit-telefono").value    = String(lead.telefono ?? lead["teléfono"] ?? "");
  document.getElementById("edit-edad").value        = lead.edad        ?? "";
  document.getElementById("edit-producto").value    = lead.producto    || "";
  document.getElementById("edit-temperatura").value = lead.temperatura || "";
  document.getElementById("edit-referencia").value  = lead.referencia  || "";
  document.getElementById("edit-comentarios").value = lead.comentarios || "";

  // Mostrar fecha (solo lectura en el subtítulo)
  document.getElementById("modal-fecha-display").textContent =
    `📅 Registrado el ${formatFecha(lead.fecha)}`;

  // Limpiar errores previos
  ["nombre","telefono","edad","producto"].forEach(f => {
    document.getElementById(`edit-err-${f}`).textContent = "";
    document.getElementById(`edit-${f}`).classList.remove("invalid");
  });

  // Mostrar modal
  const overlay = document.getElementById("edit-modal-overlay");
  overlay.style.display = "flex";
  // Forzar reflow para que la animación dispare
  overlay.offsetHeight;
  overlay.classList.add("active");
  document.body.style.overflow = "hidden";
}

function closeEditModal(event) {
  // Si se hizo clic en el overlay (fondo), cerrar; si fue dentro del card, no
  if (event && event.target !== document.getElementById("edit-modal-overlay")) return;

  const overlay = document.getElementById("edit-modal-overlay");
  overlay.classList.remove("active");
  setTimeout(() => {
    overlay.style.display = "none";
    document.body.style.overflow = "";
  }, 250);
}

// Cerrar con Escape
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") closeEditModal();
});

function validateEditForm() {
  let valid = true;
  const fields = [
    { id: "edit-nombre",   errId: "edit-err-nombre",   msg: "Ingresa el nombre completo",      check: (v) => v.trim().length >= 3 },
    { id: "edit-telefono", errId: "edit-err-telefono", msg: "El teléfono debe tener exactamente 9 dígitos", check: (v) => /^\d{9}$/.test(v.replace(/\s/g, "")) },
    { id: "edit-edad",     errId: "edit-err-edad",     msg: "Ingresa una edad válida (1–120)",               check: (v) => /^\d+$/.test(v) && +v >= 1 && +v <= 120 },
    { id: "edit-producto",    errId: "edit-err-producto",    msg: "Selecciona un producto",              check: (v) => v !== "" },
    { id: "edit-temperatura", errId: "edit-err-temperatura", msg: "Selecciona la temperatura del lead",   check: (v) => v !== "" },
  ];
  fields.forEach(({ id, errId, msg, check }) => {
    const el  = document.getElementById(id);
    const err = document.getElementById(errId);
    if (!check(el.value)) {
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

async function guardarEdicion() {
  if (!validateEditForm()) return;

  const idx  = parseInt(document.getElementById("edit-row-index").value, 10);
  const lead = allLeads[idx];
  if (!lead) return;

  // Loading state
  const btn    = document.getElementById("btn-save-edit");
  const text   = btn.querySelector(".btn-text");
  const loader = btn.querySelector(".btn-loader");
  btn.disabled         = true;
  text.style.display   = "none";
  loader.style.display = "flex";

  const datosEditados = {
    action:      "updateLead",
    rowIndex:    lead._rowIndex, // índice real de la fila en el sheet (ver nota abajo)
    usuario:     lead.usuario,
    agente:      lead.agente,
    fecha:       lead.fecha,     // no se modifica
    nombre:      document.getElementById("edit-nombre").value.trim(),
    telefono:    parseInt(document.getElementById("edit-telefono").value.replace(/\s/g, ""), 10),
    edad:        parseInt(document.getElementById("edit-edad").value, 10),
    producto:    document.getElementById("edit-producto").value,
    temperatura: document.getElementById("edit-temperatura").value,
    referencia:  document.getElementById("edit-referencia").value.trim(),
    comentarios: document.getElementById("edit-comentarios").value.trim(),
  };

  try {
    await fetch(URL_GOOGLE_SCRIPT, {
      method: "POST",
      mode:   "no-cors",
      body:   JSON.stringify(datosEditados),
    });

    // Actualizar cache local para reflejar cambios sin recargar
    allLeads[idx] = { ...lead, ...datosEditados };

    // Cerrar modal y refrescar tabla
    const overlay = document.getElementById("edit-modal-overlay");
    overlay.classList.remove("active");
    setTimeout(() => {
      overlay.style.display = "none";
      document.body.style.overflow = "";
    }, 250);

    renderTable(allLeads, document.getElementById("tabla-registros"));
    showToastEdit();

  } catch (error) {
    alert("Error al guardar. Verifica tu conexión e intenta de nuevo.");
  } finally {
    btn.disabled         = false;
    text.style.display   = "flex";
    loader.style.display = "none";
  }
}

function showToastEdit() {
  const toast = document.getElementById("toast-edit");
  toast.style.display = "flex";
  setTimeout(() => {
    toast.style.animation = "none";
    toast.style.display   = "none";
    toast.style.animation = "";
  }, 3500);
}

/* ══════════════════════════════════════════════
   ENCUESTA — QR Y LINK PERSONALIZADO
══════════════════════════════════════════════ */
let qrInstance = null;

function iniciarEncuesta() {
  const usuario = leerSesion()?.usuario || "asesor";
  // La URL de la encuesta pública con el usuario codificado como parámetro
  const baseUrl = window.location.href.replace(/\/[^/]*$/, "") + "/encuesta.html";
  const encuestaUrl = `${baseUrl}?u=${encodeURIComponent(usuario)}`;

  // Mostrar el link
  document.getElementById("encuesta-link-text").textContent = encuestaUrl;

  // Generar QR solo una vez o si el usuario cambió
  const container = document.getElementById("qr-container");
  if (container.dataset.generatedFor === usuario) return; // ya generado
  container.dataset.generatedFor = usuario;
  container.innerHTML = ""; // limpiar

  const LOGO_URL = "https://res.cloudinary.com/dwxiuavqd/image/upload/v1774998253/468951353_1098106335437147_8489372296479282912_n_insezr.jpg";
  const QR_SIZE  = 240;

  qrInstance = new QRCode(container, {
    text:          encuestaUrl,
    width:         QR_SIZE,
    height:        QR_SIZE,
    colorDark:     "#002d72",
    colorLight:    "#ffffff",
    correctLevel:  QRCode.CorrectLevel.H, // nivel H para poder superponer logo
  });

  // Superponer logo Auna en el centro del QR
  setTimeout(() => {
    const canvas = container.querySelector("canvas");
    if (!canvas) return;

    const ctx    = canvas.getContext("2d");
    const logo   = new Image();
    logo.crossOrigin = "anonymous";
    logo.onload = () => {
      const logoSize   = QR_SIZE * 0.22;
      const logoX      = (QR_SIZE - logoSize) / 2;
      const logoY      = (QR_SIZE - logoSize) / 2;
      const padding    = 6;
      const radius     = 8;

      // Fondo blanco redondeado para el logo
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.roundRect(logoX - padding, logoY - padding, logoSize + padding * 2, logoSize + padding * 2, radius);
      ctx.fill();

      // Logo
      ctx.drawImage(logo, logoX, logoY, logoSize, logoSize);
    };
    logo.src = LOGO_URL;
  }, 200);
}

function copiarLink() {
  const link = document.getElementById("encuesta-link-text").textContent;
  navigator.clipboard.writeText(link).then(() => {
    const btn  = document.getElementById("btn-copy");
    const icon = document.getElementById("copy-icon");
    icon.innerHTML = `<polyline points="20 6 9 17 4 12"/>`;
    btn.style.background = "var(--green-500)";
    btn.style.color = "white";
    setTimeout(() => {
      icon.innerHTML = `<rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>`;
      btn.style.background = "";
      btn.style.color = "";
    }, 2000);
  });
}

function descargarQR() {
  const canvas = document.querySelector("#qr-container canvas");
  if (!canvas) return;

  const usuario = leerSesion()?.usuario || "asesor";
  const link    = document.createElement("a");
  link.download = `QR_Encuesta_${usuario}.png`;
  link.href     = canvas.toDataURL("image/png");
  link.click();
}

/* ══════════════════════════════════════════════
   ADMIN — POBLAR SELECTORES DE ASESORES
══════════════════════════════════════════════ */
function poblarSelectAsesores() {
  const asesores = [...new Set(allLeads.map(l => l.agente || l.usuario).filter(Boolean))].sort();

  ["filtro-asesor", "stats-asesor"].forEach(id => {
    const sel = document.getElementById(id);
    if (!sel) return;
    // Preservar opción "todos"
    sel.innerHTML = `<option value="todos">Todos los asesores</option>`;
    asesores.forEach(a => {
      const opt = document.createElement("option");
      opt.value = a;
      opt.textContent = a;
      sel.appendChild(opt);
    });
  });
}

/* ══════════════════════════════════════════════
   ADMIN — NAVEGACIÓN LISTA ↔ STATS
══════════════════════════════════════════════ */
function mostrarEstadisticas() {
  document.getElementById("vista-lista").style.display = "none";
  document.getElementById("vista-stats").style.display = "block";

  const rol    = leerSesion()?.rol;
  const agente = leerSesion()?.agente || leerSesion()?.usuario;

  if (rol === "Administrador") {
    // Admin: poblar selector y mostrar vista global por defecto
    poblarSelectAsesores();
    const sel = document.getElementById("stats-asesor");
    if (sel) sel.value = "todos";
    document.querySelector(".stats-topbar-title").textContent = "Panel de Estadísticas";
  } else {
    // Asesor: forzar su propio nombre en el selector oculto
    const sel = document.getElementById("stats-asesor");
    if (sel) {
      sel.innerHTML = `<option value="${agente}" selected>${agente}</option>`;
      sel.value = agente;
    }
    document.querySelector(".stats-topbar-title").textContent = "Mis Estadísticas";
  }

  // Período inicial: mes
  currentStatsPeriod = "mes";
  document.querySelectorAll(".sp-btn").forEach(b => b.classList.remove("active"));
  document.getElementById("sp-mes")?.classList.add("active");
  document.getElementById("stats-rango-wrap").style.display = "none";
  calMesAsesor = null;
  renderStats();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function volverALista() {
  document.getElementById("vista-stats").style.display = "none";
  document.getElementById("vista-lista").style.display = "block";
  window.scrollTo({ top: 0, behavior: "smooth" });
}

/* ══════════════════════════════════════════════
   ADMIN — PERÍODO DE ESTADÍSTICAS
══════════════════════════════════════════════ */
let currentStatsPeriod = "mes";

function setStatsPeriod(period, btn) {
  currentStatsPeriod = period;
  document.querySelectorAll(".sp-btn").forEach(b => b.classList.remove("active"));
  btn.classList.add("active");
  const rangoWrap = document.getElementById("stats-rango-wrap");
  rangoWrap.style.display = period === "rango" ? "block" : "none";

  // Sincronizar el calendario al mes correspondiente
  const hoy = new Date();
  if (period === "hoy" || period === "semana" || period === "mes") {
    // Todos estos caen en el mes actual
    calMesAsesor = { year: hoy.getFullYear(), month: hoy.getMonth() };
  }

  if (period !== "rango") renderStats();
}

/* ══════════════════════════════════════════════
   ADMIN — FILTRAR LEADS PARA STATS
══════════════════════════════════════════════ */
function getLeadsParaStats() {
  const rol       = leerSesion()?.rol;
  const agente    = leerSesion()?.agente || leerSesion()?.usuario || "";
  const asesorSel = document.getElementById("stats-asesor")?.value || "todos";
  const desde     = document.getElementById("stats-desde")?.value || "";
  const hasta     = document.getElementById("stats-hasta")?.value || "";
  const hoy       = new Date();

  return allLeads.filter(l => {
    // Filtro asesor: admin respeta el selector, no-admin siempre filtra por el suyo
    let asesorOk;
    if (rol === "Administrador") {
      asesorOk = asesorSel === "todos" ||
        (l.agente  || "").toLowerCase() === asesorSel.toLowerCase() ||
        (l.usuario || "").toLowerCase() === asesorSel.toLowerCase();
    } else {
      asesorOk = (l.agente  || "").toLowerCase() === agente.toLowerCase() ||
                 (l.usuario || "").toLowerCase() === agente.toLowerCase();
    }

    const fl = parseFechaParaFiltro(l.fecha);
    let fechaOk = true;

    if (currentStatsPeriod === "hoy") {
      const b = getLimaBounds("hoy");
      fechaOk = fl ? fl >= b.ini && fl <= b.fin : false;
    } else if (currentStatsPeriod === "semana") {
      const b = getLimaBounds("semana");
      fechaOk = fl ? fl >= b.ini && fl <= b.fin : false;
    } else if (currentStatsPeriod === "mes") {
      const b = getLimaBounds("mes");
      fechaOk = fl ? fl >= b.ini && fl <= b.fin : false;
    } else if (currentStatsPeriod === "rango") {
      if (desde && fl) fechaOk = fechaOk && fl >= new Date(desde + "T05:00:00Z");
      if (hasta && fl) fechaOk = fechaOk && fl <= new Date(hasta + "T28:59:59Z");
      if (!fl && (desde || hasta)) fechaOk = false;
    }

    return asesorOk && fechaOk;
  });
}

/* ══════════════════════════════════════════════
   ADMIN — RENDER STATS PRINCIPAL
══════════════════════════════════════════════ */
function renderStats() {
  const rol       = leerSesion()?.rol;
  const agente    = leerSesion()?.agente || leerSesion()?.usuario;
  const asesorSel = document.getElementById("stats-asesor")?.value || "todos";
  const datos     = getLeadsParaStats();
  const container = document.getElementById("stats-content");

  // No-admin siempre ve su propio calendario individual
  if (rol !== "Administrador") {
    if (!calMesAsesor) {
      const h = new Date();
      calMesAsesor = { year: h.getFullYear(), month: h.getMonth() };
    }
    renderStatsAsesor(agente, datos, container);
    return;
  }

  // Admin: reset calendario al cambiar de asesor a "todos"
  if (asesorSel === "todos") {
    calMesAsesor = null;
    renderStatsGlobal(datos, container);
  } else {
    if (!calMesAsesor) {
      const h = new Date();
      calMesAsesor = { year: h.getFullYear(), month: h.getMonth() };
    }
    renderStatsAsesor(asesorSel, datos, container);
  }
}

/* ── STATS GLOBALES (todos los asesores) ── */
function renderStatsGlobal(datos, container) {
  // Conteo por asesor
  const porAsesor = {};
  datos.forEach(l => {
    const key = l.agente || l.usuario || "—";
    porAsesor[key] = (porAsesor[key] || 0) + 1;
  });

  const ranking = Object.entries(porAsesor).sort((a, b) => b[1] - a[1]);
  const medals  = ["🥇","🥈","🥉"];
  const topColors = ["#FFD700","#C0C0C0","#CD7F32"];

  // Calcular máximo para barras proporcionales
  const maxLeads = ranking[0]?.[1] || 1;

  const periodLabel = { mes: "este mes", semana: "esta semana", hoy: "hoy", rango: "en el rango seleccionado" };

  container.innerHTML = `
    <div class="stats-global">

      <!-- KPI principal -->
      <div class="kpi-card kpi-main">
        <div class="kpi-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
        </div>
        <div>
          <div class="kpi-num">${datos.length}</div>
          <div class="kpi-label">leads captados ${periodLabel[currentStatsPeriod] || ""}</div>
        </div>
      </div>

      <!-- KPIs secundarios -->
      <div class="kpi-grid">
        <div class="kpi-card kpi-sm">
          <div class="kpi-sm-num">${Object.keys(porAsesor).length}</div>
          <div class="kpi-sm-label">asesores activos</div>
        </div>
        <div class="kpi-card kpi-sm">
          <div class="kpi-sm-num">${Object.keys(porAsesor).length ? Math.round(datos.length / Object.keys(porAsesor).length) : 0}</div>
          <div class="kpi-sm-label">leads promedio / asesor</div>
        </div>
        <div class="kpi-card kpi-sm">
          <div class="kpi-sm-num">${ranking[0]?.[1] || 0}</div>
          <div class="kpi-sm-label">máximo individual</div>
        </div>
      </div>

      <!-- Ranking completo con top 3 resaltados -->
      ${ranking.length > 0 ? `
      <div class="stats-section-card">
        <div class="stats-section-header">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
          Ranking de Asesores
        </div>
        <div class="ranking-table">
          ${ranking.map(([nombre, count], i) => {
            const esTop = i < 3;
            const medal = esTop ? medals[i] : "";
            const barColor = esTop ? topColors[i] : null;
            return `
            <div class="ranking-row ${esTop ? "ranking-top" : ""}" style="${esTop ? `border-left: 3px solid ${topColors[i]};` : ""}">
              <div class="ranking-pos">${medal || (i + 1)}</div>
              <div class="ranking-avatar" style="${esTop ? `background: linear-gradient(135deg, ${topColors[i]}, ${topColors[i]}cc)` : ""}">${nombre.charAt(0).toUpperCase()}</div>
              <div class="ranking-nombre" style="${esTop ? "font-weight:700; color:var(--slate-900)" : ""}">${nombre}</div>
              <div class="ranking-bar-wrap">
                <div class="ranking-bar" style="width:${Math.round((count/maxLeads)*100)}%; ${barColor ? `background:${barColor}` : ""}"></div>
              </div>
              <div class="ranking-count" style="${esTop ? `color:${topColors[i]}` : ""}">${count}</div>
            </div>`;
          }).join("")}
        </div>
      </div>` : `
      <div class="empty-state" style="padding:3rem">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
        <p>No hay leads en el período seleccionado.</p>
      </div>`}

    </div>
  `;
}

/* ── STATS INDIVIDUALES (un asesor) ── */
let chartInstance  = null;
let calMesAsesor   = null; // {year, month} seleccionado para el calendario

function renderStatsAsesor(asesor, datos, container) {
  // Agrupar todos los leads del asesor (sin filtro de período) por día
  // para el calendario (el calendario muestra el mes seleccionado)
  const todosLeadsAsesor = allLeads.filter(l =>
    (l.agente  || "").toLowerCase() === asesor.toLowerCase() ||
    (l.usuario || "").toLowerCase() === asesor.toLowerCase()
  );

  const porDiaTodos = {};
  todosLeadsAsesor.forEach(l => {
    const fl = parseFechaParaFiltro(l.fecha);
    if (!fl) return;
    const key = `${String(fl.getDate()).padStart(2,"0")}/${String(fl.getMonth()+1).padStart(2,"0")}/${fl.getFullYear()}`;
    porDiaTodos[key] = (porDiaTodos[key] || 0) + 1;
  });

  // Leads filtrados por período (para KPIs y gráfica)
  const porDia = {};
  datos.forEach(l => {
    const fl = parseFechaParaFiltro(l.fecha);
    if (!fl) return;
    const key = `${String(fl.getDate()).padStart(2,"0")}/${String(fl.getMonth()+1).padStart(2,"0")}/${fl.getFullYear()}`;
    porDia[key] = (porDia[key] || 0) + 1;
  });

  // Mes/año para el calendario
  const hoy = new Date();
  if (!calMesAsesor) calMesAsesor = { year: hoy.getFullYear(), month: hoy.getMonth() };
  const { year, month } = calMesAsesor;

  const MESES = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
  const DIAS  = ["Lu","Ma","Mi","Ju","Vi","Sá","Do"];

  // Construir calendario con los datos de TODOS los meses (no solo el período)
  const primerDia    = new Date(year, month, 1);
  const ultimoDia    = new Date(year, month + 1, 0);
  const offsetInicio = (primerDia.getDay() + 6) % 7;

  let calCells = "";
  // Calcular rango de "esta semana" para resaltar en el calendario
  const lunesSemana = new Date(hoy);
  lunesSemana.setDate(hoy.getDate() - ((hoy.getDay() + 6) % 7));
  lunesSemana.setHours(0,0,0,0);
  const domingoSemana = new Date(lunesSemana);
  domingoSemana.setDate(lunesSemana.getDate() + 6);
  domingoSemana.setHours(23,59,59,999);

  for (let i = 0; i < offsetInicio; i++) calCells += `<div class="cal-cell cal-empty"></div>`;

  for (let d = 1; d <= ultimoDia.getDate(); d++) {
    const key        = `${String(d).padStart(2,"0")}/${String(month+1).padStart(2,"0")}/${year}`;
    const count      = porDiaTodos[key] || 0;
    const fechaCelda = new Date(year, month, d);
    const esHoy      = d === hoy.getDate() && month === hoy.getMonth() && year === hoy.getFullYear();
    const esSemana   = fechaCelda >= lunesSemana && fechaCelda <= domingoSemana && month === hoy.getMonth() && year === hoy.getFullYear();
    const tieneLeads = count > 0;

    // Clases de resaltado según período activo
    let highlightClass = "";
    if (currentStatsPeriod === "hoy"    && esHoy)    highlightClass = "cal-highlight-hoy";
    if (currentStatsPeriod === "semana" && esSemana) highlightClass = "cal-highlight-semana";

    calCells += `
      <div class="cal-cell ${tieneLeads ? "cal-active" : ""} ${esHoy ? "cal-today" : ""} ${highlightClass}">
        <span class="cal-day-num">${d}</span>
        ${tieneLeads ? `<span class="cal-count">${count}</span>` : ""}
      </div>`;
  }

  // Datos para la gráfica (período filtrado, ordenados)
  const diasOrdenados = Object.entries(porDia).sort((a, b) => {
    const [da, ma, ya] = a[0].split("/").map(Number);
    const [db, mb, yb] = b[0].split("/").map(Number);
    return new Date(ya, ma-1, da) - new Date(yb, mb-1, db);
  });

  // Opciones para el selector de mes (últimos 24 meses)
  let mesOpts = "";
  for (let i = 0; i < 24; i++) {
    const d = new Date(hoy.getFullYear(), hoy.getMonth() - i, 1);
    const y = d.getFullYear();
    const m = d.getMonth();
    const sel = (y === year && m === month) ? "selected" : "";
    mesOpts += `<option value="${y}-${m}" ${sel}>${MESES[m]} ${y}</option>`;
  }

  container.innerHTML = `
    <div class="stats-asesor">

      <!-- KPI asesor -->
      <div class="kpi-asesor-header">
        <div class="kpi-asesor-avatar">${asesor.charAt(0).toUpperCase()}</div>
        <div>
          <div class="kpi-asesor-nombre">${asesor}</div>
          <div class="kpi-asesor-sub">${datos.length} lead${datos.length !== 1 ? "s" : ""} · ${Object.keys(porDia).length} día${Object.keys(porDia).length !== 1 ? "s" : ""} en campo (período seleccionado)</div>
        </div>
        <div class="kpi-asesor-badges">
          <div class="kpi-badge">
            <div class="kpi-badge-num">${datos.length}</div>
            <div class="kpi-badge-label">Total leads</div>
          </div>
          <div class="kpi-badge">
            <div class="kpi-badge-num">${Object.keys(porDia).length}</div>
            <div class="kpi-badge-label">Días en campo</div>
          </div>
          <div class="kpi-badge">
            <div class="kpi-badge-num">${Object.keys(porDia).length ? (datos.length / Object.keys(porDia).length).toFixed(1) : 0}</div>
            <div class="kpi-badge-label">Promedio/día</div>
          </div>
        </div>
      </div>

      <!-- Calendario -->
      <div class="stats-section-card">
        <div class="stats-section-header" style="justify-content:space-between; flex-wrap:wrap; gap:8px">
          <div style="display:flex;align-items:center;gap:8px">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
            Calendario de Campo
          </div>
          <div class="cal-mes-nav">
            <button class="cal-nav-btn" onclick="cambiarMesCal(-1)" title="Mes anterior">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="15 18 9 12 15 6"/></svg>
            </button>
            <select class="cal-mes-select" onchange="seleccionarMesCal(this.value)">
              ${mesOpts}
            </select>
            <button class="cal-nav-btn" onclick="cambiarMesCal(1)" title="Mes siguiente"
              ${(year === hoy.getFullYear() && month === hoy.getMonth()) ? 'disabled' : ''}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 18 15 12 9 6"/></svg>
            </button>
          </div>
        </div>
        <div class="calendar-wrap">
          <div class="cal-header">
            ${DIAS.map(d => `<div class="cal-header-cell">${d}</div>`).join("")}
          </div>
          <div class="cal-grid">
            ${calCells}
          </div>
          <div class="cal-legend">
            <span class="cal-legend-dot active-dot"></span> Días con leads
            <span class="cal-today-dot"></span> Hoy
            ${currentStatsPeriod === "semana" ? `<span class="cal-legend-dot semana-dot"></span> Esta semana` : ""}
            ${currentStatsPeriod === "hoy"    ? `<span class="cal-legend-dot hoy-dot"></span> Hoy (filtro activo)` : ""}
          </div>
        </div>
      </div>

      <!-- Gráfica de producción -->
      ${diasOrdenados.length > 0 ? `
      <div class="stats-section-card">
        <div class="stats-section-header">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
          Producción por Salida de Campo (período seleccionado)
        </div>
        <div class="chart-container">
          <canvas id="chart-produccion"></canvas>
        </div>
        <div class="chart-trend" id="chart-trend"></div>
      </div>` : `
      <div class="stats-section-card">
        <div class="empty-state" style="padding:2rem">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          <p>No hay datos de campo en el período seleccionado.</p>
        </div>
      </div>`}

    </div>
  `;

  if (diasOrdenados.length > 0) {
    requestAnimationFrame(() => dibujarGrafica(diasOrdenados));
  }
}

/* ── Navegación del calendario ── */
function cambiarMesCal(delta) {
  if (!calMesAsesor) { const h = new Date(); calMesAsesor = { year: h.getFullYear(), month: h.getMonth() }; }
  let { year, month } = calMesAsesor;
  month += delta;
  if (month > 11) { month = 0; year++; }
  if (month < 0)  { month = 11; year--; }

  // No permitir avanzar más allá del mes actual
  const hoy = new Date();
  if (year > hoy.getFullYear() || (year === hoy.getFullYear() && month > hoy.getMonth())) return;

  calMesAsesor = { year, month };
  sincronizarPeriodoConCalendario(year, month);
  renderStats();
}

function seleccionarMesCal(value) {
  const [y, m] = value.split("-").map(Number);
  calMesAsesor = { year: y, month: m };
  sincronizarPeriodoConCalendario(y, m);
  renderStats();
}

// Sincroniza el filtro de período con el mes del calendario
function sincronizarPeriodoConCalendario(year, month) {
  const hoy = new Date();
  const esEsteMes = year === hoy.getFullYear() && month === hoy.getMonth();

  if (esEsteMes) {
    // El mes actual → activar "Este mes"
    currentStatsPeriod = "mes";
  } else {
    // Otro mes → usar "rango" abarcando todo ese mes
    currentStatsPeriod = "rango";
    const ini = `${year}-${String(month + 1).padStart(2,"0")}-01`;
    const lastDay = new Date(year, month + 1, 0).getDate();
    const fin = `${year}-${String(month + 1).padStart(2,"0")}-${String(lastDay).padStart(2,"0")}`;
    const desdeEl = document.getElementById("stats-desde");
    const hastaEl = document.getElementById("stats-hasta");
    if (desdeEl) desdeEl.value = ini;
    if (hastaEl) hastaEl.value = fin;
  }

  // Actualizar botones visualmente
  document.querySelectorAll(".sp-btn").forEach(b => b.classList.remove("active"));
  if (esEsteMes) {
    document.getElementById("sp-mes")?.classList.add("active");
    document.getElementById("stats-rango-wrap").style.display = "none";
  } else {
    document.getElementById("sp-rango")?.classList.add("active");
    document.getElementById("stats-rango-wrap").style.display = "block";
  }
}

/* ── GRÁFICA ── */
function dibujarGrafica(diasOrdenados) {
  const canvas = document.getElementById("chart-produccion");
  if (!canvas) return;

  const labels = diasOrdenados.map(([k]) => {
    const [d, m] = k.split("/");
    return `${d}/${m}`;
  });
  const valores = diasOrdenados.map(([, v]) => v);

  // Calcular tendencia
  const n = valores.length;
  let trend = "estable";
  if (n >= 3) {
    const mitad    = Math.floor(n / 2);
    const primera  = valores.slice(0, mitad).reduce((a, b) => a + b, 0) / mitad;
    const segunda  = valores.slice(n - mitad).reduce((a, b) => a + b, 0) / mitad;
    if (segunda > primera * 1.1)      trend = "subiendo";
    else if (segunda < primera * 0.9) trend = "bajando";
  }

  const trendConfig = {
    subiendo: { icon: "📈", label: "Producción en tendencia ascendente", color: "#10b981" },
    bajando:  { icon: "📉", label: "Producción en tendencia descendente", color: "#ef4444" },
    estable:  { icon: "➡️", label: "Producción estable", color: "#007bc3" },
  };
  const tc = trendConfig[trend];
  const trendEl = document.getElementById("chart-trend");
  if (trendEl) trendEl.innerHTML = `<span class="trend-badge" style="border-color:${tc.color};color:${tc.color}">${tc.icon} ${tc.label}</span>`;

  // Destruir gráfica previa si existe
  if (chartInstance) { chartInstance.destroy(); chartInstance = null; }

  const ctx = canvas.getContext("2d");
  chartInstance = new Chart(ctx, {
    type: "line",
    data: {
      labels,
      datasets: [{
        label: "Leads por día",
        data: valores,
        borderColor: "#005fcc",
        backgroundColor: "rgba(0,95,204,0.10)",
        borderWidth: 2.5,
        pointBackgroundColor: "#005fcc",
        pointRadius: 5,
        pointHoverRadius: 7,
        fill: true,
        tension: 0.35,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: ctx => ` ${ctx.raw} lead${ctx.raw !== 1 ? "s" : ""}`,
          },
        },
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: { stepSize: 1, font: { family: "Outfit", size: 12 } },
          grid: { color: "rgba(0,0,0,0.06)" },
        },
        x: {
          ticks: { font: { family: "Outfit", size: 11 } },
          grid: { display: false },
        },
      },
    },
  });
}




/* ══════════════════════════════════════════════
   COTIZADOR — lógica completa (prefijo cot_)
══════════════════════════════════════════════ */
const COT_TARIFARIO = [
  { plan:"Plan Auna salud Classic", rango:[0,17],   reg:130.3,   prom:84.68 },
  { plan:"Plan Auna salud Classic", rango:[18,25],  reg:154.72,  prom:100.55 },
  { plan:"Plan Auna salud Classic", rango:[26,35],  reg:172.63,  prom:112.19 },
  { plan:"Plan Auna salud Classic", rango:[36,40],  reg:192.19,  prom:124.9 },
  { plan:"Plan Auna salud Classic", rango:[41,45],  reg:254.08,  prom:165.13 },
  { plan:"Plan Auna salud Classic", rango:[46,50],  reg:298.02,  prom:193.69 },
  { plan:"Plan Auna salud Classic", rango:[51,55],  reg:387.61,  prom:251.91 },
  { plan:"Plan Auna salud Classic", rango:[56,60],  reg:464.15,  prom:301.66 },
  { plan:"Plan Auna salud Premium", rango:[0,17],   reg:234.3,   prom:140.56 },
  { plan:"Plan Auna salud Premium", rango:[18,25],  reg:279.58,  prom:167.71 },
  { plan:"Plan Auna salud Premium", rango:[26,35],  reg:311.89,  prom:187.1 },
  { plan:"Plan Auna salud Premium", rango:[36,40],  reg:347.46,  prom:208.45 },
  { plan:"Plan Auna salud Premium", rango:[41,45],  reg:457.36,  prom:274.37 },
  { plan:"Plan Auna salud Premium", rango:[46,50],  reg:538.16,  prom:322.85 },
  { plan:"Plan Auna salud Premium", rango:[51,55],  reg:630.3,   prom:378.12 },
  { plan:"Plan Auna salud Premium", rango:[56,60],  reg:678.77,  prom:407.19 },
  { plan:"Plan Auna salud Senior",  rango:[61,65],  reg:707.17,  prom:494.95 },
  { plan:"Plan Auna salud Senior",  rango:[66,70],  reg:858.24,  prom:600.68 },
  { plan:"Plan Auna salud Senior",  rango:[71,75],  reg:983.6,   prom:688.42 },
  { plan:"Plan Auna salud Senior",  rango:[76,80],  reg:1129.85, prom:790.78 },
  { plan:"Plan Auna salud Senior",  rango:[81,120], reg:1314.66, prom:920.13 },
  { plan:"Onco Pro", rango:[0,17],   reg:43.91,  prom:35.12 },
  { plan:"Onco Pro", rango:[18,25],  reg:47.03,  prom:37.62 },
  { plan:"Onco Pro", rango:[26,26],  reg:78.92,  prom:39.45 },
  { plan:"Onco Pro", rango:[27,35],  reg:90.38,  prom:45.18 },
  { plan:"Onco Pro", rango:[36,40],  reg:92.26,  prom:46.13 },
  { plan:"Onco Pro", rango:[41,41],  reg:99.82,  prom:49.9 },
  { plan:"Onco Pro", rango:[42,43],  reg:102.7,  prom:51.34 },
  { plan:"Onco Pro", rango:[44,45],  reg:104.58, prom:52.29 },
  { plan:"Onco Pro", rango:[46,46],  reg:112.29, prom:56.13 },
  { plan:"Onco Pro", rango:[47,47],  reg:113.75, prom:56.86 },
  { plan:"Onco Pro", rango:[48,48],  reg:115.04, prom:57.51 },
  { plan:"Onco Pro", rango:[49,49],  reg:120.53, prom:60.25 },
  { plan:"Onco Pro", rango:[50,50],  reg:130.1,  prom:65.03 },
  { plan:"Onco Pro", rango:[51,51],  reg:141.12, prom:70.54 },
  { plan:"Onco Pro", rango:[52,52],  reg:156.85, prom:78.41 },
  { plan:"Onco Pro", rango:[53,53],  reg:169.01, prom:84.49 },
  { plan:"Onco Pro", rango:[54,54],  reg:176.41, prom:88.19 },
  { plan:"Onco Pro", rango:[55,55],  reg:186.44, prom:93.2 },
  { plan:"Onco Pro", rango:[56,56],  reg:192.19, prom:96.08 },
  { plan:"Onco Pro", rango:[57,57],  reg:205.9,  prom:102.93 },
  { plan:"Onco Pro", rango:[58,58],  reg:215.63, prom:107.79 },
  { plan:"Onco Pro", rango:[59,59],  reg:229.73, prom:114.85 },
  { plan:"Onco Pro", rango:[60,60],  reg:243.13, prom:121.54 },
  { plan:"Onco Pro", rango:[61,61],  reg:256.98, prom:128.47 },
  { plan:"Onco Plus", rango:[0,17],  reg:53.58,  prom:42.86 },
  { plan:"Onco Plus", rango:[18,25], reg:57.55,  prom:46.03 },
  { plan:"Onco Plus", rango:[26,26], reg:131.72, prom:65.84 },
  { plan:"Onco Plus", rango:[27,35], reg:153.99, prom:76.98 },
  { plan:"Onco Plus", rango:[36,36], reg:160.49, prom:80.23 },
  { plan:"Onco Plus", rango:[37,37], reg:165.38, prom:82.67 },
  { plan:"Onco Plus", rango:[38,38], reg:166.97, prom:83.47 },
  { plan:"Onco Plus", rango:[39,39], reg:169.01, prom:84.49 },
  { plan:"Onco Plus", rango:[40,40], reg:171.3,  prom:85.63 },
  { plan:"Onco Plus", rango:[41,41], reg:175.43, prom:87.7 },
  { plan:"Onco Plus", rango:[42,42], reg:178.48, prom:89.22 },
  { plan:"Onco Plus", rango:[43,43], reg:186,    prom:92.98 },
  { plan:"Onco Plus", rango:[44,44], reg:188.52, prom:94.23 },
  { plan:"Onco Plus", rango:[45,45], reg:193.85, prom:96.9 },
  { plan:"Onco Plus", rango:[46,46], reg:201.98, prom:100.97 },
  { plan:"Onco Plus", rango:[47,47], reg:208.23, prom:104.1 },
  { plan:"Onco Plus", rango:[48,48], reg:215.93, prom:107.95 },
  { plan:"Onco Plus", rango:[49,49], reg:220.58, prom:110.27 },
  { plan:"Onco Plus", rango:[50,50], reg:234.15, prom:117.06 },
  { plan:"Onco Plus", rango:[51,51], reg:235.96, prom:117.96 },
  { plan:"Onco Plus", rango:[52,52], reg:243.14, prom:121.54 },
  { plan:"Onco Plus", rango:[53,53], reg:247.21, prom:123.58 },
  { plan:"Onco Plus", rango:[54,54], reg:250.51, prom:125.23 },
  { plan:"Onco Plus", rango:[55,55], reg:261.42, prom:130.69 },
  { plan:"Onco Plus", rango:[56,56], reg:276.39, prom:138.17 },
  { plan:"Onco Plus", rango:[57,57], reg:287.44, prom:143.69 },
  { plan:"Onco Plus", rango:[58,58], reg:306.17, prom:153.06 },
  { plan:"Onco Plus", rango:[59,59], reg:321.77, prom:160.86 },
  { plan:"Onco Plus", rango:[60,60], reg:337.16, prom:168.55 },
];

let cot_modoPanel     = "asesor";
let cot_currentInt    = 1;
let cot_modoActuarial = false;
let cot_initialised   = false;

function cot_init() {
  if (cot_initialised) return;
  cot_initialised = true;
  const hoy = new Date().toISOString().split("T")[0];
  document.getElementById("cot_fechaLimite").value = hoy;
  cot_renderizarCampos();
}

function cot_calcularEdadActuarial(fechaNac) {
  if (!fechaNac) return null;
  const hoy = new Date();
  const nac = new Date(fechaNac + "T00:00:00");
  if (isNaN(nac)) return null;
  let años = hoy.getFullYear() - nac.getFullYear();
  const yaCompleto = hoy.getMonth() > nac.getMonth() ||
    (hoy.getMonth() === nac.getMonth() && hoy.getDate() >= nac.getDate());
  if (!yaCompleto) años--;
  let ultimo = new Date(hoy.getFullYear(), nac.getMonth(), nac.getDate());
  if (!yaCompleto) ultimo = new Date(hoy.getFullYear() - 1, nac.getMonth(), nac.getDate());
  const proximo = new Date(ultimo); proximo.setFullYear(proximo.getFullYear() + 1);
  const fraccion = (hoy - ultimo) / (proximo - ultimo);
  return Math.round(años + fraccion);
}

function cot_toggleActuarial() {
  cot_modoActuarial = !cot_modoActuarial;
  const btn    = document.getElementById("cot_btnActuarial");
  const status = document.getElementById("cot_actuarial-status");
  if (cot_modoActuarial) {
    btn.classList.add("active");
    status.textContent = "Activado";
    status.classList.remove("off");
    status.classList.add("on");
  } else {
    btn.classList.remove("active");
    status.textContent = "Desactivado";
    status.classList.remove("on");
    status.classList.add("off");
  }
  cot_renderizarCampos();
}

function cot_cambiarModoActuarial() {
  cot_modoActuarial = document.getElementById("cot_toggleActuarial")?.checked || false;
  cot_renderizarCampos();
}

function cot_toggleMenuModo() {
  const menu    = document.getElementById("cot_menuModo");
  const chevron = document.getElementById("cot_chevronModo");
  menu.classList.toggle("hidden");
  chevron.style.transform = menu.classList.contains("hidden") ? "" : "rotate(180deg)";
}

function cot_seleccionarModo(modo) {
  cot_modoPanel = modo;
  document.getElementById("cot_menuModo").classList.add("hidden");
  document.getElementById("cot_chevronModo").style.transform = "";
  document.getElementById("cot_tituloPanel").textContent =
    modo === "asesor" ? "Panel del Asesor" : "Cotización de cliente";
  document.getElementById("cot_botonesAsesor").classList.toggle("hidden", modo !== "asesor");
  document.getElementById("cot_botonesCliente").classList.toggle("hidden", modo !== "cliente");
  cot_renderizarCampos();
}

function cot_cambiarIntegrantes(delta) {
  const nuevo = cot_currentInt + delta;
  if (nuevo < 1 || nuevo > 4) return;
  cot_currentInt = nuevo;
  document.getElementById("cot_contadorDisplay").textContent = cot_currentInt;
  cot_renderizarCampos();
}

function cot_renderizarCampos() {
  const wrap = document.getElementById("cot_contenedorIntegrantes");
  const vals = [];
  for (let i = 1; i <= 4; i++) vals.push({
    edad: document.getElementById("cot_edad-" + i)?.value || "",
    fnac: document.getElementById("cot_fnac-" + i)?.value || "",
    reg:  document.getElementById("cot_reg-"  + i)?.value || "0.00",
    prom: document.getElementById("cot_prom-" + i)?.value || "0.00",
  });

  wrap.innerHTML = "";
  const esCliente = cot_modoPanel === "cliente";

  for (let i = 1; i <= cot_currentInt; i++) {
    const v = vals[i - 1];
    let html = '<div class="cot-integrante-box">';

    if (cot_modoActuarial) {
      html += '<div><p class="cot-integrante-label">Fecha de Nacimiento</p>'
            + '<input type="date" id="cot_fnac-' + i + '" value="' + v.fnac + '" oninput="cot_autocompletarPrecios(' + i + ')" class="cot-input-date-nac"></div>';
      if (esCliente) {
        html += '<div class="cot-col-grid-2">'
              + '<div><p class="cot-integrante-label cyan">Edad Actuarial</p>'
              + '<div class="cot-edad-actuarial-display"><span id="cot_edad-display-' + i + '">--</span></div></div>'
              + '<div><p class="cot-integrante-label">Regular</p>'
              + '<input type="text" id="cot_reg-' + i + '" value="' + v.reg + '" readonly class="cot-input-locked"></div>'
              + '</div><input type="hidden" id="cot_prom-' + i + '" value="' + v.prom + '">';
      } else {
        html += '<div class="cot-col-grid-3">'
              + '<div><p class="cot-integrante-label cyan">Edad Actuarial</p>'
              + '<div class="cot-edad-actuarial-display"><span id="cot_edad-display-' + i + '">--</span></div></div>'
              + '<div><p class="cot-integrante-label">Regular</p>'
              + '<input type="text" id="cot_reg-' + i + '" value="' + v.reg + '" readonly class="cot-input-locked"></div>'
              + '<div><p class="cot-integrante-label cyan">Promo</p>'
              + '<input type="text" id="cot_prom-' + i + '" value="' + v.prom + '" readonly class="cot-input-locked cyan"></div>'
              + '</div>';
      }
    } else {
      if (esCliente) {
        html += '<div class="cot-col-grid-2">'
              + '<div><p class="cot-integrante-label">Edad</p>'
              + '<input type="text" inputmode="numeric" id="cot_edad-' + i + '" value="' + v.edad + '" oninput="cot_autocompletarPrecios(' + i + ')" placeholder="Ej: 35" class="cot-input-edad"></div>'
              + '<div><p class="cot-integrante-label">Regular</p>'
              + '<input type="text" id="cot_reg-' + i + '" value="' + v.reg + '" readonly class="cot-input-locked"></div>'
              + '</div><input type="hidden" id="cot_prom-' + i + '" value="' + v.prom + '">';
      } else {
        html += '<div class="cot-col-grid-3">'
              + '<div><p class="cot-integrante-label">Edad</p>'
              + '<input type="text" inputmode="numeric" id="cot_edad-' + i + '" value="' + v.edad + '" oninput="cot_autocompletarPrecios(' + i + ')" placeholder="Ej: 35" class="cot-input-edad"></div>'
              + '<div><p class="cot-integrante-label">Regular</p>'
              + '<input type="text" id="cot_reg-' + i + '" value="' + v.reg + '" readonly class="cot-input-locked"></div>'
              + '<div><p class="cot-integrante-label cyan">Promo</p>'
              + '<input type="text" id="cot_prom-' + i + '" value="' + v.prom + '" readonly class="cot-input-locked cyan"></div>'
              + '</div>';
      }
    }
    html += '<p id="cot_error-' + i + '" class="cot-error"></p></div>';
    wrap.innerHTML += html;
  }

  if (cot_modoActuarial) {
    for (let i = 1; i <= cot_currentInt; i++) {
      if (vals[i - 1].fnac) cot_autocompletarPrecios(i);
    }
  }
  cot_actualizarPreview();
}

function cot_autocompletarPrecios(id) {
  const plan    = document.getElementById("cot_planGlobal").value;
  const regEl   = document.getElementById("cot_reg-"   + id);
  const promEl  = document.getElementById("cot_prom-"  + id);
  const errorEl = document.getElementById("cot_error-" + id);
  if (!errorEl) return;
  errorEl.textContent = "";

  let edad;
  if (cot_modoActuarial) {
    const fnac = document.getElementById("cot_fnac-" + id)?.value;
    if (!fnac) { regEl.value = "0.00"; promEl.value = "0.00"; cot_actualizarPreview(); return; }
    edad = cot_calcularEdadActuarial(fnac);
    if (edad === null) { regEl.value = "0.00"; promEl.value = "0.00"; cot_actualizarPreview(); return; }
    const disp = document.getElementById("cot_edad-display-" + id);
    if (disp) disp.textContent = edad + " años";
  } else {
    const eStr = document.getElementById("cot_edad-" + id)?.value || "";
    edad = parseInt(eStr.replace(/\D/g, ""));
    if (isNaN(edad)) { regEl.value = "0.00"; promEl.value = "0.00"; cot_actualizarPreview(); return; }
  }

  let valid = true;
  if (plan === "Plan Auna salud Senior") {
    if (edad <= 60) { errorEl.textContent = "Mínimo 61 años"; valid = false; }
  } else {
    if (edad > 60) { errorEl.textContent = "Máximo 60 años"; valid = false; }
  }

  if (valid) {
    const match = COT_TARIFARIO.find(t => t.plan === plan && edad >= t.rango[0] && edad <= t.rango[1]);
    regEl.value  = match ? match.reg.toFixed(2)  : "0.00";
    promEl.value = match ? match.prom.toFixed(2) : "0.00";
  } else {
    regEl.value = "0.00"; promEl.value = "0.00";
  }
  cot_actualizarPreview();
}

function cot_actualizarTodoPorPlan() {
  for (let i = 1; i <= cot_currentInt; i++) cot_autocompletarPrecios(i);
}

function cot_formatearFecha(str) {
  if (!str) return "fin de mes";
  return new Date(str + "T12:00:00").toLocaleDateString("es-ES", { day: "numeric", month: "long" });
}

function cot_actualizarPreview() {
  const esCliente = cot_modoPanel === "cliente";
  const planEl = document.getElementById("cot_planGlobal");
  if (!planEl) return;
  document.getElementById("cot_prev-plan").textContent = planEl.value;

  const fechaStr = document.getElementById("cot_fechaLimite").value;
  document.getElementById("cot_texto-vence").textContent = "Vence el " + cot_formatearFecha(fechaStr);

  const beneficio = document.getElementById("cot_beneficio").value.trim();
  const areaBenef = document.getElementById("cot_area-beneficio");
  if (beneficio) {
    areaBenef.classList.remove("hidden");
    document.getElementById("cot_prev-beneficio").textContent = beneficio;
  } else {
    areaBenef.classList.add("hidden");
  }

  document.getElementById("cot_bloque-descuento").classList.toggle("hidden", esCliente);
  document.getElementById("cot_bloque-regular").classList.toggle("hidden",   !esCliente);

  let tR = 0, tP = 0;
  const lista = document.getElementById("cot_lista-detallada");
  lista.innerHTML = ""; // full re-render, no stale classes

  for (let i = 1; i <= cot_currentInt; i++) {
    let etiquetaEdad;
    if (cot_modoActuarial) {
      const disp = document.getElementById("cot_edad-display-" + i);
      etiquetaEdad = disp ? disp.textContent : "?";
      if (etiquetaEdad === "--") etiquetaEdad = "? años";
    } else {
      const e = document.getElementById("cot_edad-" + i)?.value || "?";
      etiquetaEdad = e + " años";
    }
    const r = parseFloat(document.getElementById("cot_reg-"  + i)?.value || 0);
    const p = parseFloat(document.getElementById("cot_prom-" + i)?.value || 0);
    tR += r; tP += p;

    if (esCliente) {
      lista.innerHTML += '<div class="cot-lista-item">'
        + '<span class="cot-lista-name">Integrante ' + i + ' (' + etiquetaEdad + ')</span>'
        + '<span class="cot-lista-reg-only cot-price-reg-val">S/ ' + r.toFixed(2) + '</span>'
        + '</div>';
    } else {
      lista.innerHTML += '<div class="cot-lista-item">'
        + '<span class="cot-lista-name">Integrante ' + i + ' (' + etiquetaEdad + ')</span>'
        + '<div style="text-align:right">'
        + '<span class="cot-lista-reg-through cot-price-reg-val">S/ ' + r.toFixed(2) + '</span>'
        + '<span class="cot-lista-promo cot-price-promo-val">S/ ' + p.toFixed(2) + '</span>'
        + '</div></div>';
    }
  }

  document.getElementById("cot_total-reg").textContent      = "S/ " + tR.toFixed(2);
  document.getElementById("cot_total-promo").textContent    = "S/ " + tP.toFixed(2);
  document.getElementById("cot_total-solo-reg").textContent = "S/ " + tR.toFixed(2);
}

async function cot_exportarCotizacion(conDescuento) {
  const card          = document.getElementById("cot_cotizacion-final");
  const bloqDesc      = document.getElementById("cot_bloque-descuento");
  const bloqReg       = document.getElementById("cot_bloque-regular");
  const esCliente     = cot_modoPanel === "cliente";

  // Preparar la tarjeta para la exportación según qué botón se pulsó
  if (conDescuento) {
    // Asesor con descuento: bloque promo visible, bloque regular oculto
    bloqDesc.classList.remove("hidden");
    bloqReg.classList.add("hidden");
  } else {
    // Sin descuento (asesor o cliente): solo precio regular
    bloqDesc.classList.add("hidden");
    bloqReg.classList.remove("hidden");
    // Ocultar precios tachados y mostrar solo el regular en cada fila
    card.querySelectorAll(".cot-price-reg-val").forEach(el => {
      el.classList.remove("cot-lista-reg-through");
      el.classList.add("cot-lista-reg-only");
    });
    card.querySelectorAll(".cot-price-promo-val").forEach(el => el.classList.add("hidden"));
  }

  try {
    if (typeof htmlToImage === "undefined") {
      alert("La librería de exportación no está cargada aún. Espera un momento y vuelve a intentarlo.");
      return;
    }
    const dataUrl = await htmlToImage.toJpeg(card, {
      quality: 0.95, pixelRatio: 2, width: 450, backgroundColor: "#ffffff",
    });
    const link = document.createElement("a");
    link.download = conDescuento ? "Cotizacion_Promo.jpg" : "Cotizacion_Regular.jpg";
    link.href = dataUrl.replace("image/jpeg", "image/octet-stream");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (err) {
    console.error("Error exportando:", err);
    alert("Hubo un error al generar la imagen.");
  } finally {
    // Restaurar el preview al estado correcto según el modo activo
    cot_actualizarPreview();
  }
}

// Cerrar dropdown del cotizador al hacer clic fuera
document.addEventListener("click", (e) => {
  const menu    = document.getElementById("cot_menuModo");
  if (!menu) return;
  // Si el menú está oculto, no hacer nada
  if (menu.classList.contains("hidden")) return;
  // El trigger es el botón que contiene cot_tituloPanel
  const trigger = document.querySelector(".cot-modo-btn");
  const clickDentroMenu    = menu.contains(e.target);
  const clickDentroTrigger = trigger && trigger.contains(e.target);
  if (!clickDentroMenu && !clickDentroTrigger) {
    menu.classList.add("hidden");
    const chevron = document.getElementById("cot_chevronModo");
    if (chevron) chevron.style.transform = "";
  }
});

/* ══════════════════════════════════════════════
   WHATSAPP MODAL
══════════════════════════════════════════════ */
let _waMensajeBase     = "";
let _waMensajeAnterior = ""; // para cancelar edición

async function abrirWaModal(lead) {
  document.getElementById("wa-lead-info").textContent =
    `${lead.nombre} · ${lead.producto} · +51 ${lead.telefono}`;

  // Cargar mensaje del usuario desde Sheets
  const usuario = leerSesion()?.usuario || "";
  try {
    const res  = await fetch(`${URL_GOOGLE_SCRIPT}?action=getMensaje&usuario=${encodeURIComponent(usuario)}`);
    const data = await res.json();
    _waMensajeBase = data.mensaje || "";
  } catch {
    _waMensajeBase = "";
  }

  document.getElementById("wa-mensaje").value = _waMensajeBase;
  actualizarPreviewWa();

  // Arrancar en modo vista previa
  mostrarModoPreview();

  // Mostrar modal
  const overlay = document.getElementById("wa-modal-overlay");
  overlay.style.display = "flex";
  overlay.offsetHeight;
  overlay.classList.add("active");
  document.body.style.overflow = "hidden";
}

function mostrarModoPreview() {
  document.getElementById("wa-mode-preview").style.display = "block";
  document.getElementById("wa-mode-edit").style.display    = "none";
  actualizarPreviewWa();
}

function abrirModoEdicion() {
  _waMensajeAnterior = document.getElementById("wa-mensaje").value; // guardar para cancelar
  document.getElementById("wa-mode-preview").style.display = "none";
  document.getElementById("wa-mode-edit").style.display    = "block";
  document.getElementById("wa-mensaje").oninput = actualizarPreviewWa;
  document.getElementById("wa-mensaje").focus();
}

function cancelarEdicion() {
  document.getElementById("wa-mensaje").value = _waMensajeAnterior;
  mostrarModoPreview();
}

function actualizarPreviewWa() {
  const lead  = window._ultimoLead || {};
  const texto = (document.getElementById("wa-mensaje")?.value || "")
    .replace(/\{nombre\}/gi,   lead.nombre   || "")
    .replace(/\{producto\}/gi, lead.producto || "");
  document.getElementById("wa-preview-text").textContent = texto || "—";
}

function insertarVariable(variable) {
  const ta  = document.getElementById("wa-mensaje");
  const ini = ta.selectionStart;
  const fin = ta.selectionEnd;
  ta.value  = ta.value.slice(0, ini) + variable + ta.value.slice(fin);
  ta.selectionStart = ta.selectionEnd = ini + variable.length;
  ta.focus();
  actualizarPreviewWa();
}

async function guardarMensajeWa() {
  const btn    = document.getElementById("wa-btn-guardar");
  const text   = btn.querySelector(".btn-text");
  const loader = btn.querySelector(".btn-loader");
  btn.disabled         = true;
  text.style.display   = "none";
  loader.style.display = "inline-flex";

  const usuario  = leerSesion()?.usuario || "";
  const mensaje  = document.getElementById("wa-mensaje").value;
  _waMensajeBase = mensaje;

  try {
    await fetch(URL_GOOGLE_SCRIPT, {
      method: "POST",
      mode:   "no-cors",
      body:   JSON.stringify({ action: "updateMensaje", usuario, mensaje }),
    });
    // Volver a modo preview tras guardar
    mostrarModoPreview();
  } catch {
    alert("Error al guardar el mensaje. Intenta de nuevo.");
  } finally {
    btn.disabled         = false;
    text.style.display   = "inline";
    loader.style.display = "none";
  }
}

function enviarWhatsapp() {
  const lead     = window._ultimoLead || {};
  const telefono = (lead.telefono || "").replace(/\D/g, "");
  const numero   = "51" + telefono;

  const mensaje = (document.getElementById("wa-mensaje")?.value || "")
    .replace(/\{nombre\}/gi,   lead.nombre   || "")
    .replace(/\{producto\}/gi, lead.producto || "");

  if (!telefono) { alert("No se encontró el número de teléfono del lead."); return; }

  window.open(`https://wa.me/${numero}?text=${encodeURIComponent(mensaje)}`, "_blank");
}

function closeWaModal(event) {
  if (event && event.target !== document.getElementById("wa-modal-overlay")) return;
  const overlay = document.getElementById("wa-modal-overlay");
  overlay.classList.remove("active");
  setTimeout(() => {
    overlay.style.display = "none";
    document.body.style.overflow = "";
  }, 250);
}
