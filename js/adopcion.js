document.addEventListener('DOMContentLoaded', async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const idMascota = urlParams.get('id_mascota');

    if (!idMascota) {
        alert("No se seleccionó ninguna mascota.");
        window.location.href = 'catalogo.html';
        return;
    }

    const { data: { session } } = await window.supabaseClient.auth.getSession();
    if (!session) {
        window.location.href = 'login.html';
        return;
    }

    cargarResumenMascota(idMascota);

    const formAdopcion = document.getElementById('formulario-adopcion');
    formAdopcion.addEventListener('submit', (e) => manejarEnvioSolicitud(e, idMascota, session.user));
});

async function cargarResumenMascota(idMascota) {
    const contenedorResumen = document.getElementById('resumen-mascota');
    
    const { data: mascota, error } = await window.supabaseClient
        .from('mascotas')
        .select('nombre, especie')
        .eq('id_mascota', idMascota)
        .single();

    if (error || !mascota) {
        contenedorResumen.innerHTML = '<p style="color: red;">Error al cargar los datos de la mascota.</p>';
        return;
    }

    contenedorResumen.innerHTML = `
        <h3>Estás por adoptar a <strong>${mascota.nombre}</strong></h3>
        <p>Por favor, completá tus datos para que podamos evaluar tu solicitud.</p>
    `;
}

async function manejarEnvioSolicitud(evento, idMascota, usuario) {
    evento.preventDefault();
    const mensaje = document.getElementById('mensaje-adopcion');
    const dni = document.getElementById('dni').value;
    const telefono = document.getElementById('telefono').value;
    const direccion = document.getElementById('direccion').value;
    const tipoVivienda = document.getElementById('tipo_vivienda').value;
    const situacionVivienda = document.getElementById('situacion_vivienda').value;
    const otrasMascotas = document.getElementById('otras_mascotas').value;
    const horasSolo = document.getElementById('horas_solo').value;
    const motivacion = document.getElementById('motivacion').value;

    mensaje.style.color = 'black';
    mensaje.textContent = 'Enviando solicitud...';

    const { data: adoptante, error: errorAdoptante } = await window.supabaseClient
        .from('adoptantes')
        .upsert([{
            id_usuario: usuario.id,
            dni: dni,
            nombre_completo: usuario.user_metadata?.nombre_completo || 'Usuario',
            telefono: telefono,
            direccion: direccion
        }], { onConflict: 'dni' })
        .select('id_adoptante')
        .single();

    if (errorAdoptante) {
        console.error("Error al registrar adoptante:", errorAdoptante);
        mensaje.style.color = 'red';
        mensaje.textContent = 'Hubo un error al procesar tus datos.';
        return;
    }

    const { error: errorSolicitud } = await window.supabaseClient
        .from('solicitudes_adopcion')
        .insert([{
            id_mascota: idMascota,
            id_adoptante: adoptante.id_adoptante,
            estado: 'Pendiente',
            tipo_vivienda: tipoVivienda,
            situacion_vivienda: situacionVivienda,
            otras_mascotas: otrasMascotas,
            horas_solo: horasSolo,
            motivacion: motivacion
        }]);

    if (errorSolicitud) {
        console.error("Error al crear solicitud:", errorSolicitud);
        mensaje.style.color = 'red';
        mensaje.textContent = 'Hubo un error al enviar la solicitud.';
    } else {
        mensaje.style.color = 'green';
        mensaje.textContent = '¡Solicitud enviada con éxito! Te contactaremos pronto.';
        document.getElementById('formulario-adopcion').reset();
        
        setTimeout(() => {
            window.location.href = 'solicitudes.html';
        }, 2000);
    }
}