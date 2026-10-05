document.addEventListener('DOMContentLoaded', async () => {
    const idMascota = Number(new URLSearchParams(window.location.search).get('id_mascota'));

    if (!idMascota) {
        window.location.href = 'catalogo.html';
        return;
    }

    const { data: { session } } = await window.supabaseClient.auth.getSession();
    if (!session) {
        window.location.href = 'login.html';
        return;
    }

    const disponible = await cargarResumenMascota(idMascota);

    const formAdopcion = document.getElementById('formulario-adopcion');
    const boton = formAdopcion.querySelector('button[type="submit"]');

    if (!disponible) {
        if (boton) boton.disabled = true;
        return;
    }

    formAdopcion.addEventListener('submit', (e) =>
        manejarEnvioSolicitud(e, idMascota, session.user, boton)
    );
});

function mostrarMensaje(tipo, texto) {
    const mensaje = document.getElementById('mensaje-adopcion');
    mensaje.style.color = tipo === 'error' ? 'red' : tipo === 'ok' ? 'green' : 'black';
    mensaje.textContent = texto;
}

async function cargarResumenMascota(idMascota) {
    const contenedor = document.getElementById('resumen-mascota');
    contenedor.textContent = '';

    const { data: mascota, error } = await window.supabaseClient
        .from('mascotas')
        .select('nombre, estado')
        .eq('id_mascota', idMascota)
        .single();

    if (error || !mascota) {
        const p = document.createElement('p');
        p.style.color = 'red';
        p.textContent = 'No se encontró la mascota seleccionada.';
        contenedor.appendChild(p);
        return false;
    }

    if (mascota.estado !== 'Disponible') {
        const p = document.createElement('p');
        p.style.color = 'red';
        p.textContent = `${mascota.nombre} ya no está disponible para adopción.`;
        contenedor.appendChild(p);
        return false;
    }

    const titulo = document.createElement('h3');
    titulo.append('Estás por adoptar a ');
    const nombre = document.createElement('strong');
    nombre.textContent = mascota.nombre;
    titulo.appendChild(nombre);

    const texto = document.createElement('p');
    texto.textContent = 'Por favor, completá tus datos para que podamos evaluar tu solicitud.';

    contenedor.append(titulo, texto);
    return true;
}

async function manejarEnvioSolicitud(evento, idMascota, usuario, boton) {
    evento.preventDefault();

    const dni = document.getElementById('dni').value.trim();
    const telefono = document.getElementById('telefono').value.trim();
    const direccion = document.getElementById('direccion').value.trim();
    const tipoVivienda = document.getElementById('tipo_vivienda').value;
    const situacionVivienda = document.getElementById('situacion_vivienda').value;
    const otrasMascotas = document.getElementById('otras_mascotas').value.trim();
    const horasSolo = Number(document.getElementById('horas_solo').value);
    const motivacion = document.getElementById('motivacion').value.trim();

    // Validaciones básicas
    if (!/^\d{7,8}$/.test(dni)) {
        mostrarMensaje('error', 'El DNI debe tener 7 u 8 números, sin puntos.');
        return;
    }
    if (!Number.isFinite(horasSolo) || horasSolo < 0 || horasSolo > 24) {
        mostrarMensaje('error', 'Las horas solo deben estar entre 0 y 24.');
        return;
    }
    if (!direccion || !telefono || !motivacion) {
        mostrarMensaje('error', 'Completá todos los campos obligatorios.');
        return;
    }

    if (boton) boton.disabled = true;
    mostrarMensaje('info', 'Enviando solicitud...');

    const nombreCompleto =
        usuario.user_metadata?.nombre_completo || usuario.email || 'Usuario';

    const { data: adoptante, error: errorAdoptante } = await window.supabaseClient
        .from('adoptantes')
        .upsert(
            [{
                id_usuario: usuario.id,
                dni: dni,
                nombre_completo: nombreCompleto,
                telefono: telefono,
                direccion: direccion
            }],
            { onConflict: 'id_usuario' }
        )
        .select('id_adoptante')
        .single();

    if (errorAdoptante) {
        console.error('Error al registrar adoptante:', errorAdoptante);
        if (errorAdoptante.code === '23505') {
            mostrarMensaje('error', 'Ese DNI ya está registrado con otra cuenta.');
        } else {
            mostrarMensaje('error', 'Hubo un error al procesar tus datos.');
        }
        if (boton) boton.disabled = false;
        return;
    }

    const { error: errorSolicitud } = await window.supabaseClient
        .from('solicitudes_adopcion')
        .insert([{
            id_mascota: idMascota,
            id_adoptante: adoptante.id_adoptante,
            tipo_vivienda: tipoVivienda,
            situacion_vivienda: situacionVivienda,
            otras_mascotas: otrasMascotas,
            horas_solo: horasSolo,
            motivacion: motivacion
        }]);

    if (errorSolicitud) {
        console.error('Error al crear solicitud:', errorSolicitud);
        if (errorSolicitud.code === '23505') {
            mostrarMensaje('error', 'Ya enviaste una solicitud para esta mascota.');
        } else if (errorSolicitud.code === '42501') {
            mostrarMensaje('error', 'Esta mascota ya no está disponible para adopción.');
        } else {
            mostrarMensaje('error', 'Hubo un error al enviar la solicitud.');
        }
        if (boton) boton.disabled = false;
        return;
    }

    mostrarMensaje('ok', '¡Solicitud enviada con éxito! Te contactaremos pronto.');
    document.getElementById('formulario-adopcion').reset();

    setTimeout(() => {
        window.location.href = 'solicitudes.html';
    }, 2000);
}