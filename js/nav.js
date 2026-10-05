const supabaseUrl = 'https://ebbzvosvssbjezwdzqhs.supabase.co';
const supabaseKey = 'sb_publishable_5IaaGtY4nTCwAK1JZGd-pg_GTe3F_80';

if (typeof window.supabaseClient === 'undefined') {
    window.supabaseClient = supabase.createClient(supabaseUrl, supabaseKey);
}

async function verificarSesion() {
    const { data: { session } } = await window.supabaseClient.auth.getSession();

    const navVisitante = document.getElementById('nav-visitante');
    const navUsuario = document.getElementById('nav-usuario');
    const navSaludo = document.getElementById('nav-saludo');
    const btnCerrarSesion = document.getElementById('btn-cerrar-sesion');

    if (session) {
        if (navVisitante) navVisitante.style.display = 'none';
        if (navUsuario) navUsuario.style.display = 'flex';

        const nombre = session.user.user_metadata?.nombre_completo || 'Usuario';
        if (navSaludo) navSaludo.textContent = `¡Hola, ${nombre}!`;

        const { data: usuario } = await window.supabaseClient
            .from('usuarios')
            .select('rol')
            .eq('id_usuario', session.user.id)
            .single();

        const lista = document.querySelector('.lista');
                if (usuario?.rol === 'admin' && lista) {
            ['solicitudes.html', 'catalogo.html'].forEach(href => {
                lista.querySelectorAll(`a[href="${href}"]`)
                    .forEach(a => a.parentElement.remove());
            });

            [['admin-mascotas.html', 'Mascotas'],
             ['admin-solicitudes.html', 'Solicitudes']].forEach(([href, texto]) => {
                const li = document.createElement('li');
                const a = document.createElement('a');
                a.href = href;
                a.textContent = texto;
                li.appendChild(a);
                lista.appendChild(li);
            });
        }
    } else {
        if (navVisitante) navVisitante.style.display = 'flex';
        if (navUsuario) navUsuario.style.display = 'none';
    }

    if (btnCerrarSesion) {
        btnCerrarSesion.addEventListener('click', async () => {
            await window.supabaseClient.auth.signOut();
            window.location.reload();
        });
    }
}

async function requerirAdmin() {
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

document.addEventListener('DOMContentLoaded', verificarSesion);