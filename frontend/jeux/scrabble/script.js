/* =====================================================================
   SCRABBLE — script.js
   Le joueur assemble des mots malagasy valides à partir des lettres
   proposées (mot cible + lettres pièges). Chaque mot valide trouvé
   pendant le round rapporte des points ; le round se termine quand le
   temps est écoulé. Trouver le mot cible = victoire.
   ===================================================================== */

Auth.requireAuth();
const currentUser = Storage.getCurrentUser();
const GAME_ID = 'scrabble';

/* ---- Banque de mots valides (dictionnaire du jeu) ---- */
const WORD_BANK = [
    { mot: "aza", categorie: "moderne" }, { mot: "eny", categorie: "moderne" },
    { mot: "tsy", categorie: "moderne" }, { mot: "ary", categorie: "moderne" },
    { mot: "vola", categorie: "moderne" }, { mot: "rano", categorie: "moderne" },
    { mot: "vary", categorie: "moderne" }, { mot: "hazo", categorie: "moderne" },
    { mot: "omby", categorie: "moderne" }, { mot: "saka", categorie: "moderne" },
    { mot: "tany", categorie: "moderne" }, { mot: "afo", categorie: "moderne" },
    { mot: "mena", categorie: "moderne" }, { mot: "mavo", categorie: "moderne" },
    { mot: "lava", categorie: "moderne" }, { mot: "fohy", categorie: "moderne" },
    { mot: "mafy", categorie: "moderne" }, { mot: "loha", categorie: "moderne" },
    { mot: "tena", categorie: "moderne" }, { mot: "mora", categorie: "moderne" },
    { mot: "zato", categorie: "moderne" }, { mot: "aina", categorie: "moderne" },
    { mot: "hita", categorie: "moderne" }, { mot: "asa", categorie: "moderne" },
    { mot: "alika", categorie: "moderne" }, { mot: "vorona", categorie: "moderne" },
    { mot: "lanitra", categorie: "moderne" }, { mot: "tanana", categorie: "moderne" },
    { mot: "volana", categorie: "moderne" }, { mot: "kintana", categorie: "moderne" },
    { mot: "sekoly", categorie: "moderne" }, { mot: "harena", categorie: "moderne" },
    { mot: "tantara", categorie: "moderne" }, { mot: "kalesy", categorie: "moderne" },
    { mot: "tsara", categorie: "moderne" }, { mot: "ratsy", categorie: "moderne" },
    { mot: "marina", categorie: "moderne" }, { mot: "malemy", categorie: "moderne" },
    { mot: "mainty", categorie: "moderne" }, { mot: "fotsy", categorie: "moderne" },
    { mot: "maitso", categorie: "moderne" }, { mot: "trano", categorie: "moderne" },
    { mot: "ankizy", categorie: "moderne" }, { mot: "zandry", categorie: "moderne" },
    { mot: "havana", categorie: "moderne" }, { mot: "namana", categorie: "moderne" },
    { mot: "sakaiza", categorie: "moderne" }, { mot: "penina", categorie: "moderne" },
    { mot: "kilalao", categorie: "moderne" }, { mot: "baolina", categorie: "moderne" },
    { mot: "lalao", categorie: "moderne" }, { mot: "rihana", categorie: "moderne" },
    { mot: "efitra", categorie: "moderne" }, { mot: "lakozia", categorie: "moderne" },
    { mot: "farihy", categorie: "moderne" }, { mot: "orana", categorie: "moderne" },
    { mot: "rahona", categorie: "moderne" }, { mot: "taona", categorie: "moderne" },
    { mot: "andro", categorie: "moderne" }, { mot: "alina", categorie: "moderne" },
    { mot: "maraina", categorie: "moderne" }, { mot: "hariva", categorie: "moderne" },
    { mot: "talata", categorie: "moderne" }, { mot: "toerana", categorie: "moderne" },
    { mot: "zavatra", categorie: "moderne" }, { mot: "sitrapo", categorie: "moderne" },
    { mot: "tolotra", categorie: "moderne" }, { mot: "orinasa", categorie: "moderne" },
    { mot: "faritra", categorie: "moderne" }, { mot: "vahiny", categorie: "moderne" },
    { mot: "riaka", categorie: "moderne" }, { mot: "angady", categorie: "moderne" },
    { mot: "antsy", categorie: "moderne" }, { mot: "kofehy", categorie: "moderne" },
    { mot: "tanety", categorie: "moderne" }, { mot: "havoana", categorie: "moderne" },
    { mot: "mpianatra", categorie: "moderne" }, { mot: "fitiavana", categorie: "moderne" },
    { mot: "fahefana", categorie: "moderne" }, { mot: "fanajana", categorie: "moderne" },
    { mot: "fiadanana", categorie: "moderne" }, { mot: "fitsipika", categorie: "moderne" },
    { mot: "fahazavana", categorie: "moderne" }, { mot: "fahasahiana", categorie: "moderne" },
    { mot: "mpampianatra", categorie: "moderne" }, { mot: "fahasalamana", categorie: "moderne" },
    { mot: "fahalalahana", categorie: "moderne" }, { mot: "fifidianana", categorie: "moderne" },
    { mot: "fahamarinana", categorie: "moderne" }, { mot: "fanabeazana", categorie: "moderne" },
    { mot: "fahendrena", categorie: "moderne" }, { mot: "faharetana", categorie: "moderne" },
    { mot: "fitantanana", categorie: "moderne" }, { mot: "renivohitra", categorie: "moderne" },
    { mot: "fanadinana", categorie: "moderne" }, { mot: "fahombiazana", categorie: "moderne" },
    // ---- Renfort de la tranche 8-9 lettres (101-200) ----
    { mot: "fanjakana", categorie: "moderne" }, { mot: "miaramila", categorie: "moderne" },
    { mot: "mpitondra", categorie: "moderne" }, { mot: "indrindra", categorie: "moderne" },
    { mot: "fahazoana", categorie: "moderne" }, { mot: "minisitra", categorie: "moderne" },
    { mot: "kaominina", categorie: "moderne" }, { mot: "distrika", categorie: "moderne" },
    { mot: "faritany", categorie: "moderne" }, { mot: "fambolena", categorie: "moderne" },
    { mot: "fiompiana", categorie: "moderne" }, { mot: "mpanjifa", categorie: "moderne" },
    { mot: "mpampiasa", categorie: "moderne" }, { mot: "governora", categorie: "moderne" },
    { mot: "senatera", categorie: "moderne" }, { mot: "jeneraly", categorie: "moderne" },
    { mot: "kaomandy", categorie: "moderne" }, { mot: "tantsaha", categorie: "moderne" },
    { mot: "mpamboly", categorie: "moderne" }, { mot: "mpitsabo", categorie: "moderne" },
    { mot: "fanafody", categorie: "moderne" }, { mot: "hopitaly", categorie: "moderne" },
    { mot: "dokotera", categorie: "moderne" }, { mot: "fiarovana", categorie: "moderne" },
    { mot: "vehivavy", categorie: "moderne" }, { mot: "lehilahy", categorie: "moderne" },
    { mot: "rahalahy", categorie: "moderne" }, { mot: "fitaratra", categorie: "moderne" },
    { mot: "fandriana", categorie: "moderne" }, { mot: "vovonana", categorie: "moderne" },
    { mot: "tokotany", categorie: "moderne" }, { mot: "tokotrano", categorie: "moderne" },
    { mot: "tetezana", categorie: "moderne" }, { mot: "renirano", categorie: "moderne" },
    { mot: "tafiotra", categorie: "moderne" }, { mot: "atoandro", categorie: "moderne" },
    { mot: "antoandro", categorie: "moderne" }, { mot: "alarobia", categorie: "moderne" },
    { mot: "alakamisy", categorie: "moderne" }, { mot: "rehareha", categorie: "moderne" },
    { mot: "fahavalo", categorie: "moderne" }, { mot: "solosaina", categorie: "moderne" },
    { mot: "fidirana", categorie: "moderne" }, { mot: "fivoahana", categorie: "moderne" },
    { mot: "mpamorona", categorie: "moderne" },
    // ---- Ancien (201-250) ----
    { mot: "ombiasa", categorie: "ancien" }, { mot: "hasina", categorie: "ancien" },
    { mot: "vintana", categorie: "ancien" }, { mot: "fady", categorie: "ancien" },
    { mot: "sampy", categorie: "ancien" }, { mot: "andriana", categorie: "ancien" },
    { mot: "hova", categorie: "ancien" }, { mot: "famadihana", categorie: "ancien" },
    { mot: "vazimba", categorie: "ancien" }, { mot: "joro", categorie: "ancien" },
    { mot: "razana", categorie: "ancien" }, { mot: "loholona", categorie: "ancien" },
    { mot: "mpitaiza", categorie: "ancien" }, { mot: "tsiny", categorie: "ancien" },
    { mot: "fomba", categorie: "ancien" },
    { mot: "ody", categorie: "ancien" }, { mot: "sikidy", categorie: "ancien" },
    { mot: "mpanandro", categorie: "ancien" }, { mot: "ohabolana", categorie: "ancien" },
    { mot: "hainteny", categorie: "ancien" }, { mot: "kabary", categorie: "ancien" },
    { mot: "fanahy", categorie: "ancien" }, { mot: "toko", categorie: "ancien" },
    { mot: "angano", categorie: "ancien" }, { mot: "valiha", categorie: "ancien" },
    { mot: "fanoharana", categorie: "ancien" },
    // ---- Archaïque (251-300) ----
    { mot: "andevo", categorie: "archaique" }, { mot: "menakely", categorie: "archaique" },
    { mot: "voromahery", categorie: "archaique" }, { mot: "trimobe", categorie: "archaique" },
    { mot: "voninahitra", categorie: "archaique" }, { mot: "tsimandoa", categorie: "archaique" },
    { mot: "fanompoana", categorie: "archaique" }, { mot: "vadin-tany", categorie: "archaique" },
    { mot: "mpanjakabe", categorie: "archaique" }
];

