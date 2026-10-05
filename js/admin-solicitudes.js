document.addEventListener('DOMContentLoaded', async () => {
    if (!(await verificarAdmin())) return;

    const filtro = document.getElementById('filtro-estado');
    filtro.addEventListener('change', cargarSolicitudes);
    await cargarSolicitudes();
});

async function verificarAdmin() {
    const { data: { session } } = await window.supabaseClient.auth.getSession();
    if (!session) {
        window.location.href = 'login.html';
        return false;
    }
    const { data: usuario } = await window.supabaseClient
        .from('usuarios')
        .select('rol')
        .eq('id_usuario', session.user.id)
        .single();

    if (!usuario || usuario.rol !== 'admin') {
        window.location.href = 'index.html';
        return false;
    }
    return true;
}

function mostrarMensaje(tipo, texto) {
    const m = document.getElementById('mensaje-admin');
    m.style.color = tipo === 'error' ? 'red' : 'green';
    m.textContent = texto;
}

function el(tag, texto, estilo) {
    const e = document.createElement(tag);
    if (texto !== undefined) e.textContent = texto;
    if (estilo) e.style.cssText = estilo;
    return e;
}

async function cargarSolicitudes() {
    const contenedor = document.getElementById('contenedor-solicitudes-admin');
    const estado = document.getElementById('filtro-estado').value;
    contenedor.textContent = 'Cargando...';

    let consulta = window.supabaseClient
        .from('solicitudes_adopcion')
        .select(`
            id_solicitud, estado, motivo_evaluacion, fecha_solicitud,
            tipo_vivienda, situacion_vivienda, otras_mascotas, horas_solo, motivacion,
            mascotas ( nombre, especie, imagen_url ),
            adoptantes ( nombre_completo, dni, telefono, direccion, email )
        `)
        .order('fecha_solicitud', { ascending: false });

    if (estado) consulta = consulta.eq('estado', estado);

    const { data, error } = await consulta;

    if (error) {
        console.error(error);
        contenedor.textContent = 'Error al cargar las solicitudes.';
        return;
    }
    if (!data || data.length === 0) {
        contenedor.textContent = 'No hay solicitudes con ese estado.';
        return;
    }

    contenedor.textContent = '';
    data.forEach(s => contenedor.appendChild(crearTarjeta(s)));
}

function crearTarjeta(s) {
    const m = s.mascotas || {};
    const a = s.adoptantes || {};
    const fecha = s.fecha_solicitud
        ? new Date(s.fecha_solicitud).toLocaleDateString('es-AR')
        : 'Sin fecha';

    const tarjeta = el('div', undefined,
        'background:#fff;border-radius:12px;padding:20px;box-shadow:0 4px 12px rgba(0,0,0,.06);display:grid;gap:8px;');

    const cab = el('div', undefined, 'display:flex;justify-content:space-between;align-items:center;gap:10px;');
    cab.append(el('h3', `${m.nombre || 'Mascota'} (${m.especie || '-'})`, 'margin:0;'),
               el('strong', s.estado));

    const datos = [
        ['Solicitante', `${a.nombre_completo || '-'} · DNI ${a.dni || '-'}`],
        ['Contacto', `${a.telefono || '-'} · ${a.email || '-'}`],
        ['Dirección', a.direccion || '-'],
        ['Vivienda', `${s.tipo_vivienda || '-'} (${s.situacion_vivienda || '-'})`],
        ['Otras mascotas', s.otras_mascotas || '-'],
        ['Horas solo por día', String(s.horas_solo ?? '-')],
        ['Motivación', s.motivacion || '-'],
        ['Enviada', fecha]
    ];

    tarjeta.appendChild(cab);
    datos.forEach(([k, v]) => {
        const p = el('p', undefined, 'margin:0;');
        p.append(el('strong', k + ': '), document.createTextNode(v));
        tarjeta.appendChild(p);
    });

    if (s.estado !== 'Pendiente') {
        if (s.motivo_evaluacion) {
            const p = el('p', undefined, 'margin:0;');
            p.append(el('strong', 'Nota: '), document.createTextNode(s.motivo_evaluacion));
            tarjeta.appendChild(p);
        }
        return tarjeta;
    }

    const motivo = el('textarea', undefined, 'width:100%;padding:8px;border-radius:8px;border:1px solid #ccc;');
    motivo.rows = 2;
    motivo.placeholder = 'Nota para el adoptante (obligatoria al rechazar)';

    const botones = el('div', undefined, 'display:flex;gap:10px;justify-content:flex-end;');
    const btnAprobar = el('button', 'Aprobar',
        'background:#27ae60;color:#fff;border:none;padding:8px 16px;border-radius:6px;cursor:pointer;font-weight:bold;');
    const btnRechazar = el('button', 'Rechazar',
        'background:#e74c3c;color:#fff;border:none;padding:8px 16px;border-radius:6px;cursor:pointer;font-weight:bold;');

    btnAprobar.addEventListener('click', () =>
        evaluar(s.id_solicitud, true, motivo.value, [btnAprobar, btnRechazar]));
    btnRechazar.addEventListener('click', () =>
        evaluar(s.id_solicitud, false, motivo.value, [btnAprobar, btnRechazar]));

    botones.append(btnAprobar, btnRechazar);
    tarjeta.append(motivo, botones);
    return tarjeta;
}

async function evaluar(idSolicitud, aprobar, motivo, botones) {
    motivo = motivo.trim();

    if (!aprobar && !motivo) {
        mostrarMensaje('error', 'Escribí un motivo para rechazar.');
        return;
    }
    if (aprobar && !confirm('Al aprobar, la mascota pasa a "Adoptado" y se rechazan las demás solicitudes pendientes. ¿Continuar?')) {
        return;
    }

    botones.forEach(b => b.disabled = true);

    const { error } = await window.supabaseClient.rpc('evaluar_solicitud', {
        p_id_solicitud: idSolicitud,
        p_aprobar: aprobar,
        p_motivo: motivo || (aprobar ? 'Solicitud aprobada.' : '')
    });

    if (error) {
        console.error(error);
        mostrarMensaje('error', 'No se pudo evaluar: ' + error.message);
        botones.forEach(b => b.disabled = false);
        return;
    }

    mostrarMensaje('ok', aprobar ? 'Solicitud aprobada.' : 'Solicitud rechazada.');
    await cargarSolicitudes();
}