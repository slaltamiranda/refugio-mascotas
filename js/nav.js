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

document.addEventListener('DOMContentLoaded', verificarSesion);