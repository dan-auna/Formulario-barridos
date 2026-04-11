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

  if (tab === "records")  verRegistros();
  if (tab === "encuesta") iniciarEncuesta();
}

/* ══════════════════════════════════════════════
   VALIDACIÓN
══════════════════════════════════════════════ */
function validateForm() {
  let valid = true;

  const fields = [
    { id: "nombre",   errId: "err-nombre",   msg: "Ingresa el nombre completo",                    check: (v) => v.trim().length >= 3 },
    { id: "telefono", errId: "err-telefono", msg: "El teléfono debe tener exactamente 9 dígitos",  check: (v) => /^\d{9}$/.test(v.replace(/\s/g, "")) },
    { id: "edad",     errId: "err-edad",     msg: "Ingresa una edad válida (1–120)",                check: (v) => /^\d+$/.test(v) && +v >= 1 && +v <= 120 },
    { id: "producto", errId: "err-producto", msg: "Selecciona un producto",                        check: (v) => v !== "" },
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
                   return `${get("day")}/${get("month")}/${get("year")} ${get("hour")}:${get("minute")} ${ampm}`;
                 })(),
    nombre:      document.getElementById("nombre").value.trim(),
    telefono:    parseInt(document.getElementById("telefono").value.replace(/\s/g, ""), 10),
    edad:        parseInt(document.getElementById("edad").value, 10),
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

  const rol    = sessionStorage.getItem("rolActivo");
  const miUser = sessionStorage.getItem("usuarioActivo");

  try {
    const response = await fetch(`${URL_GOOGLE_SCRIPT}?action=getLeads`);
    if (!response.ok) throw new Error("Error");
    const todosLosLeads = await response.json();

    allLeads = rol === "Administrador"
      ? todosLosLeads.map(normalizarClaves)
      : todosLosLeads.filter((l) => l.usuario === miUser).map(normalizarClaves);

    // Ordenar de más nuevo a más antiguo
    allLeads.sort((a, b) => {
      const da = new Date(a.fecha);
      const db = new Date(b.fecha);
      // Fechas válidas: comparar numéricamente
      if (!isNaN(da) && !isNaN(db)) return db - da;
      // Si alguna no parsea, las ponemos al final
      if (isNaN(da)) return 1;
      if (isNaN(db)) return -1;
      return 0;
    });

    currentPage = 1;

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
  const q     = document.getElementById("search-input")?.value.toLowerCase() || "";
  const desde = document.getElementById("fecha-desde")?.value || "";
  const hasta = document.getElementById("fecha-hasta")?.value || "";

  const filtrados = allLeads.filter((l) => {
    // Filtro texto
    const textoOk =
      !q ||
      (l.nombre   || "").toLowerCase().includes(q) ||
      (l.producto || "").toLowerCase().includes(q) ||
      (l.telefono || "").toString().includes(q)    ||
      (l.agente   || l.usuario || "").toLowerCase().includes(q);

    // Filtro por período rápido o rango
    let fechaOk = true;
    const fechaLead = parseFechaParaFiltro(l.fecha);

    if (activeQuickFilter === "hoy") {
      const hoy = new Date(); hoy.setHours(0,0,0,0);
      const fin = new Date(); fin.setHours(23,59,59,999);
      fechaOk = fechaLead ? fechaLead >= hoy && fechaLead <= fin : false;

    } else if (activeQuickFilter === "semana") {
      const hoy  = new Date();
      const lunes = new Date(hoy);
      lunes.setDate(hoy.getDate() - ((hoy.getDay() + 6) % 7));
      lunes.setHours(0,0,0,0);
      const domingo = new Date(lunes);
      domingo.setDate(lunes.getDate() + 6);
      domingo.setHours(23,59,59,999);
      fechaOk = fechaLead ? fechaLead >= lunes && fechaLead <= domingo : false;

    } else if (activeQuickFilter === "mes") {
      const hoy    = new Date();
      const inicio = new Date(hoy.getFullYear(), hoy.getMonth(), 1, 0,0,0,0);
      const fin    = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0, 23,59,59,999);
      fechaOk = fechaLead ? fechaLead >= inicio && fechaLead <= fin : false;

    } else if (activeQuickFilter === "rango" && (desde || hasta)) {
      if (desde && fechaLead) fechaOk = fechaOk && fechaLead >= new Date(desde + "T00:00:00");
      if (hasta && fechaLead) fechaOk = fechaOk && fechaLead <= new Date(hasta + "T23:59:59");
      if (!fechaLead) fechaOk = false;
    }

    return textoOk && fechaOk;
  });

  currentPage = 1;
  renderTable(filtrados, document.getElementById("tabla-registros"));
}

