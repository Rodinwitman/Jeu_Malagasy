/* =====================================================================
   AUTH.JS

   Deux couches :
   1) Compte classique (nom d'utilisateur / mot de passe) : simulé en
      localStorage tant que le backend n'est pas branché (voir
      backend/controllers/authController.js). Le mot de passe n'est
      JAMAIS stocké en clair même en v1 (hash simple côté client -
      à remplacer obligatoirement par bcrypt côté serveur en prod).
   2) Google / Facebook : intégration RÉELLE des SDK officiels.
      Cliquer sur l'icône Google ouvre bien la fenêtre de connexion
      Google, et Facebook ouvre bien la fenêtre de connexion Facebook.
      => Il faut renseigner TES identifiants d'application ci-dessous
         (GOOGLE_CLIENT_ID / FACEBOOK_APP_ID), obtenus depuis :
           - https://console.cloud.google.com/apis/credentials
           - https://developers.facebook.com/apps/
      Sans backend, le profil renvoyé par Google/Facebook est "lié" au
      compte de jeu directement dans le navigateur (le jeton n'est pas
      vérifié côté serveur). Dès que backend/controllers/authController.js
      sera actif, remplacer linkOAuthAccount() par un appel à
      POST /api/auth/google et POST /api/auth/facebook qui vérifient
      le jeton et créent la liaison côté serveur (sécurisé).
   ===================================================================== */

const AUTH_CONFIG = {
    GOOGLE_CLIENT_ID: 'REMPLACER_PAR_TON_GOOGLE_CLIENT_ID.apps.googleusercontent.com',
    FACEBOOK_APP_ID: 'REMPLACER_PAR_TON_FACEBOOK_APP_ID'
};

