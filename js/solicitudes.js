document.addEventListener('DOMContentLoaded', async () => {
    const contenedor = document.getElementById('contenedor-solicitudes');
    if (!contenedor) return;

    const { data: { session } } = await window.supabaseClient.auth.getSession();
    if (!session) {
        window.location.href = 'login.html';
        return;
    }

    const { data: adoptantes, error: errorAdoptante } = await window.supabaseClient
        .from('adoptantes')
        .select('id_adoptante')
        .eq('id_usuario', session.user.id);

    if (errorAdoptante) {
        console.error("❌ Error al buscar adoptante:", errorAdoptante);
        contenedor.innerHTML = '<p style="text-align: center; color: red;">Error al consultar tu perfil de adoptante.</p>';
        return;
    }

    if (!adoptantes || adoptantes.length === 0) {
        contenedor.innerHTML = '<p style="text-align: center;">No se encontró un perfil de adoptante vinculado a tu usuario.</p>';
        return;
    }

    const idsAdoptantes = adoptantes.map(a => a.id_adoptante);

    const { data: solicitudes, error: errorSolicitudes } = await window.supabaseClient
        .from('solicitudes_adopcion')
        .select(`
            id_solicitud,
            estado,
            motivo_evaluacion,
            fecha_solicitud,
            mascotas (
                nombre,
                imagen_url,
                especie
            )
        `)
        .in('id_adoptante', idsAdoptantes);

    if (errorSolicitudes) {
        console.error("❌ Error al cargar solicitudes:", errorSolicitudes);
        contenedor.innerHTML = '<p style="text-align: center; color: red;">Hubo un error al cargar tus solicitudes.</p>';
        return;
    }

    if (!solicitudes || solicitudes.length === 0) {
        contenedor.innerHTML = '<p style="text-align: center;">Aún no tienes solicitudes en curso.</p>';
        return;
    }

    contenedor.innerHTML = '';
    solicitudes.forEach(solicitud => {
        const estadoTexto = solicitud.estado || 'pendiente';
        const estadoLower = estadoTexto.toLowerCase();

        let claseEstado = 'badge-pendiente';
        if (estadoLower === 'aprobada') claseEstado = 'badge-aprobada';
        if (estadoLower === 'rechazada') claseEstado = 'badge-rechazada';

        const mascota = solicitud.mascotas || {};
        const imagenMascota = mascota.imagen_url || 'https://via.placeholder.com/150?text=Sin+Foto';
        const nombreMascota = mascota.nombre || 'Mascota';
        const fechaFormateada = solicitud.fecha_solicitud 
            ? new Date(solicitud.fecha_solicitud).toLocaleDateString() 
            : 'Sin fecha';

        const tarjeta = `
            <div class="tarjeta-solicitud">
                <img src="${imagenMascota}" alt="${nombreMascota}">
                <div class="info-solicitud">
                    <h3>${nombreMascota}</h3>
                    <p>Solicitud enviada el: ${fechaFormateada}</p>
                    ${solicitud.motivo_evaluacion ? `
                        <p style="margin-top: 8px; font-size: 0.9rem; background: #fdf8f5; padding: 8px; border-radius: 6px; border-left: 3px solid #8b5a2b;">
                            <strong>Nota del refugio:</strong> ${solicitud.motivo_evaluacion}
                        </p>
                    ` : ''}
                </div>
                <div>
                    <span class="${claseEstado}">
                        ${estadoTexto.toUpperCase()}
                    </span>
                </div>
            </div>
        `;
        contenedor.innerHTML += tarjeta;
    });
});