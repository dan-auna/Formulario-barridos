const userCorrecto = "Eduardo";
const passCorrecto = "123456";
// PEGA AQUÍ TU URL DE GOOGLE APPS SCRIPT
const URL_GOOGLE_SCRIPT = "https://script.google.com/macros/s/AKfycbzg3p6evPFrvfWIAwa6MoGMEtuoyBLU2-wWapn-Ic4lYY9fzuVzrT-zAaOg18XoxvKBaA/exec"; 

function login() {
    const user = document.getElementById('username').value;
    const pass = document.getElementById('password').value;

    if(user === userCorrecto && pass === passCorrecto) {
        document.getElementById('login-section').style.display = 'none';
        document.getElementById('form-section').style.display = 'block';
        document.getElementById('form-title').innerText = `Formulario Barrido - ${user}`;
    } else {
        alert("Usuario o contraseña incorrectos");
    }
}

document.getElementById('barrido-form').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const datos = {
        usuario: userCorrecto,
        fecha: new Date().toLocaleString(),
        nombre: document.getElementById('nombre').value,
        telefono: document.getElementById('telefono').value,
        edad: document.getElementById('edad').value,
        producto: document.getElementById('producto').value,
        comentarios: document.getElementById('comentarios').value
    };

    // Esto envía los datos a Google Sheets
    fetch(URL_GOOGLE_SCRIPT, {
        method: 'POST',
        mode: 'no-cors', // Importante para Google Scripts
        cache: 'no-cache',
        body: JSON.stringify(datos)
    }).then(() => {
        alert("¡Registro guardado con éxito en Google Sheets!");
        document.getElementById('barrido-form').reset();
    }).catch(err => alert("Error: " + err));
});
