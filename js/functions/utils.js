/**
 * Utility functions for the SNOW Quick Ticket extension
 */

const showToast = (message, duration = 3000) => {
    const toast = document.getElementById('toast');
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add('show');
    setTimeout(() => {
        toast.classList.remove('show');
    }, duration);
};

const loadComponent = async (id, path) => {
    const response = await fetch(path);
    const html = await response.text();
    document.getElementById(id).innerHTML = html;
};