/* =====================================================================
   BANQUE DÉDIÉE AU DÉFI QUOTIDIEN — volontairement séparée de WORD_BANK.
   ===================================================================== */
const DEFI_WORD_BANK = [
    { mot: "eny", categorie: "moderne" }, { mot: "vola", categorie: "moderne" },
    { mot: "asa", categorie: "moderne" }, { mot: "trano", categorie: "moderne" },
    { mot: "tsara", categorie: "moderne" }, { mot: "namana", categorie: "moderne" },
    { mot: "fanjakana", categorie: "moderne" }, { mot: "mpitondra", categorie: "moderne" },
    { mot: "faritany", categorie: "moderne" }, { mot: "hasina", categorie: "ancien" },
    { mot: "ohabolana", categorie: "ancien" }, { mot: "andriana", categorie: "ancien" },
    { mot: "tsimandoa", categorie: "archaique" }, { mot: "voninahitra", categorie: "archaique" }
];

/* Ensemble de tous les mots valides (peu importe leur catégorie), pour la vérification du dictionnaire */
const VALID_WORDS = new Set(WORD_BANK.map(w => w.mot));

/* ---- Valeur de chaque lettre (façon Scrabble, alphabet malagasy) ---- */
const LETTER_VALUES = {
    a: 1, e: 1, i: 1, o: 1, n: 1, t: 1, r: 1, s: 1,
    m: 2, f: 2, v: 2, k: 2, l: 2, h: 2,
    d: 3, g: 3, p: 3, y: 3, b: 3,
    j: 4, z: 4
};
function letterValue(l) { return LETTER_VALUES[l.toLowerCase()] || 1; }

