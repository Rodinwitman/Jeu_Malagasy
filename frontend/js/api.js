/* =====================================================================
   API.JS — client HTTP vers le backend Node.js/Express.

   Fonctionnement : chaque fonction tente d'appeler le vrai backend.
   Si le backend n'est pas lancé (aucun serveur sur API_BASE), l'appel
   échoue proprement et le code appelant (Auth, Storage) bascule alors
   sur le mode autonome localStorage — donc le site continue de
   fonctionner même sans backend, mais utilise le vrai serveur dès
   qu'il est disponible.
   ===================================================================== */

const Api = {
    base: localStorage.getItem('tm_api_base') || 'http://localhost:4000/api',

    token() { return localStorage.getItem('tm_api_token'); },
    setSession(token, user) {
        localStorage.setItem('tm_api_token', token);
        localStorage.setItem('tm_api_user', JSON.stringify(user));
    },
    clearSession() {
        localStorage.removeItem('tm_api_token');
        localStorage.removeItem('tm_api_user');
    },
    getApiUser() {
        try { return JSON.parse(localStorage.getItem('tm_api_user') || 'null'); }
        catch (e) { return null; }
    },

    async request(path, opts = {}) {
        const headers = { 'Content-Type': 'application/json', ...(opts.headers || {}) };
        const token = this.token();
        if (token) headers.Authorization = `Bearer ${token}`;

        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 4000);
        let res;
        try {
            res = await fetch(this.base + path, { ...opts, headers, signal: controller.signal });
        } catch (e) {
            throw new Error('OFFLINE'); // backend injoignable
        } finally {
            clearTimeout(timeout);
        }
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.message || 'Erreur API');
        return data;
    },

    ping() {
        if (this._pingCache !== undefined) return Promise.resolve(this._pingCache);
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 1200); // health-check rapide, ne doit pas ralentir la page
        return fetch(this.base + '/health', { signal: controller.signal })
            .then(res => { clearTimeout(timeout); this._pingCache = res.ok; return res.ok; })
            .catch(() => { clearTimeout(timeout); this._pingCache = false; return false; });
    },

    /* ---- Auth ---- */
    register(data) { return this.request('/auth/register', { method: 'POST', body: JSON.stringify(data) }); },
    login(data) { return this.request('/auth/login', { method: 'POST', body: JSON.stringify(data) }); },
    loginGoogle(credential) { return this.request('/auth/google', { method: 'POST', body: JSON.stringify({ credential }) }); },
    loginFacebook(accessToken) { return this.request('/auth/facebook', { method: 'POST', body: JSON.stringify({ accessToken }) }); },

    /* ---- Jeux / scores ---- */
    listGames() { return this.request('/games'); },
    getLevelConfig(jeu, n) { return this.request(`/games/${jeu}/niveau/${n}`); },
    addScore(data) { return this.request('/scores', { method: 'POST', body: JSON.stringify(data) }); },

    /* ---- Classement ---- */
    globalLeaderboard() { return this.request('/leaderboard/global'); },
    gameLeaderboard(jeu) { return this.request(`/leaderboard/${jeu}`); },

    /* ---- Avis ---- */
    getReviews(jeu) { return this.request(`/reviews/${jeu}`); },
    addReview(data) { return this.request('/reviews', { method: 'POST', body: JSON.stringify(data) }); },

    /* ---- Défi quotidien ---- */
    todayChallenge() { return this.request('/challenges/today'); },
    getChallengeProgress() { return this.request('/challenges/progress'); },
    updateChallengeProgress(data) { return this.request('/challenges/progress', { method: 'POST', body: JSON.stringify(data) }); }
};

window.Api = Api;
