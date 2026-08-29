/* ===================================================================
   DASHBOARD.JS
   =================================================================== */

Auth.requireAuth();
const user = Storage.getCurrentUser();
const profile = Storage.getProfile(user.id) || { xp: 0, niveauGlobal: 1, pointsTotal: 0 };

/* ---- En-tête ---- */
document.getElementById('welcome-title').textContent = `Tongasoa, ${user.username} !`;

/* ---- Icônes ---- */
document.querySelector('.sidebar__brand span').innerHTML = Utils.icon('game');
document.querySelectorAll('[data-icon]').forEach(el => {
    if (el.querySelector('.icon')) return;
    const label = el.textContent.trim();
    el.innerHTML = label
        ? `${Utils.icon(el.dataset.icon)}<span>${label}</span>`
        : Utils.icon(el.dataset.icon);
});

/* ---- Stats ---- */
document.getElementById('stat-niveau').textContent = profile.niveauGlobal;
document.getElementById('stat-points').textContent = profile.pointsTotal;

const leaderboard = Storage.getGlobalLeaderboard();
const rangIndex = leaderboard.findIndex(l => l.userId === user.id);
document.getElementById('stat-rang').textContent = rangIndex === -1 ? '—' : `#${rangIndex + 1}`;

/* ---- Barre XP (seuil = 100 XP * niveau, formule simple et lisible) ---- */
const seuil = profile.niveauGlobal * 100;
const pourcentage = Math.min(100, Math.round((profile.xp % seuil) / seuil * 100));
document.getElementById('xp-niveau').textContent = profile.niveauGlobal;
document.getElementById('xp-fraction').textContent = `${profile.xp % seuil} / ${seuil} XP`;
document.getElementById('xp-fill').style.width = pourcentage + '%';

/* ---- Défi quotidien (mélange des 3 jeux) ---- */
const GAMES_LABEL = { mot_cache: 'Mot Nafenina', devinette: 'Devinette', scrabble: 'Scrabble', pendu: 'Pendu', wordle: 'Wordle' };
const JEU_ICONS = { mot_cache: 'game', devinette: 'message', scrabble: 'game' };

async function renderDailyChallenge() {
    const today = new Date().toISOString().slice(0, 10);
    let defi = Storage.getTodayChallenge();
    let progressDefi = Storage.getChallengeProgress(user.id, today);

    const backendUp = window.Api ? await Api.ping() : false;
    if (backendUp) {
        try {
            const apiDefi = await Api.todayChallenge();
            defi = { date: apiDefi.date, niveau: apiDefi.niveau, jeux: apiDefi.jeux, recompensePartielle: apiDefi.recompensePartielle, recompenseBonus: apiDefi.recompenseBonus };
            const apiProgress = await Api.getChallengeProgress();
            progressDefi = { ...apiProgress.progress, bonusAttribue: apiProgress.bonusAttribue };
        } catch (e) { /* repli local déjà chargé ci-dessus */ }
    }

    const defiLevelConfig = Utils.getLevelConfig(defi.niveau);

    document.getElementById('daily-challenge').innerHTML = `
        <div style="width:100%">
            <p class="daily-challenge__title">
                ${Utils.icon('flame')} Fanamby isan'andro — Haavo ${defi.niveau} (${Utils.palierLabel(defiLevelConfig.palier)})
            </p>
            <p class="daily-challenge__mission">Vitao ny lalao telo androany mba hahazoana ny valisoa fanampiny (+${defi.recompenseBonus} isa).</p>
            <div class="daily-challenge__games">
                ${defi.jeux.map(j => {
                    const p = progressDefi[j];
                    const vita = p.statut === 'vita';
                    return `
                        <a class="daily-challenge__game ${vita ? 'done' : ''}" href="../jeux/${j}/index.html?niveau=${defi.niveau}&defi=1">
                            ${Utils.icon(vita ? 'check' : JEU_ICONS[j])}
                            <span>${GAMES_LABEL[j]}</span>
                        </a>`;
                }).join('')}
            </div>
            ${progressDefi.bonusAttribue ? `<p class="daily-challenge__bonus">${Utils.icon('star')} Valisoa fanampiny voaray !</p>` : ''}
        </div>
    `;
}
renderDailyChallenge();