/* ---- Son (propre à ce jeu) ---- */
const SOUND_KEY = `tm_son_${GAME_ID}`;
const Sound = {
    ctx: null,
    isOn() { return localStorage.getItem(SOUND_KEY) !== 'off'; },
    toggle() { localStorage.setItem(SOUND_KEY, this.isOn() ? 'off' : 'on'); updateSoundIcon(); },
    beep(freq, duration = 0.12, type = 'sine') {
        if (!this.isOn()) return;
        if (!this.ctx) this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = type; osc.frequency.value = freq;
        gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);
        osc.connect(gain).connect(this.ctx.destination);
        osc.start(); osc.stop(this.ctx.currentTime + duration);
    },
    correct() { this.beep(880, 0.15, 'triangle'); setTimeout(() => this.beep(1175, 0.2, 'triangle'), 120); },
    wrong() { this.beep(180, 0.2, 'sawtooth'); },
    tick() { this.beep(440, 0.05, 'square'); },
    hint() { this.beep(660, 0.1, 'sine'); },
    place() { this.beep(520, 0.06, 'square'); }
};
function updateSoundIcon() {
    document.getElementById('btn-sound').innerHTML = Utils.icon(Sound.isOn() ? 'volume-on' : 'volume-off');
}

/* ---- Progression ---- */
const PROGRESS_KEY = `tm_progress_${GAME_ID}_${currentUser.id}`;
function getSavedLevel() { return parseInt(localStorage.getItem(PROGRESS_KEY) || '1', 10); }
function saveLevel(n) { localStorage.setItem(PROGRESS_KEY, String(n)); }

