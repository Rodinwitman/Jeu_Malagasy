/* ===================================================================
   STORAGE.JS
   Couche d'accès aux données. Version 1 = localStorage uniquement.
   AUCUNE donnée de démo n'est pré-remplie : tout commence vide.
   Le premier utilisateur qui joue crée le premier record.
   Cette couche est conçue pour être remplacée par des appels fetch()
   vers le backend Node.js/SQL sans changer l'API utilisée ailleurs
   dans le code (voir "Migration future" en bas de fichier).
   =================================================================== */

const DB_KEYS = {
    USERS: 'tm_users',            // liste des comptes { id, username, email, passwordHash, provider, createdAt }
    SESSION: 'tm_session',        // utilisateur actuellement connecté (id)
    PROFILES: 'tm_profiles',      // profil de jeu par utilisateur { userId, xp, niveau, points, badge }
    SCORES: 'tm_scores',          // historique des scores { id, userId, jeu, niveau, points, etoiles, date }
    LEADERBOARD: 'tm_leaderboard',// classement dérivé des scores (recalculé, pas stocké en dur)
    REVIEWS: 'tm_reviews',        // avis { id, userId, jeu, note, commentaire, date }
    CHALLENGES: 'tm_challenges',  // défi du jour { date, jeu, mission, recompense }
    CHALLENGE_PROGRESS: 'tm_challenge_progress', // { userId, date, statut, score }
    SETTINGS: 'tm_settings'       // { theme, sonGlobalDefaut }
};

