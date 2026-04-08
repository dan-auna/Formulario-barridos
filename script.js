const URL_GOOGLE_SCRIPT = "TU_URL_AQUI"; 

// FUNCIÓN DE LOGIN DINÁMICO
async function login() {
    const userIn = document.getElementById('username').value;
    const passIn = document.getElementById('password').value;

    try {
        const response = await fetch(`${URL_GOOGLE_SCRIPT}?action=getUsers`);
        const usuarios = await response.json();

        // Buscamos si existe el usuario y coincide la contraseña
        const encontrado = usuarios.find(u => u.usuario.toString() === userIn && u.contraseña.toString() === passIn);

        if (encontrado) {
            // Guardamos los datos del usuario para usarlos después
            sessionStorage.setItem('usuarioActivo', encontrado.usuario);
            sessionStorage.setItem('rolActivo', encontrado.rol);
            sessionStorage.setItem('agenteActivo', encontrado.agente);

            mostrarPantallaFormulario(encontrado);
        } else {
            alert("Usuario o contraseña incorrectos");
        }
    } catch (error) {
        alert("Error al conectar con la base de usuarios");
    }
}

function mostrarPantallaFormulario(user) {
    document.getElementById('login-section').style.display = 'none';
    document.getElementById('form-section').style.display = 'block';
    document.getElementById('form-title').innerText = `Formulario Barrido - ${user.agente}`;
}

// GUARDAR REGISTRO
document.getElementById('barrido-form').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const datos = {
        usuario: sessionStorage.getItem('usuarioActivo'), // Se guarda el ID de usuario
        fecha: new Date().toLocaleString(),
        nombre: document.getElementById('nombre').value,
        telefono: document.getElementById('telefono').value,
        edad: document.getElementById('edad').value,
        producto: document.getElementById('producto').value,
        comentarios: document.getElementById('comentarios').value
    };

    fetch(URL_GOOGLE_SCRIPT, {
        method: 'POST',
        mode: 'no-cors',
        body: JSON.stringify(datos)
    }).then(() => {
        alert("¡Registro guardado!");
        document.getElementById('barrido-form').reset();
    });
});

// VER REGISTROS SEGÚN ROL
async function verRegistros() {
    const contenedor = document.getElementById('tabla-registros');
    const rol = sessionStorage.getItem('rolActivo');
    const miUser = sessionStorage.getItem('usuarioActivo');
    
    contenedor.innerHTML = "Cargando...";

    try {
        const response = await fetch(`${URL_GOOGLE_SCRIPT}?action=getLeads`);
        const todosLosLeads = await response.json();

        // FILTRO INTELIGENTE
        let leadsFiltrados;
        if (rol === "Administrador") {
            leadsFiltrados = todosLosLeads; // Ve todo
        } else {
            leadsFiltrados = todosLosLeads.filter(l => l.usuario === miUser); // Solo lo suyo
        }

        renderTable(leadsFiltrados, contenedor);
    } catch (e) {
        contenedor.innerHTML = "Error cargando leads.";
    }
}

function renderTable(datos, contenedor) {
    if (datos.length === 0) { contenedor.innerHTML = "No hay registros."; return; }
    
    let html = `<table border="1" style="width:100%; border-collapse: collapse; margin-top:10px;">
                <tr><th>Fecha</th><th>Nombre</th><th>Producto</th><th>Por</th></tr>`;
    
    datos.forEach(d => {
        html += `<tr>
            <td>${d.fecha || ''}</td>
            <td>${d.nombre || ''}</td>
            <td>${d.producto || ''}</td>
            <td>${d.usuario || ''}</td>
        </tr>`;
    });
    html += `</table>`;
    contenedor.innerHTML = html;
}