const urlParams = new URLSearchParams(window.location.search);
let niveauActuel = Math.min(Math.max(parseInt(urlParams.get('niveau') || getSavedLevel(), 10), 1), Utils.MAX_NIVEAU);
const estDefi = urlParams.get('defi') === '1';

const ALPHABET = 'abdefghiklmnoprstvyz'.split('');

let levelConfig, motCible, lettresPool, tuilesUtilisees, motsTrouves, indicesUtilises, tempsRestant, timerInterval, partieTerminee, assemblage;

async function demarrerNiveau(n) {
    niveauActuel = n;
    levelConfig = Utils.getLevelConfig(n);

    document.getElementById('tiles-tray').innerHTML = '<p style="color:var(--color-text-muted);font-size:var(--fs-sm)">Eny am-pikarohana teny...</p>';

    const choisi = estDefi
        ? Utils.pickWordForChallenge(n, DEFI_WORD_BANK)
        : await Utils.pickWordNoRepeat(GAME_ID, currentUser.id, n, WORD_BANK);
    motCible = choisi.mot;
    if (!VALID_WORDS.has(motCible)) VALID_WORDS.add(motCible); // mot venu du défi ou du dictionnaire en ligne : accepté aussi comme valide

    // Lettres du mot cible + lettres pièges (nombre croissant avec la difficulté)
    const lettresBase = [...motCible];
    const distracteurs = [];
    let seed = n * 7 + 3;
    const rand = () => { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; };
    for (let i = 0; i < levelConfig.nbDistracteurs; i++) {
        distracteurs.push(ALPHABET[Math.floor(rand() * ALPHABET.length)]);
    }
    lettresPool = Utils.seededShuffle([...lettresBase, ...distracteurs], n);

    tuilesUtilisees = new Array(lettresPool.length).fill(false);
    motsTrouves = [];
    indicesUtilises = 0;
    tempsRestant = levelConfig.tempsSecondes;
    partieTerminee = false;
    assemblage = []; // indices dans lettresPool

    document.getElementById('niveau-label').textContent = `Haavo ${n} / ${Utils.MAX_NIVEAU}`;
    const badge = document.getElementById('badge-palier');
    badge.textContent = Utils.palierLabel(levelConfig.palier);
    badge.className = `badge-diff ${Utils.palierColorClass(levelConfig.palier)}`;

    document.getElementById('points-value').textContent = '0';
    document.getElementById('hint-count').textContent = Math.max(0, levelConfig.indicesAutorises - indicesUtilises);
    document.getElementById('timer-icon').innerHTML = Utils.icon('clock');
    document.getElementById('points-icon').innerHTML = Utils.icon('star');
    document.getElementById('found-words').innerHTML = '';
    updateSoundIcon();

    renderTray();
    renderAssembly();
    updateTimerDisplay();

    clearInterval(timerInterval);
    timerInterval = setInterval(tickTimer, 1000);
}

function renderTray() {
    const tray = document.getElementById('tiles-tray');
    tray.innerHTML = lettresPool.map((l, i) => `
        <div class="tile ${tuilesUtilisees[i] ? 'used' : ''}" data-index="${i}">
            ${l}<span class="tile-value">${letterValue(l)}</span>
        </div>
    `).join('');
    tray.querySelectorAll('.tile').forEach(t => t.addEventListener('click', onTrayTileClick));
}

function renderAssembly() {
    const row = document.getElementById('assembly-row');
    row.innerHTML = assemblage.map(i => `
        <div class="tile" data-index="${i}">${lettresPool[i]}<span class="tile-value">${letterValue(lettresPool[i])}</span></div>
    `).join('');
    row.querySelectorAll('.tile').forEach(t => t.addEventListener('click', onAssemblyTileClick));
}

function onTrayTileClick(e) {
    if (partieTerminee) return;
    const i = parseInt(e.currentTarget.dataset.index, 10);
    if (tuilesUtilisees[i]) return;
    tuilesUtilisees[i] = true;
    assemblage.push(i);
    Sound.place();
    renderTray();
    renderAssembly();
}

function onAssemblyTileClick(e) {
    if (partieTerminee) return;
    const i = parseInt(e.currentTarget.dataset.index, 10);
    tuilesUtilisees[i] = false;
    assemblage = assemblage.filter(x => x !== i);
    renderTray();
    renderAssembly();
}

document.getElementById('btn-clear').addEventListener('click', () => {
    if (partieTerminee) return;
    assemblage.forEach(i => tuilesUtilisees[i] = false);
    assemblage = [];
    renderTray();
    renderAssembly();
});