const Storage = {
    _read(key, fallback) {
        try {
            const raw = localStorage.getItem(key);
            return raw ? JSON.parse(raw) : fallback;
        } catch (e) {
            console.error('Storage read error', key, e);
            return fallback;
        }
    },
    _write(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
            return true;
        } catch (e) {
            console.error('Storage write error', key, e);
            return false;
        }
    },

    /* ---------------- Utilisateurs ---------------- */
    getUsers() { return this._read(DB_KEYS.USERS, []); },
    saveUsers(users) { return this._write(DB_KEYS.USERS, users); },
    findUserByUsername(username) {
        return this.getUsers().find(u => u.username.toLowerCase() === username.toLowerCase());
    },
    findUserByEmail(email) {
        return this.getUsers().find(u => (u.email || '').toLowerCase() === (email || '').toLowerCase());
    },
    findUserByProvider(provider, providerId) {
        return this.getUsers().find(u => u.provider === provider && u.providerId === providerId);
    },
    createUser(user) {
        const users = this.getUsers();
        const newUser = {
            id: 'u_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
            createdAt: new Date().toISOString(),
            ...user
        };
        users.push(newUser);
        this.saveUsers(users);
        // Chaque nouvel utilisateur démarre avec un profil vierge (aucune donnée simulée)
        this.createProfile(newUser.id);
        return newUser;
    },

    /* ---------------- Session ---------------- */
    getSession() { return this._read(DB_KEYS.SESSION, null); },
    setSession(userId) { return this._write(DB_KEYS.SESSION, { userId, connectedAt: new Date().toISOString() }); },
    clearSession() { localStorage.removeItem(DB_KEYS.SESSION); },
    getCurrentUser() {
        const s = this.getSession();
        if (!s) return null;
        return this.getUsers().find(u => u.id === s.userId) || null;
    },

    /* ---------------- Profil joueur (XP, niveau, points) ---------------- */
    getProfiles() { return this._read(DB_KEYS.PROFILES, []); },
    saveProfiles(profiles) { return this._write(DB_KEYS.PROFILES, profiles); },
    createProfile(userId) {
        const profiles = this.getProfiles();
        if (profiles.find(p => p.userId === userId)) return;
        profiles.push({ userId, xp: 0, niveauGlobal: 1, pointsTotal: 0, dernierJeu: null });
        this.saveProfiles(profiles);
    },
    getProfile(userId) {
        return this.getProfiles().find(p => p.userId === userId) || null;
    },
    updateProfile(userId, patch) {
        const profiles = this.getProfiles();
        const idx = profiles.findIndex(p => p.userId === userId);
        if (idx === -1) return null;
        profiles[idx] = { ...profiles[idx], ...patch };
        this.saveProfiles(profiles);
        return profiles[idx];
    },

    /* ---------------- Scores ---------------- */
    getScores() { return this._read(DB_KEYS.SCORES, []); },
    saveScores(scores) { return this._write(DB_KEYS.SCORES, scores); },
    addScore(score) {
        const scores = this.getScores();
        const entry = { id: 's_' + Date.now() + '_' + Math.floor(Math.random() * 1000), date: new Date().toISOString(), ...score };
        scores.push(entry);
        this.saveScores(scores);
        return entry;
    },
    /** Meilleur score d'un utilisateur pour un jeu (record personnel). */
    getBestScore(userId, jeu) {
        const scores = this.getScores().filter(s => s.userId === userId && s.jeu === jeu);
        if (!scores.length) return null;
        return scores.reduce((best, s) => (s.points > best.points ? s : best));
    },

    /* ---------------- Classement (calculé dynamiquement, jamais stocké en dur) ---------------- */
    /**
     * Classement global = somme XP par utilisateur, uniquement pour les
     * utilisateurs ayant au moins une partie jouée. Vide tant que personne
     * n'a joué.
     */
    getGlobalLeaderboard() {
        const profiles = this.getProfiles().filter(p => p.xp > 0);
        const users = this.getUsers();
        return profiles
            .map(p => ({
                userId: p.userId,
                username: (users.find(u => u.id === p.userId) || {}).username || '???',
                xp: p.xp,
                niveauGlobal: p.niveauGlobal
            }))
            .sort((a, b) => b.xp - a.xp);
    },
    /** Classement par jeu = meilleur score de chaque utilisateur pour ce jeu. */
    getGameLeaderboard(jeu) {
        const scores = this.getScores().filter(s => s.jeu === jeu);
        const users = this.getUsers();
        const bestByUser = {};
        scores.forEach(s => {
            if (!bestByUser[s.userId] || s.points > bestByUser[s.userId].points) {
                bestByUser[s.userId] = s;
            }
        });
        return Object.values(bestByUser)
            .map(s => ({
                userId: s.userId,
                username: (users.find(u => u.id === s.userId) || {}).username || '???',
                points: s.points,
                niveau: s.niveau
            }))
            .sort((a, b) => b.points - a.points);
    },

    /* ---------------- Avis ---------------- */
    getReviews(jeu) {
        const all = this._read(DB_KEYS.REVIEWS, []);
        return jeu ? all.filter(r => r.jeu === jeu) : all;
    },
    addReview(review) {
        const all = this._read(DB_KEYS.REVIEWS, []);
        const entry = { id: 'r_' + Date.now(), date: new Date().toISOString(), ...review };
        all.push(entry);
        this._write(DB_KEYS.REVIEWS, all);
        return entry;
    },
    getReviewStats(jeu) {
        const reviews = this.getReviews(jeu);
        if (!reviews.length) return { moyenne: 0, nombre: 0 };
        const moyenne = reviews.reduce((sum, r) => sum + r.note, 0) / reviews.length;
        return { moyenne: Math.round(moyenne * 10) / 10, nombre: reviews.length };
    },

    /* ---------------- Défi quotidien (mélange des 3 jeux) ---------------- */
    getTodayChallenge() {
        const today = new Date().toISOString().slice(0, 10);
        return window.Utils.generateDailyChallenge(today); // calcul pur, rien à stocker
    },

    /** Retourne { mot_cache: {statut,score}, devinette: {...}, scrabble: {...}, bonusAttribue } */
    getChallengeProgress(userId, date) {
        const all = this._read(DB_KEYS.CHALLENGE_PROGRESS, []);
        const record = all.find(p => p.userId === userId && p.date === date);
        const base = {
            mot_cache: { statut: 'tsy_natao', score: 0 },
            devinette: { statut: 'tsy_natao', score: 0 },
            scrabble: { statut: 'tsy_natao', score: 0 },
            bonusAttribue: false
        };
        if (!record) return base;
        return { ...base, ...(record.progress || {}), bonusAttribue: !!record.bonusAttribue };
    },

    /**
     * Stats CUMULÉES des défis quotidiens, totalement séparées du profil
     * général (xp/pointsTotal/niveauGlobal) et du classement normal —
     * comme demandé : le défi ne doit jamais "se raccorder" à la
     * progression habituelle du joueur.
     */
    getChallengeStats(userId) {
        const all = this._read('tm_defi_stats', []);
        return all.find(s => s.userId === userId) || { userId, xpDefi: 0, pointsDefi: 0, defisReussis: 0 };
    },
    _addChallengeStats(userId, xpGagne, pointsGagnes) {
        const all = this._read('tm_defi_stats', []);
        const idx = all.findIndex(s => s.userId === userId);
        if (idx === -1) {
            all.push({ userId, xpDefi: xpGagne, pointsDefi: pointsGagnes, defisReussis: 1 });
        } else {
            all[idx].xpDefi += xpGagne;
            all[idx].pointsDefi += pointsGagnes;
            all[idx].defisReussis = (all[idx].defisReussis || 0) + 1;
        }
        this._write('tm_defi_stats', all);
    },

    /**
     * Met à jour la progression d'UN jeu pour le défi du jour. Si les 3 jeux
     * sont désormais réussis, le bonus est attribué automatiquement (une
     * seule fois) — mais UNIQUEMENT dans les stats de défi séparées
     * (`getChallengeStats`), jamais dans le profil général du joueur.
     * Retourne { toutesVita, bonusAttribue } (bonusAttribue = true
     * seulement si le bonus vient d'être donné à cet appel).
     */
    setChallengeProgress(userId, date, jeuId, patch) {
        const all = this._read(DB_KEYS.CHALLENGE_PROGRESS, []);
        let idx = all.findIndex(p => p.userId === userId && p.date === date);
        let record = idx === -1
            ? { userId, date, progress: {}, bonusAttribue: false }
            : { ...all[idx], progress: { ...(all[idx].progress || {}) } };

        record.progress[jeuId] = { ...(record.progress[jeuId] || { statut: 'tsy_natao', score: 0 }), ...patch };

        const JEUX = ['mot_cache', 'devinette', 'scrabble'];
        const toutesVita = JEUX.every(j => record.progress[j] && record.progress[j].statut === 'vita');

        let bonusVientDetreAttribue = false;
        if (toutesVita && !record.bonusAttribue) {
            record.bonusAttribue = true;
            bonusVientDetreAttribue = true;
            this._addChallengeStats(userId, 50, 100); // uniquement dans les stats de défi séparées
        }

        if (idx === -1) all.push(record); else all[idx] = record;
        this._write(DB_KEYS.CHALLENGE_PROGRESS, all);

        return { toutesVita, bonusAttribue: bonusVientDetreAttribue };
    },

    /* ---------------- Paramètres (thème global ; le son est PAR JEU, voir chaque jeu) ---------------- */
    getSettings() { return this._read(DB_KEYS.SETTINGS, { theme: 'light' }); },
    saveSettings(patch) {
        const current = this.getSettings();
        this._write(DB_KEYS.SETTINGS, { ...current, ...patch });
    },

    /** Réinitialisation complète (bouton de secours dans Paramètres). */
    resetAll() {
        Object.values(DB_KEYS).forEach(k => localStorage.removeItem(k));
    }
};

window.Storage = Storage;

/* =====================================================================
   MIGRATION FUTURE VERS LE BACKEND (Node.js + SQL)
   Chaque méthode ci-dessus doit devenir un appel fetch() vers l'API :
     getUsers()            -> GET    /api/users
     createUser()          -> POST   /api/auth/register
     getGlobalLeaderboard()-> GET    /api/leaderboard/global
     getGameLeaderboard()  -> GET    /api/leaderboard/:jeu
     addScore()            -> POST   /api/scores
     getReviews()/addReview() -> GET/POST /api/reviews
     getTodayChallenge()   -> GET    /api/challenges/today
   Voir backend/routes/ pour les routes déjà préparées (squelette).
   ===================================================================== */