/* ---- Cartes de jeux ---- */
const GAMES = [
    {
        id: 'mot_cache', nom: 'Mot Nafenina',
        desc: 'Tadiavo ilay teny Malagasy miafina alohan\'ny hifaranan\'ny fotoana.',
        fonctionnel: true,
        fitsipika: [
            "Mitadiava ilay teny Malagasy miafina.",
            "Mampiasà ireo litera na famantarana omena.",
            "Mila mamaly alohan'ny hifaranan'ny fotoana.",
            "Mahazo isa bebe kokoa ianao raha mamaly haingana.",
            "Mihena ny isa raha mampiasa fanampiana.",
            "Tapitra ny lalao rehefa hita ilay teny na lany ny fotoana."
        ]
    },
    {
        id: 'devinette', nom: 'Devinette',
        desc: 'Valio ny fanontaniana amin\'ny alalan\'ny safidy atolotra.',
        fonctionnel: true,
        fitsipika: [
            "Vakio tsara ny fanontaniana.",
            "Mitadiava ny valiny marina.",
            "Afaka misafidy amin'ireo valiny atolotra ianao.",
            "Mahazo XP sy isa ianao rehefa marina ny valiny.",
            "Ny haavo Sarotra dia manome isa bebe kokoa."
        ]
    },
    {
        id: 'scrabble', nom: 'Scrabble',
        desc: 'Mamoròna teny Malagasy amin\'ireo litera omena.',
        fonctionnel: true,
        fitsipika: [
            "Mamoròna teny Malagasy amin'ireo litera omena.",
            "Tsy maintsy teny manan-kery ilay teny.",
            "Ny litera tsirairay dia manana isa.",
            "Ny teny lava sy sarotra dia afaka manome isa bebe kokoa.",
            "Tapitra ny fihodinana rehefa lany ny fotoana."
        ]
    },
    { id: 'pendu', nom: 'Pendu', desc: 'Tezao ilay teny alohan\'ny hahatapitra ny fihodinana.', fonctionnel: false, fitsipika: [] },
    { id: 'wordle', nom: 'Wordle', desc: 'Tadiavo ilay teny ao anatin\'ny fihodinana voafetra.', fonctionnel: false, fitsipika: [] }
].slice(0, 3); // Section d'accueil : maximum 3 jeux mis en avant (cf. cahier des charges §6)

const grid = document.getElementById('games-grid');
grid.innerHTML = GAMES.map(g => `
    <div class="game-card">
        <div class="game-card__icon">${Utils.icon('game')}</div>
        <h3 class="game-card__title">${g.nom}</h3>
        <p class="game-card__desc">${g.desc}</p>
        <span class="game-card__status ${g.fonctionnel ? '' : 'status-soon'}">
            ${g.fonctionnel ? 'Azo alaina' : 'Ho avy tsy ho ela'}
        </span>
        <div class="game-card__actions">
            <button class="btn btn-outline btn-sm" data-rules="${g.id}" ${g.fonctionnel ? '' : 'disabled'}>Hijery ny fitsipika</button>
            <button class="btn btn-sm" data-start="${g.id}" ${g.fonctionnel ? '' : 'disabled'}>Hanomboka</button>
        </div>
    </div>
`).join('');

/* ---- Fenêtre de règles avant une partie (obligatoire, cf. cahier des charges §10) ---- */
const modal = document.getElementById('rules-modal');
let jeuSelectionne = null;

function openRulesModal(gameId) {
    const g = GAMES.find(x => x.id === gameId);
    if (!g) return;
    jeuSelectionne = g;
    document.getElementById('rules-title').textContent = g.nom;
    document.getElementById('rules-desc').textContent = g.desc;
    document.getElementById('rules-list').innerHTML = g.fitsipika.map(r => `<li>${r}</li>`).join('');
    document.getElementById('rules-time').innerHTML = `${Utils.icon('clock')} Miovaova arakaraka ny haavo`;
    document.getElementById('rules-points').innerHTML = `${Utils.icon('star')} Isa arakaraka ny haavo`;
    modal.classList.add('open');
}

document.querySelectorAll('[data-rules]').forEach(btn => btn.addEventListener('click', () => openRulesModal(btn.dataset.rules)));
document.querySelectorAll('[data-start]').forEach(btn => btn.addEventListener('click', () => openRulesModal(btn.dataset.start)));

document.getElementById('rules-close').addEventListener('click', () => modal.classList.remove('open'));
document.getElementById('rules-back').addEventListener('click', () => modal.classList.remove('open'));
modal.addEventListener('click', (e) => { if (e.target === modal) modal.classList.remove('open'); });

document.getElementById('rules-start').addEventListener('click', () => {
    if (!jeuSelectionne) return;
    window.location.href = `../jeux/${jeuSelectionne.id}/index.html`;
});