document.getElementById('btn-submit').addEventListener('click', () => {
    if (partieTerminee || !assemblage.length) return;
    const mot = assemblage.map(i => lettresPool[i]).join('').toLowerCase();

    if (motsTrouves.includes(mot)) {
        Utils.toast('Efa nalefanao io teny io.', 'error');
        return;
    }
    if (mot.length < 2 || !VALID_WORDS.has(mot)) {
        Sound.wrong();
        Utils.toast('Tsy teny manan-kery izany, andramo indray.', 'error');
        return;
    }

    // Mot valide
    motsTrouves.push(mot);
    const points = assemblage.reduce((sum, i) => sum + letterValue(lettresPool[i]), 0) * Math.round(levelConfig.multiplicateurPoints);
    const pointsAffiches = parseInt(document.getElementById('points-value').textContent, 10) + points;
    document.getElementById('points-value').textContent = pointsAffiches;

    const estMotCible = mot === motCible;
    Sound.correct();
    const chip = document.createElement('span');
    chip.className = `found-word-chip ${estMotCible ? 'main' : ''}`;
    chip.textContent = `${mot} (+${points})`;
    document.getElementById('found-words').appendChild(chip);

    // Libère les tuiles pour pouvoir composer un autre mot
    assemblage.forEach(i => tuilesUtilisees[i] = false);
    assemblage = [];
    renderTray();
    renderAssembly();

    if (estMotCible) {
        clearInterval(timerInterval);
        terminerPartie(true);
    }
});

function tickTimer() {
    if (partieTerminee) return;
    tempsRestant--;
    updateTimerDisplay();
    if (tempsRestant <= 5 && tempsRestant > 0) Sound.tick();
    if (tempsRestant <= 0) { clearInterval(timerInterval); terminerPartie(false); }
}

function updateTimerDisplay() {
    document.getElementById('timer-value').textContent = Utils.formatTime(tempsRestant);
    const pct = Math.max(0, (tempsRestant / levelConfig.tempsSecondes) * 100);
    const fill = document.getElementById('timer-fill');
    fill.style.width = pct + '%';
    const isWarning = tempsRestant <= levelConfig.tempsSecondes * 0.25;
    fill.classList.toggle('warning', isWarning);
    document.getElementById('game-timer').classList.toggle('timer-warning', isWarning);
}

/* ---- Indice : place automatiquement la lettre manquante suivante du mot cible ---- */
document.getElementById('btn-hint').addEventListener('click', () => {
    if (partieTerminee) return;
    const restants = levelConfig.indicesAutorises - indicesUtilises;
    if (restants <= 0) { Utils.toast('Tsy manana fanampiana intsony ianao.', 'error'); return; }

    const lettresAssemblage = assemblage.map(i => lettresPool[i]);
    const positionManquante = lettresAssemblage.length;
    if (positionManquante >= motCible.length) { Utils.toast('Efa feno ny teny cible.', 'info'); return; }
    const lettreVoulue = motCible[positionManquante];

    const indexDisponible = lettresPool.findIndex((l, i) => l === lettreVoulue && !tuilesUtilisees[i]);
    if (indexDisponible === -1) { Utils.toast('Tsy hita ilay litera ilaina.', 'error'); return; }

    tuilesUtilisees[indexDisponible] = true;
    assemblage.push(indexDisponible);
    indicesUtilises++;
    Sound.hint();
    document.getElementById('hint-count').textContent = Math.max(0, levelConfig.indicesAutorises - indicesUtilises);
    renderTray();
    renderAssembly();
});

