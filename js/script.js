const supabaseUrl = 'https://ebbzvosvssbjezwdzqhs.supabase.co';
const supabaseKey = 'sb_publishable_5IaaGtY4nTCwAK1JZGd-pg_GTe3F_80';
const supabaseClient = supabase.createClient(supabaseUrl, supabaseKey);

// almacena la lista completa de mascotas y los filtros activos.
let mascotasGlobales = [];
let filtros = {
    texto: '',
    apto_gatos: false,
    apto_perros: false,
    apto_ninos: false
};

// funcion para calcular la edad en años o meses usando la fecha de nacimiento aproximada.
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

// filtra las mascotas de supabase por Disponible y las muestra en la pantalla principal
async function cargarCatálogo() {
    const contenedor = document.getElementById('contenedor-mascotas');
    contenedor.innerHTML = '<p style="text-align: center; grid-column: 1 / -1;">Cargando...</p>';

    const { data: mascotas, error } = await supabaseClient
        .from('mascotas')
        .select('*')
        .eq('estado_adopcion', 'Disponible');

    if (error) {
        console.error("Error al traer los datos:", error);
        contenedor.innerHTML = '<p style="text-align: center; grid-column: 1 / -1;">Hubo un problema al cargar el catálogo.</p>';
        return;
    }

    mascotasGlobales = mascotas;
    renderizarMascotas(mascotasGlobales);
    configurarBuscador();
}

// genera la tarjeta de cada mascota y la inserta en el contenedor principal.
function renderizarMascotas(listaMascotas) {
    const contenedor = document.getElementById('contenedor-mascotas');
    contenedor.innerHTML = '';

    if (listaMascotas.length === 0) {
        contenedor.innerHTML = '<p style="text-align: center; grid-column: 1 / -1; font-size: 1.2rem;">No se encontraron mascotas con esos filtros.</p>';
        return;
    }

    listaMascotas.forEach(mascota => {
        let etiquetasHTML = '';
        if (mascota.apto_ninos) etiquetasHTML += '<span class="tag tag-ninos">apto niños</span>';
        if (mascota.apto_perros) etiquetasHTML += '<span class="tag tag-perros">apto perros</span>';
        if (mascota.apto_gatos) etiquetasHTML += '<span class="tag tag-gatos">apto gatos</span>';

        const edadCalculada = calcularEdad(mascota.fecha_nacimiento);
        const imagenUrl = mascota.imagen_url ? mascota.imagen_url : 'https://via.placeholder.com/600x400?text=Sin+Foto';

        const tarjetaHTML = `
            <div class="mascota-card">
                <div class="mascota-img-container">
                    <img src="${imagenUrl}" alt="Foto de ${mascota.nombre}">
                </div>
                <div class="mascota-content">
                    <h3>${mascota.nombre}</h3>
                    <p style="color: var(--secondary-color); font-weight: bold;">${edadCalculada}</p>
                    <p style="font-size: 0.9rem; margin-top: 5px;">${mascota.descripcion || 'Sin descripción.'}</p>
                    <div class="mascota-tags" style="margin-top: 15px;">
                        ${etiquetasHTML}
                    </div>
                </div>
            </div>
        `;
        contenedor.innerHTML += tarjetaHTML;
    });
}

// buscador y sistema de etiquetas
function configurarBuscador() {
    const inputBusqueda = document.getElementById('input-busqueda');
    const botonesFiltro = document.querySelectorAll('.btn-filtro');

    if (inputBusqueda) {
        inputBusqueda.addEventListener('input', (e) => {
            filtros.texto = e.target.value.toLowerCase();
            aplicarFiltros();
        });
    }

    if (botonesFiltro) {
        botonesFiltro.forEach(boton => {
            boton.addEventListener('click', (e) => {
                e.target.classList.toggle('activo'); 
                
                const tipoFiltro = e.target.getAttribute('data-filtro');
                filtros[tipoFiltro] = !filtros[tipoFiltro]; 
                
                aplicarFiltros();
            });
        });
    }
}

// toma la lista global, aplica los filtros y actualiza la pantalla
function aplicarFiltros() {
    const mascotasFiltradas = mascotasGlobales.filter(mascota => {
        const coincideNombre = mascota.nombre.toLowerCase().includes(filtros.texto);
        
        const coincideGatos = !filtros.apto_gatos || mascota.apto_gatos === true;
        const coincidePerros = !filtros.apto_perros || mascota.apto_perros === true;
        const coincideNinos = !filtros.apto_ninos || mascota.apto_ninos === true;

        return coincideNombre && coincideGatos && coincidePerros && coincideNinos;
    });

    renderizarMascotas(mascotasFiltradas);
}

// muestra por pantalla el catalogo
document.addEventListener('DOMContentLoaded', cargarCatálogo);