// Parsear fecha del lead para comparación
function parseFechaParaFiltro(valor) {
  if (!valor) return null;
  const d = new Date(valor);
  if (!isNaN(d.getTime())) return d;
  // Intento manual: "04/08/2026 2:12 pm"
  const m = String(valor).match(/(\d{2})\/(\d{2})\/(\d{4})\s+(\d+):(\d{2})\s*(am|pm)/i);
  if (m) {
    let h = parseInt(m[4], 10);
    if (m[6].toLowerCase() === "pm" && h !== 12) h += 12;
    if (m[6].toLowerCase() === "am" && h === 12) h = 0;
    return new Date(parseInt(m[3]), parseInt(m[1]) - 1, parseInt(m[2]), h, parseInt(m[5]));
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
  const usuario = sessionStorage.getItem("agenteActivo") || sessionStorage.getItem("usuarioActivo") || "Leads";
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
  const hoy   = new Date();

  return allLeads.filter((l) => {
    const fechaLead = parseFechaParaFiltro(l.fecha);

    if (exportPeriod === "hoy") {
      const ini = new Date(hoy); ini.setHours(0,0,0,0);
      const fin = new Date(hoy); fin.setHours(23,59,59,999);
      return fechaLead ? fechaLead >= ini && fechaLead <= fin : false;
    }
    if (exportPeriod === "semana") {
      const lunes = new Date(hoy);
      lunes.setDate(hoy.getDate() - ((hoy.getDay() + 6) % 7));
      lunes.setHours(0,0,0,0);
      const domingo = new Date(lunes);
      domingo.setDate(lunes.getDate() + 6);
      domingo.setHours(23,59,59,999);
      return fechaLead ? fechaLead >= lunes && fechaLead <= domingo : false;
    }
    if (exportPeriod === "mes") {
      const ini = new Date(hoy.getFullYear(), hoy.getMonth(), 1, 0,0,0,0);
      const fin = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0, 23,59,59,999);
      return fechaLead ? fechaLead >= ini && fechaLead <= fin : false;
    }
    if (exportPeriod === "rango") {
      let ok = true;
      if (desde && fechaLead) ok = ok && fechaLead >= new Date(desde + "T00:00:00");
      if (hasta && fechaLead) ok = ok && fechaLead <= new Date(hasta + "T23:59:59");
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

  const rol           = sessionStorage.getItem("rolActivo");
  const mostrarAsesor = rol === "Administrador";
  const usuario       = sessionStorage.getItem("agenteActivo") || sessionStorage.getItem("usuarioActivo") || "";
  const filename      = (document.getElementById("export-filename").value.trim() || "Mis_Leads") + ".xlsx";

  // Construir filas
  const headers = ["Fecha", "Nombre", "Teléfono", "Edad", "Producto", ...(mostrarAsesor ? ["Asesor"] : []), "Comentarios"];

  const filas = datos.map(d => {
    const row = {
      "Fecha":       formatFecha(d.fecha),
      "Nombre":      d.nombre || "",
      "Teléfono":    String(d.telefono ?? d["teléfono"] ?? ""),
      "Edad":        d.edad ?? "",
      "Producto":    d.producto || "",
      "Comentarios": d.comentarios || "",
    };
    if (mostrarAsesor) row["Asesor"] = d.agente || d.usuario || "";
    // Reordenar para que Asesor quede antes de Comentarios
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
    ...(mostrarAsesor ? [{ wch: 16 }] : []), // Asesor
    { wch: 40 }, // Comentarios
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

function renderTable(datos, contenedor) {
  if (datos.length === 0) {
    contenedor.innerHTML = `
      <div class="empty-state">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/></svg>
        <p>No hay registros que mostrar.</p>
      </div>`;
    return;
  }

  const rol           = sessionStorage.getItem("rolActivo");
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
          ${mostrarAsesor ? "<th>Asesor</th>" : ""}
          <th>Comentarios</th>
          <th style="width:40px"></th>
        </tr>
      </thead>
      <tbody>`;

  pagSlice.forEach((d) => {
    const badgeClass = getBadgeClass(d.producto);
    const globalIdx  = allLeads.indexOf(d);
    html += `
      <tr class="row-clickable" onclick="abrirEditModal(${globalIdx})" title="Clic para editar este lead">
        <td style="white-space:nowrap; color:var(--slate-500); font-size:0.8rem">${formatFecha(d.fecha)}</td>
        <td style="font-weight:600">${d.nombre || d["nombre"] || "—"}</td>
        <td>${String(d.telefono ?? d["teléfono"] ?? "").trim() || "—"}</td>
        <td style="text-align:center">${d.edad ?? d["edad"] ?? "—"}</td>
        <td><span class="badge-product ${badgeClass}">${d.producto || "—"}</span></td>
        ${mostrarAsesor ? `<td style="color:var(--slate-500); font-size:0.82rem">${d.agente || d.usuario || "—"}</td>` : ""}
        <td style="color:var(--slate-500); font-size:0.82rem; max-width:180px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap" title="${d.comentarios || ""}">${d.comentarios || "—"}</td>
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
    { id: "edit-producto", errId: "edit-err-producto", msg: "Selecciona un producto",          check: (v) => v !== "" },
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
  const usuario = sessionStorage.getItem("usuarioActivo") || "asesor";
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

  const usuario = sessionStorage.getItem("usuarioActivo") || "asesor";
  const link    = document.createElement("a");
  link.download = `QR_Encuesta_${usuario}.png`;
  link.href     = canvas.toDataURL("image/png");
  link.click();
}
