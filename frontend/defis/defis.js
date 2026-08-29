/* ===================================================================
   DEFIS.JS
   Le défi quotidien mélange les 3 jeux fonctionnels au MÊME niveau :
   il faut réussir les 3 pour obtenir le bonus. Le niveau progresse
   chaque jour depuis 1. Essaie d'abord le backend (progression visible
   sur tous les appareils), puis se replie sur le stockage local.
   =================================================================== */

Auth.requireAuth();
Navigation.renderSidebar('defis');
const currentUser = Storage.getCurrentUser();

const GAMES_LABEL = { mot_cache: 'Mot Nafenina', devinette: 'Devinette', scrabble: 'Scrabble' };
const GAMES_ICON = { mot_cache: 'game', devinette: 'message', scrabble: 'game' };

async function render() {
    const today = new Date().toISOString().slice(0, 10);
    let defi = Storage.getTodayChallenge();
    let progress = Storage.getChallengeProgress(currentUser.id, today);

    const backendUp = window.Api ? await Api.ping() : false;
    if (backendUp) {
        try {
            const apiDefi = await Api.todayChallenge();
            defi = { date: apiDefi.date, niveau: apiDefi.niveau, jeux: apiDefi.jeux, recompensePartielle: apiDefi.recompensePartielle, recompenseBonus: apiDefi.recompenseBonus };
            const apiProgress = await Api.getChallengeProgress();
            progress = { ...apiProgress.progress, bonusAttribue: apiProgress.bonusAttribue };
        } catch (e) { /* repli local déjà chargé ci-dessus */ }
    }

    const levelConfig = Utils.getLevelConfig(defi.niveau);

    const hero = document.getElementById('challenge-hero');
    hero.className = `challenge-hero ${progress.bonusAttribue ? 'done' : ''}`;
    hero.innerHTML = `
        <div class="challenge-hero__label">${Utils.icon('flame')} Fanamby anio — ${Utils.palierLabel(levelConfig.palier)}</div>
        <h2 class="challenge-hero__game">Haavo ${defi.niveau} / ${Utils.MAX_NIVEAU}</h2>
        <p class="challenge-hero__mission">
            Vitao ny lalao TELO androany, amin'ny haavo mitovy, mba hahazoana ny valisoa fanampiny.
            Ny haavo dia miakatra isan'andro manomboka amin'ny 1 — koa mihamafy hatrany, tsinjo azy avy any aloha !
        </p>
        <div class="challenge-hero__meta">
            <span class="challenge-hero__meta-item">${Utils.icon('clock')} ${levelConfig.tempsSecondes}s isaky ny lalao</span>
            <span class="challenge-hero__meta-item">${Utils.icon('star')} +${defi.recompensePartielle} isa isaky ny lalao vita</span>
            <span class="challenge-hero__meta-item">${Utils.icon('trophy')} +${defi.recompenseBonus} isa raha vita avokoa ny 3</span>
        </div>
        ${progress.bonusAttribue ? `<p style="font-weight:700; display:flex; align-items:center; gap:6px;">${Utils.icon('check')} Valisoa fanampiny voaray androany !</p>` : ''}
    `;

    document.getElementById('challenge-games').innerHTML = defi.jeux.map(j => {
        const p = progress[j];
        const vita = p.statut === 'vita';
        return `
            <div class="game-card">
                <div class="game-card__icon">${Utils.icon(GAMES_ICON[j])}</div>
                <h3 class="game-card__title">${GAMES_LABEL[j]}</h3>
                <span class="game-card__status ${vita ? '' : 'status-soon'}">
                    ${vita ? `Vita — ${p.score} isa` : 'Mbola tsy vita'}
                </span>
                <div class="game-card__actions">
                    <a class="btn ${vita ? 'btn-outline' : ''} btn-sm" href="../jeux/${j}/index.html?niveau=${defi.niveau}&defi=1">
                        ${vita ? 'Avereno' : 'Hanao ny fanamby'}
                    </a>
                </div>
            </div>
        `;
    }).join('');

    renderHistory();
}

/* ---- Historique local des jours précédents ---- */
function renderHistory() {
    const all = Storage._read('tm_challenge_progress', []).filter(p => p.userId === currentUser.id);
    const container = document.getElementById('history-list');

    if (!all.length) {
        container.innerHTML = `
            <div class="empty-state">
                ${Utils.icon('flame')}
                <p>Mbola tsy nanao fanamby ianao. Andao hanomboka anio !</p>
            </div>`;
        return;
    }

    const sorted = all.sort((a, b) => b.date.localeCompare(a.date));
    container.innerHTML = sorted.map(p => {
        const nbVita = ['mot_cache', 'devinette', 'scrabble'].filter(j => p.progress && p.progress[j] && p.progress[j].statut === 'vita').length;
        return `
            <div class="ranking-row">
                <div class="ranking-row__rank">${p.bonusAttribue ? Utils.icon('check') : nbVita}</div>
                <div class="ranking-row__name">${p.date}</div>
                <div class="ranking-row__value">${nbVita} / 3 lalao vita</div>
            </div>
        `;
    }).join('');
}

render();
