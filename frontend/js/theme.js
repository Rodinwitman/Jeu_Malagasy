/* ===================================================================
   THEME.JS — mode clair / sombre, persistant via localStorage,
   appliqué à l'ensemble du site (voir data-theme sur <html>).
   =================================================================== */

const Theme = {
    init() {
        const saved = Storage.getSettings().theme || 'light';
        Theme.apply(saved);
    },
    apply(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        Storage.saveSettings({ theme });
        Theme.updateToggleIcon(theme);
    },
    toggle() {
        const current = document.documentElement.getAttribute('data-theme') || 'light';
        Theme.apply(current === 'light' ? 'dark' : 'light');
    },
    updateToggleIcon(theme) {
        document.querySelectorAll('[data-theme-toggle]').forEach(btn => {
            btn.innerHTML = theme === 'light' ? Utils.icon('moon') : Utils.icon('sun');
            btn.setAttribute('aria-label', theme === 'light' ? 'Alefaso ny mode maizina' : 'Alefaso ny mode mazava');
        });
    },
    bindToggleButtons() {
        document.querySelectorAll('[data-theme-toggle]').forEach(btn => {
            btn.addEventListener('click', Theme.toggle);
        });
    }
};

document.addEventListener('DOMContentLoaded', () => {
    Theme.init();
    Theme.bindToggleButtons();
});

window.Theme = Theme;
