const formularioRegistro = document.getElementById('formulario-registro');
const mensajeAuth = document.getElementById('mensaje-auth');

if (formularioRegistro) {
    formularioRegistro.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const nombre = document.getElementById('nombre').value;
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;

        mensajeAuth.style.color = 'black';
        mensajeAuth.textContent = 'Registrando usuario...';

        const { data, error } = await window.supabaseClient.auth.signUp({
            email: email,
            password: password,
            options: {
                data: {
                    nombre_completo: nombre
                }
            }
        });

        if (error) {
            console.error("Error en registro:", error);
            mensajeAuth.style.color = 'red';
            if (error.message.includes('already registered')) {
                mensajeAuth.textContent = 'Este correo ya está registrado.';
            } else {
                mensajeAuth.textContent = `Error: ${error.message}`;
            }
        } else {
            mensajeAuth.style.color = 'green';
            mensajeAuth.textContent = '¡Registro exitoso! Ya podés iniciar sesión.';
            formularioRegistro.reset();
        }
    });
}

const formularioLogin = document.getElementById('formulario-login');
const mensajeLogin = document.getElementById('mensaje-login');

if (formularioLogin) {
    formularioLogin.addEventListener('submit', async (e) => {
        e.preventDefault();

        const email = document.getElementById('email-login').value;
        const password = document.getElementById('password-login').value;

        mensajeLogin.style.color = 'black';
        mensajeLogin.textContent = 'Iniciando sesión...';

        const { data, error } = await window.supabaseClient.auth.signInWithPassword({
            email: email,
            password: password,
        });

        if (error) {
            console.error("Error en login:", error);
            mensajeLogin.style.color = 'red';
            mensajeLogin.textContent = 'Correo o contraseña incorrectos.';
        } else {
            mensajeLogin.style.color = 'green';
            mensajeLogin.textContent = '¡Ingreso exitoso! Redirigiendo...';
            
            setTimeout(() => {
                window.location.href = 'catalogo.html'; 
            }, 1000);
        }
    });
}