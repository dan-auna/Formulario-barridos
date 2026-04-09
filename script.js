const URL_GS = "https://script.google.com/macros/s/AKfycbzg3p6evPFrvfWIAwa6MoGMEtuoyBLU2-wWapn-Ic4lYY9fzuVzrT-zAaOg18XoxvKBaA/exec";

let allLeads = [];

async function login() {
    const userIn = document.getElementById("username").value.trim();
    const passIn = document.getElementById("password").value;
    const btn = document.getElementById("login-btn");

    if(!userIn || !passIn) return;
    
    btn.disabled = true;
    btn.innerText = "Verificando...";

    try {
        const res = await fetch(`${URL_GS}?action=getUsers`);
        const users = await res.json();
        const found = users.find(u => u.usuario == userIn && u.contraseña == passIn);

        if (found) {
            sessionStorage.setItem("user", found.usuario);
            sessionStorage.setItem("agente", found.agente || found.usuario);
            initApp();
        } else {
            document.getElementById("login-error").style.display = "block";
            btn.disabled = false;
            btn.innerText = "Iniciar Sesión";
        }
    } catch (e) {
        alert("Error de conexión");
        btn.disabled = false;
    }
}

function initApp() {
    const user = sessionStorage.getItem("user");
    const agente = sessionStorage.getItem("agente");
    
    document.getElementById("login-section").style.display = "none";
    document.getElementById("form-section").style.display = "block";
    
    document.getElementById("user-avatar").innerText = user.charAt(0).toUpperCase();
    document.getElementById("user-name-chip").innerText = agente;
    document.getElementById("form-title").innerText = `Formulario Barrido — ${user}`;
    document.title = `CRM - ${user}`;
}

function switchTab(tab) {
    document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
    document.querySelectorAll(".tab-panel").forEach(p => p.classList.remove("active"));
    
    event.currentTarget.classList.add("active");
    document.getElementById(`panel-${tab}`).classList.add("active");

    if(tab === 'records') cargarLeads();
    if(tab === 'encuesta') generarQR();
}

// GUARDAR LEAD
document.getElementById("barrido-form").onsubmit = async (e) => {
    e.preventDefault();
    const btn = document.getElementById("submit-btn");
    btn.disabled = true;

    const datos = {
        usuario: sessionStorage.getItem("user"),
        fecha: new Date().toLocaleString("es-PE", {timeZone: "America/Lima"}),
        nombre: document.getElementById("nombre").value,
        telefono: document.getElementById("telefono").value,
        edad: document.getElementById("edad").value,
        producto: document.getElementById("producto").value,
        comentarios: document.getElementById("comentarios").value
    };

    await fetch(URL_GS, {
        method: "POST",
        mode: "no-cors",
        body: JSON.stringify(datos)
    });

    showToast();
    e.target.reset();
    btn.disabled = false;
};

async function cargarLeads() {
    const cont = document.getElementById("tabla-registros");
    cont.innerHTML = "<p style='padding:20px'>Cargando registros...</p>";
    
    const res = await fetch(`${URL_GS}?action=getLeads`);
    const leads = await res.json();
    const myUser = sessionStorage.getItem("user");
    
    // Filtramos para que el asesor solo vea lo suyo
    allLeads = leads.filter(l => l.usuario == myUser);
    renderTable(allLeads);
}

function renderTable(data) {
    const cont = document.getElementById("tabla-registros");
    if(data.length === 0) {
        cont.innerHTML = "<p style='padding:20px'>No tienes registros aún.</p>";
        return;
    }

    let html = `<table><thead><tr>
        <th>Fecha</th><th>Nombre</th><th>Teléfono</th><th>Producto</th><th>Acción</th>
    </tr></thead><tbody>`;

    data.forEach((l, idx) => {
        html += `<tr>
            <td data-label="Fecha">${l.fecha.split(',')[0]}</td>
            <td data-label="Nombre"><strong>${l.nombre}</strong></td>
            <td data-label="Teléfono">${l.telefono}</td>
            <td data-label="Producto">${l.producto}</td>
            <td data-label="Acción"><button onclick="abrirEditar(${idx})">Editar</button></td>
        </tr>`;
    });

    html += `</tbody></table>`;
    cont.innerHTML = html;
}

function abrirEditar(idx) {
    const lead = allLeads[idx];
    document.getElementById("edit-row-index").value = lead._rowIndex;
    document.getElementById("edit-nombre").value = lead.nombre;
    document.getElementById("edit-telefono").value = lead.telefono;
    document.getElementById("edit-edad").value = lead.edad;
    document.getElementById("edit-producto").value = lead.producto;
    document.getElementById("edit-comentarios").value = lead.comentarios;
    document.getElementById("edit-modal").style.display = "flex";
}

async function guardarEdicion() {
    const rowIndex = document.getElementById("edit-row-index").value;
    const datos = {
        action: "updateLead",
        rowIndex: rowIndex,
        nombre: document.getElementById("edit-nombre").value,
        telefono: document.getElementById("edit-telefono").value,
        edad: document.getElementById("edit-edad").value,
        producto: document.getElementById("edit-producto").value,
        comentarios: document.getElementById("edit-comentarios").value
    };

    await fetch(URL_GS, { method: "POST", mode: "no-cors", body: JSON.stringify(datos)});
    cerrarModal();
    cargarLeads();
    showToast();
}

function cerrarModal() { document.getElementById("edit-modal").style.display = "none"; }

function showToast() {
    const t = document.getElementById("toast");
    t.style.display = "block";
    setTimeout(() => t.style.display = "none", 3000);
}

function generarQR() {
    const user = sessionStorage.getItem("user");
    // Cambia esta URL por la URL de tu github pages donde esté encuesta.html
    const urlBase = window.location.href.split('index.html')[0];
    const urlFinal = `${urlBase}encuesta.html?u=${encodeURIComponent(user)}`;
    
    document.getElementById("qr-container").innerHTML = "";
    new QRCode(document.getElementById("qr-container"), {
        text: urlFinal,
        width: 200,
        height: 200,
        colorDark : "#002d72"
    });
    document.getElementById("encuesta-link-text").innerText = urlFinal;
}

function copiarLink() {
    const txt = document.getElementById("encuesta-link-text").innerText;
    navigator.clipboard.writeText(txt);
    alert("Enlace copiado");
}

function logout() { sessionStorage.clear(); location.reload(); }