function terminerPartie(gagne) {
    partieTerminee = true;
    document.querySelectorAll('.tile').forEach(t => t.style.pointerEvents = 'none');

    const pointsTotal = parseInt(document.getElementById('points-value').textContent, 10);
    let etoiles = 0, xp = 0;

    if (gagne) {
        Sound.correct();
        xp = Math.round(levelConfig.xpBase * (indicesUtilises === 0 ? 1 : 0.7) + motsTrouves.length * 5);
        // Étoiles = basées sur les indices utilisés (toujours 3 si aucune aide),
        // avec un bonus de +1 si au moins un mot bonus a été trouvé en plus du mot cible.
        etoiles = indicesUtilises === 0 ? 3 : (indicesUtilises === 1 ? 2 : 1);
        if (motsTrouves.length > 1 && etoiles < 3) etoiles++;

        if (estDefi) {
            // Défi quotidien : TOTALEMENT séparé de la progression générale.
            const today = new Date().toISOString().slice(0, 10);
            const result = Storage.setChallengeProgress(currentUser.id, today, GAME_ID, { statut: 'vita', score: pointsTotal });
            if (window.Api) Api.updateChallengeProgress({ date: today, jeu: GAME_ID, statut: 'vita', score: pointsTotal }).catch(() => {});
            if (result.bonusAttribue) {
                setTimeout(() => Utils.toast("Valisoa fanampiny voaray ! Vita avokoa ny 3 lalao.", 'success'), 600);
            }
        } else {
            // Partie normale : alimente le profil général et le classement.
            Storage.addScore({ userId: currentUser.id, jeu: GAME_ID, niveau: niveauActuel, points: pointsTotal, etoiles });
            if (window.Api) Api.addScore({ jeu: GAME_ID, niveau: niveauActuel, points: pointsTotal, etoiles }).catch(() => {});
            const profile = Storage.getProfile(currentUser.id);
            Storage.updateProfile(currentUser.id, {
                xp: profile.xp + xp,
                pointsTotal: profile.pointsTotal + pointsTotal,
                niveauGlobal: Math.max(profile.niveauGlobal, 1 + Math.floor((profile.xp + xp) / 100)),
                dernierJeu: GAME_ID
            });
            if (niveauActuel >= getSavedLevel()) saveLevel(Math.min(Utils.MAX_NIVEAU, niveauActuel + 1));
        }
    } else {
        Sound.wrong();
        // Les mots bonus trouvés avant la fin du temps restent quand même
        // récompensés (petite consolation) — mais UNIQUEMENT en mode normal,
        // jamais en mode défi (qui ne doit jamais toucher au classement général).
        if (pointsTotal > 0 && !estDefi) {
            Storage.addScore({ userId: currentUser.id, jeu: GAME_ID, niveau: niveauActuel, points: pointsTotal, etoiles: 0 });
        }
    }

    afficherResultat(gagne, pointsTotal, xp, etoiles);
}

function afficherResultat(gagne, points, xp, etoiles) {
    const modal = document.getElementById('result-modal');
    const icon = document.getElementById('result-icon');
    icon.className = `result-modal__icon ${gagne ? 'win' : 'lose'}`;
    icon.innerHTML = Utils.icon(gagne ? 'check' : 'x');
    document.getElementById('result-title').textContent = gagne ? 'Mahafinaritra !' : 'Lany fotoana !';
    document.getElementById('result-subtitle').textContent = gagne
        ? 'Namorona ilay teny cible ianao.'
        : 'Tsy voaforonao ilay teny cible.';
    document.getElementById('result-stars').innerHTML = gagne ? Utils.starsHTML(etoiles, 3) : '';
    document.getElementById('result-points').textContent = points;
    document.getElementById('result-xp').textContent = xp;
    document.getElementById('result-answer').textContent = `Ilay teny cible: ${motCible}`;

    // En mode défi, "Manaraka" doit enchaîner sur le jeu suivant du défi
    // (Scrabble est le dernier maillon -> retour direct à l'accueil).
    const btnNext = document.getElementById('btn-next');
    if (estDefi) {
        btnNext.textContent = "Hiverina any amin'ny fitambarana";
    } else {
        btnNext.textContent = 'Manaraka';
    }
    modal.classList.add('open');
}

document.getElementById('btn-retry').addEventListener('click', () => {
    document.getElementById('result-modal').classList.remove('open');
    demarrerNiveau(niveauActuel);
});
document.getElementById('btn-next').addEventListener('click', () => {
    document.getElementById('result-modal').classList.remove('open');
    if (estDefi) {
        window.location.href = '../../dashboard/index.html';
    } else {
        demarrerNiveau(Math.min(Utils.MAX_NIVEAU, niveauActuel + 1));
    }
});

/* ---- Règles ---- */
const rulesModal = document.getElementById('rules-modal');
document.getElementById('btn-rules').addEventListener('click', () => rulesModal.classList.add('open'));
document.getElementById('rules-close').addEventListener('click', () => rulesModal.classList.remove('open'));
document.getElementById('rules-ok').addEventListener('click', () => rulesModal.classList.remove('open'));
rulesModal.addEventListener('click', (e) => { if (e.target === rulesModal) rulesModal.classList.remove('open'); });

document.getElementById('btn-sound').addEventListener('click', Sound.toggle);
Utils.initBackToTop();

demarrerNiveau(niveauActuel);
