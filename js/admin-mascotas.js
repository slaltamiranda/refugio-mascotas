document.addEventListener('DOMContentLoaded', async () => {
    if (!(await requerirAdmin())) return;
    await cargarMascotasAdmin();

    const form = document.getElementById('form-mascota');
    const btnCancelar = document.getElementById('btn-cancelar-edicion');

    form.addEventListener('submit', guardarMascota);
    btnCancelar.addEventListener('click', limpiarFormulario);
});

function calcularEdad(fechaNacimientoStr) {
    if (!fechaNacimientoStr) return "Edad desconocida";
    const hoy = new Date();
    const nacimiento = new Date(fechaNacimientoStr);
    let años = hoy.getFullYear() - nacimiento.getFullYear();
    let meses = hoy.getMonth() - nacimiento.getMonth();

    if (meses < 0 || (meses === 0 && hoy.getDate() < nacimiento.getDate())) {
        años--;
        meses += 12;
    }

    if (años >= 1) {
        return años === 1 ? "1 año" : `${años} años`;
    } else {
        return meses <= 1 ? "1 mes" : `${meses} meses`;
    }
}

async function cargarMascotasAdmin() {
    const contenedor = document.getElementById('contenedor-admin-mascotas');

    const { data: mascotas, error } = await window.supabaseClient
        .from('mascotas')
        .select('*')
        .order('id_mascota', { ascending: false });

    if (error) {
        console.error("Error al cargar mascotas:", error);
        contenedor.innerHTML = '<p style="text-align: center; color: red;">Error al obtener el catálogo.</p>';
        return;
    }

    if (!mascotas || mascotas.length === 0) {
        contenedor.innerHTML = '<p style="text-align: center; color: #666;">No hay mascotas registradas todavía.</p>';
        return;
    }

    contenedor.innerHTML = '';

    mascotas.forEach(mascota => {
        let colorBadge = '#27ae60';
        if (mascota.estado === 'En Proceso') colorBadge = '#f39c12';
        if (mascota.estado === 'Adoptado') colorBadge = '#7f8c8d';

        let etiquetasHTML = '';
        if (mascota.apto_ninos) etiquetasHTML += '<span style="background: #e8d5ff; color: #6b21a8; padding: 3px 8px; border-radius: 12px; font-size: 0.75rem; font-weight: bold; margin-right: 4px;">Apto Niños</span>';
        if (mascota.apto_perros) etiquetasHTML += '<span style="background: #a7f3d0; color: #065f46; padding: 3px 8px; border-radius: 12px; font-size: 0.75rem; font-weight: bold; margin-right: 4px;">Apto Perros</span>';
        if (mascota.apto_gatos) etiquetasHTML += '<span style="background: #fef08a; color: #854d0e; padding: 3px 8px; border-radius: 12px; font-size: 0.75rem; font-weight: bold; margin-right: 4px;">Apto Gatos</span>';

        const edadCalculada = calcularEdad(mascota.fecha_nacimiento);

        const tarjeta = document.createElement('div');
        tarjeta.style.cssText = `
            background: #ffffff;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 4px 10px rgba(0,0,0,0.06);
            display: flex;
            flex-direction: column;
            justify-content: space-between;
        `;

        tarjeta.innerHTML = `
            <img src="${mascota.imagen_url || 'https://via.placeholder.com/300'}" alt="${mascota.nombre}" style="width: 100%; height: 180px; object-fit: cover;">
            <div style="padding: 15px; flex-grow: 1;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                    <h3 style="margin: 0; color: #4a3b32;">${mascota.nombre}</h3>
                    <span style="background: ${colorBadge}; color: white; padding: 3px 8px; border-radius: 12px; font-size: 0.75rem; font-weight: bold;">
                        ${mascota.estado || 'Disponible'}
                    </span>
                </div>
                <p style="margin: 2px 0; font-size: 0.85rem; color: #666;"><strong>Especie:</strong> ${mascota.especie} | <strong>Edad:</strong> ${edadCalculada}</p>
                <p style="margin: 8px 0; font-size: 0.85rem; color: #444; line-height: 1.3;">${mascota.descripcion || 'Sin descripción.'}</p>
                <div style="margin-top: 10px; display: flex; flex-wrap: wrap; gap: 4px;">
                    ${etiquetasHTML}
                </div>
            </div>
            <div style="padding: 15px; border-top: 1px solid #eee; display: flex; gap: 8px; justify-content: flex-end;">
                <button onclick='prepararEdicion(${JSON.stringify(mascota)})' style="background-color: #f39c12; color: white; border: none; padding: 6px 12px; border-radius: 6px; cursor: pointer; font-size: 0.85rem; font-weight: bold;">
                    Editar
                </button>
                <button onclick="eliminarMascota(${mascota.id_mascota})" style="background-color: #e74c3c; color: white; border: none; padding: 6px 12px; border-radius: 6px; cursor: pointer; font-size: 0.85rem; font-weight: bold;">
                    Eliminar
                </button>
            </div>
        `;

        contenedor.appendChild(tarjeta);
    });
}

