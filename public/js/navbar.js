// public/js/navbar.js

/**
 * Actualiza la barra de navegación según el estado de sesión del usuario.
 * - Si el usuario está logueado: oculta "Registro" e "Iniciar sesión", muestra "Mi Perfil" y "Cerrar sesión".
 * - Si además es administrador, muestra el enlace a "Administración".
 * - Si no está logueado: muestra "Registro" e "Iniciar sesión", oculta el resto.
 */
function actualizarNavbar() {
    const token = localStorage.getItem('token');
    const cliente = JSON.parse(localStorage.getItem('clienteLogueado') || 'null');
    
    const registroLink = document.querySelector('a[href="/registro.html"]');
    const loginLink = document.querySelector('a[href="/login.html"]');
    const perfilLink = document.querySelector('a[href="/perfil.html"]');
    const adminLink = document.querySelector('a[href="/admin.html"]');
    const logoutBtn = document.getElementById('logoutBtn');
    
    if (token && cliente) {
        // Usuario logueado: ocultar registro y login
        if (registroLink) registroLink.style.display = 'none';
        if (loginLink) loginLink.style.display = 'none';
        // Mostrar perfil y logout
        if (perfilLink) perfilLink.style.display = 'inline-block';
        if (logoutBtn) logoutBtn.style.display = 'inline-block';
        
        // Si es administrador, mostrar el enlace de admin
        if (cliente.isAdmin && adminLink) {
            adminLink.style.display = 'inline-block';
        } else if (adminLink) {
            adminLink.style.display = 'none';
        }
    } else {
        // Usuario no logueado: mostrar registro y login, ocultar perfil, logout y admin
        if (registroLink) registroLink.style.display = 'inline-block';
        if (loginLink) loginLink.style.display = 'inline-block';
        if (perfilLink) perfilLink.style.display = 'none';
        if (logoutBtn) logoutBtn.style.display = 'none';
        if (adminLink) adminLink.style.display = 'none';
    }
}

/**
 * Cierra la sesión del usuario eliminando los datos de localStorage
 * y redirigiendo a la página de inicio.
 */
function cerrarSesion() {
    localStorage.removeItem('token');
    localStorage.removeItem('clienteLogueado');
    window.location.href = '/';
}

// Al cargar el DOM, se actualiza la barra de navegación y se asigna el evento al botón de logout
document.addEventListener('DOMContentLoaded', () => {
    actualizarNavbar();
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', cerrarSesion);
    }
});