document.addEventListener('DOMContentLoaded', async () => {
    const contenedor = document.getElementById('contenedor-solicitudes');

    const { data: { session } } = await window.supabaseClient.auth.getSession();
    if (!session) {
        window.location.href = 'login.html';
        return;
    }

    const { data: adoptantes, error: errorAdoptante } = await window.supabaseClient
        .from('adoptantes')
        .select('id_adoptante')
        .eq('id_usuario', session.user.id);

    if (errorAdoptante || !adoptantes || adoptantes.length === 0) {
        contenedor.innerHTML = '<p style="text-align: center;">Aún no has iniciado ningún trámite de adopción o tu usuario no está vinculado como adoptante.</p>';
        return;
    }

    // Tomamos el primer adoptante encontrado
    const adoptante = adoptantes[0];

    const { data: solicitudes, error: errorSolicitudes } = await window.supabaseClient
        .from('solicitudes_adopcion')
        .select(`
            estado,
            motivo_evaluacion,
            fecha_solicitud,
            mascotas ( nombre, imagen_url, especie )
        `)
        .eq('id_adoptante', adoptante.id_adoptante);

    if (errorSolicitudes) {
        console.error("Error al cargar solicitudes:", errorSolicitudes);
        contenedor.innerHTML = '<p style="text-align: center; color: red;">Hubo un error al cargar tus solicitudes.</p>';
        return;
    }

    if (!solicitudes || solicitudes.length === 0) {
        contenedor.innerHTML = '<p style="text-align: center;">Aún no tienes solicitudes en curso.</p>';
        return;
    }

    contenedor.innerHTML = '';
    
    solicitudes.forEach(solicitud => {
        let claseEstado = 'badge-pendiente';
        if (solicitud.estado.toLowerCase() === 'aprobada') claseEstado = 'badge-aprobada';
        if (solicitud.estado.toLowerCase() === 'rechazada') claseEstado = 'badge-rechazada';

        const imagenMascota = solicitud.mascotas?.imagen_url ? solicitud.mascotas.imagen_url : '[https://via.placeholder.com/150?text=Sin+Foto](https://via.placeholder.com/150?text=Sin+Foto)';
        const nombreMascota = solicitud.mascotas?.nombre || 'Mascota';
        const fechaFormateada = solicitud.fecha_solicitud ? new Date(solicitud.fecha_solicitud).toLocaleDateString() : '';

        const tarjeta = `
            <div class="tarjeta-solicitud">
                <img src="${imagenMascota}" alt="${nombreMascota}">
                <div class="info-solicitud">
                    <h3>${nombreMascota}</h3>
                    <p>Solicitud enviada el: ${fechaFormateada}</p>
                    ${solicitud.motivo_evaluacion ? `<p style="margin-top: 8px; font-size: 0.9rem; background: #fdf8f5; padding: 8px; border-radius: 6px; border-left: 3px solid #8b5a2b;"><strong>Nota del refugio:</strong> ${solicitud.motivo_evaluacion}</p>` : ''}
                </div>
                <div>
                    <span class="badge-estado ${claseEstado}">
                        ${solicitud.estado}
                    </span>
                </div>
            </div>
        `;
        
        contenedor.innerHTML += tarjeta;
    });
});