async function guardarMascota(e) {
    e.preventDefault();

    const idMascota = document.getElementById('mascota-id').value;
    const datosMascota = {
        nombre: document.getElementById('nombre').value,
        especie: document.getElementById('especie').value,
        fecha_nacimiento: document.getElementById('fecha_nacimiento').value,
        imagen_url: document.getElementById('imagen_url').value,
        descripcion: document.getElementById('descripcion').value,
        estado: document.getElementById('estado').value,
        apto_ninos: document.getElementById('apto_ninos').checked,
        apto_perros: document.getElementById('apto_perros').checked,
        apto_gatos: document.getElementById('apto_gatos').checked
    };

    let error = null;

    if (idMascota) {
        const res = await window.supabaseClient
            .from('mascotas')
            .update(datosMascota)
            .eq('id_mascota', idMascota);
        error = res.error;
    } else {
        const res = await window.supabaseClient
            .from('mascotas')
            .insert([datosMascota]);
        error = res.error;
    }

    if (error) {
        alert("Error al guardar la mascota: " + error.message);
        return;
    }

    alert(idMascota ? "Mascota actualizada correctamente." : "Mascota agregada al catálogo.");
    limpiarFormulario();
    await cargarMascotasAdmin();
}

function prepararEdicion(mascota) {
    document.getElementById('mascota-id').value = mascota.id_mascota;
    document.getElementById('nombre').value = mascota.nombre || '';
    document.getElementById('especie').value = mascota.especie || '';
    
    if (mascota.fecha_nacimiento) {
        document.getElementById('fecha_nacimiento').value = mascota.fecha_nacimiento.split('T')[0];
    } else {
        document.getElementById('fecha_nacimiento').value = '';
    }

    document.getElementById('imagen_url').value = mascota.imagen_url || '';
    document.getElementById('descripcion').value = mascota.descripcion || '';
    document.getElementById('estado').value = mascota.estado || 'Disponible';

    document.getElementById('apto_ninos').checked = mascota.apto_ninos || false;
    document.getElementById('apto_perros').checked = mascota.apto_perros || false;
    document.getElementById('apto_gatos').checked = mascota.apto_gatos || false;

    document.getElementById('titulo-form-mascota').innerText = `Editando a ${mascota.nombre}`;
    document.getElementById('btn-guardar-mascota').innerText = "Actualizar Mascota";
    document.getElementById('btn-cancelar-edicion').style.display = 'block';

    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function limpiarFormulario() {
    document.getElementById('form-mascota').reset();
    document.getElementById('mascota-id').value = '';

    document.getElementById('apto_ninos').checked = false;
    document.getElementById('apto_perros').checked = false;
    document.getElementById('apto_gatos').checked = false;

    document.getElementById('titulo-form-mascota').innerText = "Agregar Nueva Mascota";
    document.getElementById('btn-guardar-mascota').innerText = "Guardar Mascota";
    document.getElementById('btn-cancelar-edicion').style.display = 'none';
}

async function eliminarMascota(idMascota) {
    if (!confirm("¿Estás seguro de que querés eliminar esta mascota del catálogo?")) return;

    const { error } = await window.supabaseClient
        .from('mascotas')
        .delete()
        .eq('id_mascota', idMascota);

    if (error) {
        alert("No se pudo eliminar la mascota (puede tener solicitudes vinculadas): " + error.message);
        return;
    }

    alert("Mascota eliminada con éxito.");
    await cargarMascotasAdmin();
}