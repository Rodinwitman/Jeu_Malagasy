/* ===================================================================
   NAVIGATION.JS — sidebar responsive (hamburger sur mobile),
   surlignage du lien actif, bouton de déconnexion.
   =================================================================== */

const Navigation = {
    /**
     * Injecte la sidebar standard dans #sidebar-mount, avec le lien
     * `activeId` surligné. Utilisé par les pages qui ne sont pas le
     * dashboard (classement, défis, avis, paramètres, règles...).
     */
    renderSidebar(activeId) {
        const mount = document.getElementById('sidebar-mount');
        if (!mount) return;
        const links = [
            { id: 'accueil', href: '../dashboard/index.html', icon: 'home', label: "Fitambarana" },
            { id: 'jeux', href: '../dashboard/index.html#jeux', icon: 'game', label: "Jeux" },
            { id: 'regles', href: '../regles/index.html', icon: 'list', label: "Fitsipiky ny lalao" },
            { id: 'avis', href: '../avis/index.html', icon: 'message', label: "Hevitra momba ny lalao" },
            { id: 'classement', href: '../classement/index.html', icon: 'trophy', label: "Laharana" },
            { id: 'defis', href: '../defis/index.html', icon: 'flame', label: "Fanamby isan'andro" },
            { id: 'parametres', href: '../parametres/index.html', icon: 'settings', label: "Fanamboarana" }
        ];
        mount.innerHTML = `
            <aside class="sidebar">
                <div class="sidebar__brand">
                    <span>${Utils.icon('game')}</span>
                    <span>Teny Malagasy</span>
                </div>
                <nav class="sidebar__nav">
                    ${links.map(l => `
                        <a class="sidebar__link ${l.id === activeId ? 'active' : ''}" href="${l.href}">
                            ${Utils.icon(l.icon)} ${l.label}
                        </a>
                    `).join('')}
                </nav>
                <div class="sidebar__footer">
                    <div class="sidebar__user">
                        <span class="sidebar__avatar">${Utils.icon('user')}</span>
                        <span data-user-name>—</span>
                    </div>
                    <button class="sidebar__link" data-logout>${Utils.icon('logout')} Hivoaka</button>
                </div>
            </aside>
            <div class="sidebar-overlay"></div>
        `;
    },

    init() {
        const sidebar = document.querySelector('.sidebar');
        if (!sidebar) return;

        // Hamburger (mobile)
        let hamburger = document.querySelector('.hamburger');
        let overlay = document.querySelector('.sidebar-overlay');
        if (!hamburger) {
            hamburger = document.createElement('button');
            hamburger.className = 'hamburger';
            hamburger.setAttribute('aria-label', 'Sokafy ny lisitra');
            hamburger.innerHTML = Utils.icon('menu');
            document.body.appendChild(hamburger);
        }
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.className = 'sidebar-overlay';
            document.body.appendChild(overlay);
        }

        const closeSidebar = () => { sidebar.classList.remove('open'); overlay.classList.remove('open'); };
        const openSidebar = () => { sidebar.classList.add('open'); overlay.classList.add('open'); };

        hamburger.addEventListener('click', openSidebar);
        overlay.addEventListener('click', closeSidebar);

        // Lien actif = page courante
        const current = window.location.pathname.split('/').filter(Boolean).slice(-2).join('/');
        sidebar.querySelectorAll('.sidebar__link').forEach(link => {
            const href = link.getAttribute('href') || '';
            if (href && current.endsWith(href.replace('../', '').replace('./', ''))) {
                link.classList.add('active');
            }
            link.addEventListener('click', closeSidebar);
        });

        // Déconnexion
        const logoutBtn = document.querySelector('[data-logout]');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => Auth.logout());
        }

        // Nom / avatar utilisateur dans la sidebar
        const user = Storage.getCurrentUser();
        const nameEl = document.querySelector('[data-user-name]');
        if (user && nameEl) nameEl.textContent = user.username;
    }
};

document.addEventListener('DOMContentLoaded', () => {
    Navigation.init();
    Utils.initBackToTop();
});

window.Navigation = Navigation;
