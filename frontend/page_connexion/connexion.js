/* ===================================================================
   CONNEXION.JS

   IMPORTANT : ce fichier est volontairement écrit de façon défensive.
   Avant, une seule ligne qui échouait tout en haut du fichier (ex: une
   icône introuvable) empêchait TOUT le reste du script de s'exécuter,
   y compris l'attachement des écouteurs de formulaire — ce qui donnait
   l'impression que "cliquer sur Hiditra ne fait rien, la page
   s'actualise juste" (le formulaire faisait alors un envoi HTML natif
   classique, faute d'écouteur JS pour l'intercepter).
   Chaque bloc ci-dessous est maintenant indépendant : si l'un échoue,
   les autres continuent de fonctionner normalement.
   =================================================================== */

function safe(nomBloc, fn) {
    try { fn(); } catch (e) { console.error(`[connexion.js] Bloc "${nomBloc}" en échec :`, e); }
}

/* ---- Si déjà connecté, aller directement au dashboard ---- */
safe('redirection si déjà connecté', () => {
    if (Storage.getCurrentUser()) {
        window.location.href = '../dashboard/index.html';
    }
});

/* ---- Bascule Hiditra / Hisoratra anarana ---- */
safe('bascule login/register', () => {
    const container = document.getElementById('container');
    const registerBtn = document.querySelector('.register-btn');
    const loginBtn = document.querySelector('.login-btn');
    if (registerBtn) registerBtn.addEventListener('click', () => container.classList.add('active'));
    if (loginBtn) loginBtn.addEventListener('click', () => container.classList.remove('active'));
});

/* ---- Validation simple d'un champ ---- */
function setFieldError(fieldEl, hasError) {
    if (fieldEl) fieldEl.classList.toggle('has-error', hasError);
}

/* ---- Formulaire HIDITRA (login) — bloc prioritaire ---- */
safe('formulaire de connexion', () => {
    const form = document.getElementById('form-login');
    if (!form) return;
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = document.getElementById('login-username').value.trim();
        const password = document.getElementById('login-password').value;

        let valid = true;
        if (!username) { setFieldError(document.getElementById('field-login-username'), true); valid = false; }
        if (!password) { setFieldError(document.getElementById('field-login-password'), true); valid = false; }
        if (!valid) return;

        try {
            await Auth.login({ username, password });
            Utils.toast('Tafiditra soa aman-tsara !', 'success');
            setTimeout(() => window.location.href = '../dashboard/index.html', 400);
        } catch (err) {
            Utils.toast(err.message || 'Nisy olana teo am-pidirana.', 'error');
        }
    });
});

/* ---- Formulaire HISORATRA ANARANA (register) — bloc prioritaire ---- */
safe("formulaire d'inscription", () => {
    const form = document.getElementById('form-register');
    if (!form) return;
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = document.getElementById('reg-username').value.trim();
        const email = document.getElementById('reg-email').value.trim();
        const password = document.getElementById('reg-password').value;

        let valid = true;
        if (!username) { setFieldError(document.getElementById('field-reg-username'), true); valid = false; }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setFieldError(document.getElementById('field-reg-email'), true); valid = false; }
        if (password.length < 6) { setFieldError(document.getElementById('field-reg-password'), true); valid = false; }
        if (!valid) return;

        try {
            await Auth.register({ username, email, password });
            Utils.toast('Voary soa aman-tsara ny kaontinao !', 'success');
            setTimeout(() => window.location.href = '../dashboard/index.html', 400);
        } catch (err) {
            Utils.toast(err.message || 'Nisy olana teo am-panoratana ny kaonty.', 'error');
        }
    });
});

/* ---- Mot de passe oublié ---- */
safe('mot de passe oublié', () => {
    const el = document.getElementById('forgot-link');
    if (el) el.addEventListener('click', (e) => {
        e.preventDefault();
        Utils.toast('Handefasana rakitra fanavaozana ny mailakao (tsy mbola mihodina raha tsy misy backend).', 'info');
    });
});

/* ---- Injection des icônes (décoratif — ne doit jamais bloquer le reste) ---- */
safe('icônes des champs', () => {
    const setIcon = (selector, iconName) => {
        const el = document.querySelector(selector);
        if (el) el.innerHTML = Utils.icon(iconName);
    };
    setIcon('#field-login-username .field-icon', 'user');
    setIcon('#field-login-password .field-icon', 'lock');
    setIcon('#field-reg-username .field-icon', 'user');
    setIcon('#field-reg-email .field-icon', 'mail');
    setIcon('#field-reg-password .field-icon', 'lock');
});

/* ---- Libellés des boutons sociaux (décoratif) ---- */
safe('libellés sociaux', () => {
    ['btn-google', 'btn-google-reg'].forEach(id => { const el = document.getElementById(id); if (el) el.textContent = 'G'; });
    ['btn-facebook', 'btn-facebook-reg'].forEach(id => { const el = document.getElementById(id); if (el) el.textContent = 'f'; });
    ['btn-twitter', 'btn-twitter-reg'].forEach(id => { const el = document.getElementById(id); if (el) el.textContent = 'X'; });
});

/* ---- Google (SDK réel) ---- */
safe('connexion Google', () => {
    Auth.initGoogle();
    const b1 = document.getElementById('btn-google');
    const b2 = document.getElementById('btn-google-reg');
    if (b1) b1.addEventListener('click', Auth.triggerGoogleLogin);
    if (b2) b2.addEventListener('click', Auth.triggerGoogleLogin);
});

/* ---- Facebook (SDK réel) ---- */
safe('connexion Facebook', () => {
    Auth.initFacebook();
    const b1 = document.getElementById('btn-facebook');
    const b2 = document.getElementById('btn-facebook-reg');
    if (b1) b1.addEventListener('click', Auth.triggerFacebookLogin);
    if (b2) b2.addEventListener('click', Auth.triggerFacebookLogin);
});

/* ---- Twitter/X : non demandé comme intégration réelle prioritaire ---- */
safe('bouton Twitter/X', () => {
    ['btn-twitter', 'btn-twitter-reg'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.addEventListener('click', () => {
            Utils.toast('Ho avy tsy ho ela ny fidirana amin\'ny Twitter/X.', 'info');
        });
    });
});
