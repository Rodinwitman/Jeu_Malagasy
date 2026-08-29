/* ===================================================================
   UTILS.JS — fonctions partagées

   IMPORTANT — à propos des 300 niveaux par jeu :
   300 niveaux écrits à la main par jeu (1500 au total) ne serait ni
   maintenable ni fiable. On génère donc chaque niveau PROCÉDURALEMENT
   à partir de la banque de mots (data/words.json) et d'une formule de
   difficulté déterministe : le niveau N a toujours les mêmes
   paramètres (mêmes mots, même temps), donc c'est reproductible et
   testable, mais le contenu n'a pas besoin d'être stocké niveau par
   niveau. Chaque jeu (mot_cache, devinette, scrabble...) appelle
   Utils.getLevelConfig(jeu, niveau) pour obtenir ses paramètres.
   =================================================================== */

const Utils = {
    MAX_NIVEAU: 300,

    /**
     * Calcule les paramètres de difficulté du niveau N (1 à 300), organisés
     * en 6 paliers explicites (2 sous-parties par grande difficulté) :
     *   1-50    tres_facile      mots de 3-4 lettres, moderne
     *   51-100  facile           mots de 5-7 lettres, moderne
     *   101-150 intermediaire    mots de 8-9 lettres, moderne
     *   151-200 pseudo_difficile mots de 8-9 lettres, moderne (même longueur
     *                            que intermediaire, mais moins de temps et
     *                            moins d'indices — la formule ci-dessous
     *                            varie déjà en continu avec `n`, donc cette
     *                            moitié est automatiquement plus dure)
     *   201-250 difficile        mots ANCIENS mais encore utilisés
     *   251-300 infernal         mots les plus anciens, presque oubliés
     *
     * Pour 201-300, la sélection ne se fait plus par longueur mais par
     * `categorie` (voir WORD_BANK des jeux : champ `categorie`).
     */
    getLevelConfig(niveau) {
        const n = Math.min(Math.max(niveau, 1), Utils.MAX_NIVEAU);
        const progress = (n - 1) / (Utils.MAX_NIVEAU - 1); // 0 -> 1

        let palier, longueurMin, longueurMax, categorie;
        if (n <= 50) { palier = 'tres_facile'; longueurMin = 3; longueurMax = 4; categorie = 'moderne'; }
        else if (n <= 100) { palier = 'facile'; longueurMin = 5; longueurMax = 7; categorie = 'moderne'; }
        else if (n <= 150) { palier = 'intermediaire'; longueurMin = 8; longueurMax = 9; categorie = 'moderne'; }
        else if (n <= 200) { palier = 'pseudo_difficile'; longueurMin = 8; longueurMax = 9; categorie = 'moderne'; }
        else if (n <= 250) { palier = 'difficile'; longueurMin = 5; longueurMax = 16; categorie = 'ancien'; }
        else { palier = 'infernal'; longueurMin = 5; longueurMax = 18; categorie = 'archaique'; }

        // Temps disponible : de 90s à 12s, chute plus violente après le niveau 150
        const tempsBase = 90 - Math.pow(progress, 1.4) * 78;
        const tempsSecondes = Math.max(12, Math.round(tempsBase));

        // Nombre d'indices autorisés : de 3 à 0
        const indicesAutorises = Math.max(0, 3 - Math.floor(progress * 4));

        // Multiplicateur de points : plus le niveau est dur, plus il rapporte
        const multiplicateurPoints = Math.round((1 + progress * 4) * 10) / 10;

        // XP de base gagné en réussissant ce niveau
        const xpBase = Math.round(10 + progress * 90);

        // Lettres/indices supplémentaires piégeuses en Scrabble/Devinette (plus il y en a, plus dur)
        const nbDistracteurs = Math.min(6, Math.floor(progress * 8));

        return {
            niveau: n,
            palier,               // 'tres_facile' | 'facile' | 'intermediaire' | 'pseudo_difficile' | 'difficile' | 'infernal'
            categorie,             // 'moderne' | 'ancien' | 'archaique' — utilisé pour choisir le mot
            longueurMin,
            longueurMax,
            tempsSecondes,
            indicesAutorises,
            multiplicateurPoints,
            xpBase,
            nbDistracteurs
        };
    },

    palierLabel(palier) {
        return {
            tres_facile: 'Tena mora',
            facile: 'Mora',
            intermediaire: 'Antonony',
            pseudo_difficile: 'Antonony sarotra',
            difficile: 'Sarotra',
            infernal: 'Tena sarotra',
            // Rétrocompatibilité avec l'ancien système à 3 paliers (pages non encore migrées)
            mora: 'Mora', antonony: 'Antonony', sarotra: 'Sarotra'
        }[palier] || palier;
    },

    /** Regroupe les 6 paliers en 3 couleurs pour réutiliser les badges CSS existants (.mora/.antonony/.sarotra). */
    palierColorClass(palier) {
        return {
            tres_facile: 'mora', facile: 'mora',
            intermediaire: 'antonony', pseudo_difficile: 'antonony',
            difficile: 'sarotra', infernal: 'sarotra'
        }[palier] || palier;
    },

    /**
     * Sélection de mot/question pour le DÉFI QUOTIDIEN uniquement.
     * Volontairement séparée de `pickNoRepeat` / `pickWordNoRepeat` : le défi
     * ne doit jamais toucher à la mémoire anti-répétition du mode normal
     * (sinon jouer un défi "consommerait" des mots de la progression
     * habituelle du joueur). C'est déterministe (même niveau => même mot
     * pour TOUT LE MONDE, ce qui est le principe même du défi partagé).
     */
    pickWordForChallenge(niveau, wordBank) {
        const config = Utils.getLevelConfig(niveau);
        let pool = wordBank.filter(w => {
            if (config.categorie === 'moderne') {
                return (w.categorie || 'moderne') === 'moderne'
                    && w.mot.length >= config.longueurMin && w.mot.length <= config.longueurMax;
            }
            return w.categorie === config.categorie;
        });
        if (!pool.length) pool = wordBank;
        return Utils.seededShuffle(pool, niveau)[0];
    },

    /** Même principe que `pickWordForChallenge` mais pour une banque de questions (palier direct, pas de longueur/catégorie). */
    pickQuestionForChallenge(niveau, questionBank) {
        const config = Utils.getLevelConfig(niveau);
        let pool = questionBank.filter(q => q.palier === config.palier);
        if (!pool.length) pool = questionBank;
        return Utils.seededShuffle(pool, niveau)[0];
    },

    /** Ordre des jeux dans le défi quotidien, et calcul de l'URL du jeu suivant
     * (ou du dashboard si c'était le dernier). */
    DEFI_CHAIN: ['mot_cache', 'devinette', 'scrabble'],
    getNextDefiUrl(currentGameId, niveau) {
        const idx = Utils.DEFI_CHAIN.indexOf(currentGameId);
        const next = Utils.DEFI_CHAIN[idx + 1];
        return next ? `../${next}/index.html?niveau=${niveau}&defi=1` : '../../dashboard/index.html';
    },

    /** Mélange déterministe (même niveau => même résultat, reproductible) */
    seededShuffle(array, seed) {
        const arr = [...array];
        let s = seed || 1;
        const rand = () => {
            s = (s * 9301 + 49297) % 233280;
            return s / 233280;
        };
        for (let i = arr.length - 1; i > 0; i--) {
            const j = Math.floor(rand() * (i + 1));
            [arr[i], arr[j]] = [arr[j], arr[i]];
        }
        return arr;
    },

    /**
     * Défi quotidien : MÊME niveau, mélangé sur les 3 jeux fonctionnels.
     * Le niveau progresse chaque jour depuis 1 (à partir d'une date de
     * référence fixe), et boucle après le niveau 300 — donc le tout
     * premier jour est accessible, et la difficulté monte progressivement
     * au fil des jours plutôt que d'être toujours au maximum.
     */
    generateDailyChallenge(dateISO) {
        const EPOCH = new Date('2026-08-16T00:00:00Z').getTime(); // date de lancement du défi progressif = niveau 1
        const today = new Date(dateISO + 'T00:00:00Z').getTime();
        const dayIndex = Math.floor((today - EPOCH) / 86400000);
        const wrapped = ((dayIndex % Utils.MAX_NIVEAU) + Utils.MAX_NIVEAU) % Utils.MAX_NIVEAU;
        const niveau = wrapped + 1; // toujours entre 1 et 300

        return {
            date: dateISO,
            niveau,
            jeux: ['mot_cache', 'devinette', 'scrabble'],
            recompensePartielle: 30,
            recompenseBonus: 100
        };
    },

    /**
     * ALGORITHME ANTI-RÉPÉTITION.
     * Pour chaque niveau, on essaie des candidats dans un ordre déterministe
     * (mélange dépendant du niveau) et on vérifie un par un, dans une boucle
     * explicite, si chacun a DÉJÀ été utilisé par ce joueur dans ce jeu :
     *   - si oui -> on l'écarte et on passe au candidat suivant ;
     *   - si non -> on le garde, on l'enregistre comme "utilisé", et on arrête.
     * Si TOUS les candidats locaux ont déjà été vus (stock épuisé), et que
     * `onlineFallback` est fourni, on tente EN DERNIER RECOURS d'aller
     * chercher un mot supplémentaire via une API de dictionnaire malagasy
     * en ligne. Si ça échoue aussi (hors-ligne, API indisponible...), on
     * recommence proprement un nouveau cycle plutôt que de bloquer le jeu.
     */
    async pickNoRepeat(gameId, userId, niveau, pool, getKey, onlineFallback) {
        const storageKey = `tm_used_${gameId}_${userId}`;
        let used = [];
        try { used = JSON.parse(localStorage.getItem(storageKey) || '[]'); } catch (e) { used = []; }

        const ordreEssai = Utils.seededShuffle(pool, niveau);

        // Boucle de vérification explicite : candidat par candidat.
        let choisi = null;
        for (const candidat of ordreEssai) {
            const dejaVu = used.includes(getKey(candidat));
            if (!dejaVu) { choisi = candidat; break; } // pas encore vu -> on le garde, on arrête la boucle
            // sinon : déjà vu -> on continue la boucle avec le candidat suivant
        }

        // Stock local épuisé : dernier recours, le dictionnaire en ligne.
        if (!choisi && onlineFallback) {
            try { choisi = await onlineFallback(used); } catch (e) { choisi = null; }
        }

        // Stock épuisé : on a fait le tour de TOUS les candidats disponibles
        // pour ce palier précis. On oublie la majorité des mots de CE palier
        // (pas ceux des autres paliers, pour ne pas provoquer de répétitions
        // ailleurs), MAIS on garde bloqués les tout derniers mots utilisés
        // (période de recharge), pour éviter qu'un mot ne revienne
        // immédiatement juste après avoir servi.
        if (!choisi) {
            const clesDuPool = new Set(pool.map(getKey));
            const indicesDuPoolDansUsed = used.map((k, i) => clesDuPool.has(k) ? i : -1).filter(i => i !== -1);
            const cooldown = Math.min(2, Math.max(0, pool.length - 1));
            const aGarderBloques = new Set(indicesDuPoolDansUsed.slice(-cooldown).map(i => used[i]));

            used = used.filter(k => !clesDuPool.has(k) || aGarderBloques.has(k));
            choisi = ordreEssai.find(c => !used.includes(getKey(c))) || ordreEssai[0];
        }

        used.push(getKey(choisi));
        try { localStorage.setItem(storageKey, JSON.stringify(used)); } catch (e) { /* ignore */ }
        return choisi;
    },

    /**
     * Sélectionne un MOT adapté au niveau (via `Utils.getLevelConfig`) dans
     * `wordBank` (entrées `{ mot, indice, categorie }`), sans jamais répéter
     * un mot déjà rencontré par ce joueur dans ce jeu — voir `pickNoRepeat`
     * ci-dessus pour l'algorithme. Si le stock local est épuisé, tente
     * d'enrichir depuis le Wiktionnaire malagasy (voir `fetchWiktionaryWord`)
     * avant de recycler.
     */
    async pickWordNoRepeat(gameId, userId, niveau, wordBank) {
        const config = Utils.getLevelConfig(niveau);
        let pool = wordBank.filter(w => {
            if (config.categorie === 'moderne') {
                return (w.categorie || 'moderne') === 'moderne'
                    && w.mot.length >= config.longueurMin && w.mot.length <= config.longueurMax;
            }
            return w.categorie === config.categorie;
        });
        if (!pool.length) pool = wordBank; // filet de sécurité si une catégorie est vide

        return Utils.pickNoRepeat(
            gameId, userId, niveau, pool,
            w => w.mot,
            (used) => Utils.fetchWiktionaryWord(config, used)
        );
    },

    /**
     * Dernier recours : va chercher un mot malagasy supplémentaire sur le
     * Wiktionnaire (catégorie "malgache" de fr.wiktionary.org) quand la
     * banque de mots locale est épuisée pour ce palier de difficulté.
     *
     * ATTENTION — non vérifié en conditions réelles : cet appel réseau n'a
     * pas pu être testé dans l'environnement de développement (accès
     * internet restreint à quelques domaines). Le code est écrit
     * défensivement (délai d'attente court, échec silencieux, jamais
     * bloquant), mais à valider une fois déployé avec un accès internet
     * complet — notamment le nom exact de la catégorie Wiktionary à cibler.
     */
    async fetchWiktionaryWord(config, used) {
        const ctrl = new AbortController();
        const timeout = setTimeout(() => ctrl.abort(), 2500);
        const url = 'https://fr.wiktionary.org/w/api.php?action=query&list=categorymembers'
            + '&cmtitle=Cat%C3%A9gorie:malgache&cmlimit=500&format=json&origin=*';

        const res = await fetch(url, { signal: ctrl.signal });
        clearTimeout(timeout);
        if (!res.ok) throw new Error('Wiktionnaire indisponible');
        const data = await res.json();
        const membres = (data.query && data.query.categorymembers) || [];

        let candidats = membres
            .map(m => (m.title || '').toLowerCase().trim())
            .filter(mot => /^[a-zàâäéèêëïîôöùûüç'-]+$/.test(mot))
            .filter(mot => !used.includes(mot));

        if (config.categorie === 'moderne') {
            candidats = candidats.filter(mot => mot.length >= config.longueurMin && mot.length <= config.longueurMax);
        }
        if (!candidats.length) return null;

        const mot = candidats[Math.floor(Math.random() * candidats.length)];
        return { mot, indice: "Teny nalaina avy amin'ny rakibolana malagasy an-tserasera", categorie: config.categorie };
    },

    /* ---------------- Icônes SVG (jamais d'emoji) ---------------- */
    icon(name, extraClass = '') {
        const paths = {
            star: '<path d="M12 2 15 9 22 10 17 15 18.5 22 12 18.5 5.5 22 7 15 2 10 9 9 12 2z"/>',
            'star-outline': '<path d="M12 2 15 9 22 10 17 15 18.5 22 12 18.5 5.5 22 7 15 2 10 9 9 12 2z"/>',
            clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/>',
            user: '<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4.4 3.6-8 8-8s8 3.6 8 8"/>',
            lock: '<rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>',
            mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/>',
            home: '<path d="M3 11l9-7 9 7"/><path d="M5 10v10h14V10"/>',
            trophy: '<path d="M8 4h8v4a4 4 0 0 1-8 0V4z"/><path d="M5 4h3v3a3 3 0 0 1-3-3z"/><path d="M19 4h-3v3a3 3 0 0 0 3-3z"/><path d="M10 15h4v3h-4z"/><path d="M8 21h8"/>',
            flame: '<path d="M12 2c2 4-2 5-2 9a4 4 0 0 0 8 0c0-2-1-3-1-3s2 3 2 6a6 6 0 1 1-12 0c0-5 3-6 5-12z"/>',
            settings: '<circle cx="12" cy="12" r="3"/><path d="M19 12a7 7 0 0 0-.1-1.2l2-1.6-2-3.4-2.4 1a7 7 0 0 0-2-1.2L14 3h-4l-.5 2.6a7 7 0 0 0-2 1.2l-2.4-1-2 3.4 2 1.6A7 7 0 0 0 5 12a7 7 0 0 0 .1 1.2l-2 1.6 2 3.4 2.4-1a7 7 0 0 0 2 1.2L10 21h4l.5-2.6a7 7 0 0 0 2-1.2l2.4 1 2-3.4-2-1.6c.1-.4.1-.8.1-1.2z"/>',
            logout: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="M16 17l5-5-5-5"/><path d="M21 12H9"/>',
            sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
            moon: '<path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/>',
            'volume-on': '<path d="M4 9v6h4l5 4V5L8 9H4z"/><path d="M17 8a5 5 0 0 1 0 8"/>',
            'volume-off': '<path d="M4 9v6h4l5 4V5L8 9H4z"/><path d="M17 9l4 6M21 9l-4 6"/>',
            'arrow-up': '<path d="M12 19V5"/><path d="M5 12l7-7 7 7"/>',
            check: '<path d="M20 6 9 17l-5-5"/>',
            x: '<path d="M18 6 6 18"/><path d="M6 6l12 12"/>',
            menu: '<path d="M3 6h18M3 12h18M3 18h18"/>',
            chevron: '<path d="M6 9l6 6 6-6"/>',
            game: '<rect x="2" y="7" width="20" height="12" rx="4"/><path d="M8 11v4M6 13h4"/><circle cx="16" cy="12" r="1"/><circle cx="18" cy="15" r="1"/>',
            list: '<path d="M9 6h11M9 12h11M9 18h11"/><path d="M4 6h.01M4 12h.01M4 18h.01"/>',
            message: '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>'
        };
        return `<svg class="icon ${extraClass}" viewBox="0 0 24 24">${paths[name] || ''}</svg>`;
    },

    starsHTML(note, max = 5) {
        let html = '<span class="stars">';
        for (let i = 1; i <= max; i++) {
            html += i <= Math.round(note) ? Utils.icon('star') : Utils.icon('star-outline', 'empty');
        }
        return html + '</span>';
    },

    /* ---------------- Toast global ---------------- */
    toast(message, type = 'info') {
        let el = document.querySelector('.toast');
        if (!el) {
            el = document.createElement('div');
            el.className = 'toast';
            document.body.appendChild(el);
        }
        el.className = `toast show toast-${type}`;
        el.textContent = message;
        clearTimeout(el._timer);
        el._timer = setTimeout(() => el.classList.remove('show'), 3000);
    },

    formatTime(totalSeconds) {
        const m = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
        const s = Math.floor(totalSeconds % 60).toString().padStart(2, '0');
        return `${m}:${s}`;
    },

    /* ---------------- Bouton retour en haut (partagé) ---------------- */
    initBackToTop() {
        const btn = document.createElement('button');
        btn.className = 'back-to-top';
        btn.setAttribute('aria-label', 'Miverina any ambony');
        btn.innerHTML = Utils.icon('arrow-up');
        document.body.appendChild(btn);
        window.addEventListener('scroll', () => {
            btn.classList.toggle('visible', window.scrollY > 400);
        });
        btn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
    }
};

window.Utils = Utils;