const Auth = {
    /* ---------------- Compte classique ---------------- */
    async hashPassword(password) {
        // crypto.subtle (Web Crypto) n'existe que dans un contexte "sécurisé"
        // (HTTPS, ou http://localhost exactement). Si la page est ouverte en
        // file:// ou via une IP/autre hôte, cette API est absente et ferait
        // planter toute la connexion. Repli simple mais fonctionnel dans ce cas.
        if (window.crypto && window.crypto.subtle && window.isSecureContext) {
            const enc = new TextEncoder().encode(password);
            const buf = await crypto.subtle.digest('SHA-256', enc);
            return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
        }
        // Repli : hash simple non-cryptographique (suffisant pour la démo locale,
        // à ne jamais utiliser tel quel en production).
        let h = 0;
        for (let i = 0; i < password.length; i++) {
            h = (Math.imul(31, h) + password.charCodeAt(i)) | 0;
        }
        return 'fallback_' + (h >>> 0).toString(16);
    },

    async register({ username, email, password }) {
        if (!username || !email || !password) {
            throw new Error('Tsy feno ny mombamomba rehetra.');
        }

        // 1) On tente d'abord le vrai backend, mais seulement s'il répond
        // vite (ping rapide et mis en cache) — sinon on ne fait pas
        // attendre l'utilisateur inutilement.
        const backendUp = await Api.ping();
        if (backendUp) {
            const result = await Api.register({ username, email, password }); // erreur métier (ex: nom déjà pris) remontée telle quelle
            Api.setSession(result.token, result.user);
            // IMPORTANT : on calcule aussi un hash LOCAL du mot de passe, même si
            // le backend gère la vraie vérification. Sans ça, si le backend
            // devient injoignable plus tard, la connexion locale de secours
            // comparerait le mot de passe à "undefined" et échouerait toujours,
            // même avec les bons identifiants.
            const passwordHashLocal = await Auth.hashPassword(password);
            let localUser = Storage.findUserByUsername(username);
            if (!localUser) {
                localUser = Storage.createUser({ id: result.user.id, username, email, provider: 'local', passwordHash: passwordHashLocal });
            } else {
                Auth._updateLocalPasswordHash(localUser.id, passwordHashLocal);
            }
            Storage.setSession(localUser.id);
            return localUser;
        }

        // 2) Backend injoignable : repli sur le mode autonome (localStorage uniquement).
        if (Storage.findUserByUsername(username)) {
            throw new Error('Efa misy mpampiasa manana io anarana io.');
        }
        if (Storage.findUserByEmail(email)) {
            throw new Error('Efa misafidy io mailaka io ny kaonty iray.');
        }
        const passwordHash = await Auth.hashPassword(password);
        const user = Storage.createUser({ username, email, passwordHash, provider: 'local' });
        Storage.setSession(user.id);
        return user;
    },

    /** Met à jour le hash local d'un utilisateur existant (voir note dans register/login ci-dessus). */
    _updateLocalPasswordHash(userId, passwordHash) {
        const users = Storage.getUsers();
        const idx = users.findIndex(u => u.id === userId);
        if (idx !== -1 && users[idx].passwordHash !== passwordHash) {
            users[idx] = { ...users[idx], passwordHash };
            Storage.saveUsers(users);
        }
    },

    async login({ username, password }) {
        // 1) Backend réel d'abord, seulement s'il répond vite.
        const backendUp = await Api.ping();
        if (backendUp) {
            try {
                const result = await Api.login({ username, password });
                Api.setSession(result.token, result.user);
                // Même logique que dans register() : on garde un hash local à
                // jour pour que la connexion fonctionne aussi hors-ligne ensuite.
                const passwordHashLocal = await Auth.hashPassword(password);
                let localUser = Storage.findUserByUsername(username);
                if (!localUser) {
                    localUser = Storage.createUser({ id: result.user.id, username, email: result.user.email, provider: 'local', passwordHash: passwordHashLocal });
                } else {
                    Auth._updateLocalPasswordHash(localUser.id, passwordHashLocal);
                }
                Storage.setSession(localUser.id);
                return localUser;
            } catch (e) {
                // Le compte n'existe peut-être que localement (créé pendant
                // que le backend était hors-ligne) : on retente en local
                // avant d'abandonner ; sinon on remonte l'erreur du backend.
                const localUser = Storage.findUserByUsername(username);
                if (!localUser) throw e;
            }
        }

        // 2) Repli local.
        const user = Storage.findUserByUsername(username);
        if (!user) throw new Error('Tsy hita ny mpampiasa.');
        const passwordHash = await Auth.hashPassword(password);
        if (user.provider === 'local' && user.passwordHash !== passwordHash) {
            throw new Error('Diso ny teny miafina.');
        }
        Storage.setSession(user.id);
        return user;
    },

    logout() {
        Storage.clearSession();
        Api.clearSession();
        window.location.href = '../page_connexion/index.html';
    },

    requireAuth() {
        if (!Storage.getCurrentUser()) {
            window.location.href = '../page_connexion/index.html';
        }
    },

    /* ---------------- Liaison de compte OAuth (générique) ---------------- */
    linkOAuthAccount(provider, profile) {
        // profile: { providerId, email, name }
        let user = Storage.findUserByProvider(provider, profile.providerId);
        if (!user && profile.email) user = Storage.findUserByEmail(profile.email);

        if (!user) {
            user = Storage.createUser({
                username: profile.name || profile.email.split('@')[0],
                email: profile.email,
                provider,
                providerId: profile.providerId
            });
        } else if (!user.providerId) {
            // Compte existant (ex: créé en local) qu'on relie maintenant à Google/Facebook
            const users = Storage.getUsers().map(u =>
                u.id === user.id ? { ...u, provider, providerId: profile.providerId } : u
            );
            Storage.saveUsers(users);
        }
        Storage.setSession(user.id);
        Utils.toast(`Mifamatotra tsara ny kaontinao amin'ny ${provider === 'google' ? 'Google' : 'Facebook'}.`, 'success');
        window.location.href = '../dashboard/index.html';
    },

    /* ---------------- Google Identity Services (réel) ---------------- */
    initGoogle() {
        if (!window.google || !google.accounts || !google.accounts.id) return;
        google.accounts.id.initialize({
            client_id: AUTH_CONFIG.GOOGLE_CLIENT_ID,
            callback: Auth.handleGoogleResponse
        });
    },

    async handleGoogleResponse(response) {
        // 1) Vérification réelle côté serveur, seulement si le backend répond vite.
        const backendUp = await Api.ping();
        if (backendUp) {
            try {
                const result = await Api.loginGoogle(response.credential);
                Api.setSession(result.token, result.user);
                let localUser = Storage.findUserByProvider('google', result.user.id) || Storage.findUserByEmail(result.user.email);
                if (!localUser) localUser = Storage.createUser({ id: result.user.id, username: result.user.username, email: result.user.email, provider: 'google', providerId: result.user.id });
                Storage.setSession(localUser.id);
                Utils.toast("Mifamatotra tsara ny kaontinao amin'ny Google.", 'success');
                window.location.href = '../dashboard/index.html';
                return;
            } catch (e) {
                Utils.toast(e.message, 'error');
                return;
            }
        }

        // 2) Backend injoignable : on décode le JWT localement (suffisant en mode démo, pas en production).
        try {
            const payload = JSON.parse(atob(response.credential.split('.')[1]));
            Auth.linkOAuthAccount('google', {
                providerId: payload.sub,
                email: payload.email,
                name: payload.name
            });
        } catch (e) {
            Utils.toast('Tsy nety ny fidirana amin\'ny alalan\'ny Google.', 'error');
        }
    },

    triggerGoogleLogin() {
        if (!window.google || !google.accounts || !google.accounts.id) {
            Utils.toast('Google SDK tsy vonona (jereo ny fifandraisana internet).', 'error');
            return;
        }
        google.accounts.id.prompt();
    },

    /* ---------------- Facebook SDK (réel) ---------------- */
    initFacebook() {
        window.fbAsyncInit = function () {
            FB.init({ appId: AUTH_CONFIG.FACEBOOK_APP_ID, cookie: true, xfbml: false, version: 'v21.0' });
        };
        (function (d, s, id) {
            if (d.getElementById(id)) return;
            const js = d.createElement(s);
            js.id = id;
            js.src = 'https://connect.facebook.net/fr_FR/sdk.js';
            d.body.appendChild(js);
        })(document, 'script', 'facebook-jssdk');
    },

    triggerFacebookLogin() {
        if (!window.FB) {
            Utils.toast('Facebook SDK tsy vonona (jereo ny fifandraisana internet).', 'error');
            return;
        }
        FB.login(async response => {
            if (!response.authResponse) {
                Utils.toast('Nofoanana ny fidirana amin\'ny Facebook.', 'error');
                return;
            }
            const accessToken = response.authResponse.accessToken;

            // 1) Vérification réelle côté serveur, seulement si le backend répond vite.
            const backendUp = await Api.ping();
            if (backendUp) {
                try {
                    const result = await Api.loginFacebook(accessToken);
                    Api.setSession(result.token, result.user);
                    let localUser = Storage.findUserByProvider('facebook', result.user.id) || Storage.findUserByEmail(result.user.email);
                    if (!localUser) localUser = Storage.createUser({ id: result.user.id, username: result.user.username, email: result.user.email, provider: 'facebook', providerId: result.user.id });
                    Storage.setSession(localUser.id);
                    Utils.toast("Mifamatotra tsara ny kaontinao amin'ny Facebook.", 'success');
                    window.location.href = '../dashboard/index.html';
                    return;
                } catch (e) {
                    Utils.toast(e.message, 'error');
                    return;
                }
            }

            // 2) Backend injoignable : repli sur le profil obtenu directement du SDK client.
            FB.api('/me', { fields: 'id,name,email' }, profile => {
                Auth.linkOAuthAccount('facebook', {
                    providerId: profile.id,
                    email: profile.email,
                    name: profile.name
                });
            });
        }, { scope: 'public_profile,email' });
    }
};

window.Auth = Auth;
