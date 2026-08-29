/* ===================================================================
   PARAMETRES.JS
   =================================================================== */

Auth.requireAuth();
Navigation.renderSidebar('parametres');
const currentUser = Storage.getCurrentUser();

/* ---- Endrika (thème) ---- */
function renderThemeOptions() {
    const current = document.documentElement.getAttribute('data-theme') || 'light';
    document.getElementById('icon-light').innerHTML = Utils.icon('sun');
    document.getElementById('icon-dark').innerHTML = Utils.icon('moon');
    document.getElementById('opt-light').classList.toggle('active', current === 'light');
    document.getElementById('opt-dark').classList.toggle('active', current === 'dark');
}
document.getElementById('opt-light').addEventListener('click', () => { Theme.apply('light'); renderThemeOptions(); });
document.getElementById('opt-dark').addEventListener('click', () => { Theme.apply('dark'); renderThemeOptions(); });
renderThemeOptions();

/* ---- Feo (accès rapide, la source de vérité reste dans chaque jeu) ---- */
const JEUX_SON = [
    { id: 'mot_cache', label: 'Mot Nafenina' },
    { id: 'devinette', label: 'Devinette' },
    { id: 'scrabble', label: 'Scrabble' }
];

function isSoundOn(jeuId) {
    return localStorage.getItem(`tm_son_${jeuId}`) !== 'off';
}
function toggleSound(jeuId) {
    localStorage.setItem(`tm_son_${jeuId}`, isSoundOn(jeuId) ? 'off' : 'on');
    renderSoundList();
}
function renderSoundList() {
    document.getElementById('sound-list').innerHTML = JEUX_SON.map(j => `
        <div class="sound-row">
            <span class="sound-row__name">${j.label}</span>
            <button class="icon-toggle" data-jeu="${j.id}">
                ${Utils.icon(isSoundOn(j.id) ? 'volume-on' : 'volume-off')}
            </button>
        </div>
    `).join('');
    document.querySelectorAll('#sound-list button').forEach(btn => {
        btn.addEventListener('click', () => toggleSound(btn.dataset.jeu));
    });
}
renderSoundList();

/* ---- Kaonty ---- */
const PROVIDER_LABEL = { local: 'Kaonty mahaleo tena', google: 'Google', facebook: 'Facebook' };
document.getElementById('account-info').innerHTML = `
    <div class="account-info__row">
        <span class="account-info__label">Anaran'ny mpampiasa</span>
        <span class="account-info__value">${currentUser.username}</span>
    </div>
    <div class="account-info__row">
        <span class="account-info__label">Mailaka</span>
        <span class="account-info__value">${currentUser.email || '—'}</span>
    </div>
    <div class="account-info__row">
        <span class="account-info__label">Fomba fidirana</span>
        <span class="account-info__value">${PROVIDER_LABEL[currentUser.provider] || currentUser.provider}</span>
    </div>
`;
document.getElementById('btn-logout-settings').addEventListener('click', () => Auth.logout());

/* ---- Réinitialisation ---- */
document.getElementById('btn-reset').addEventListener('click', () => {
    const ok = confirm("Hamafa ny angona rehetra ianao (isa, XP, laharana, hevitra, fanamby). Tsy azo averina io hetsika io. Tohizana ve ?");
    if (!ok) return;
    Storage.resetAll();
    Utils.toast('Voafafa ny angona rehetra.', 'success');
    setTimeout(() => window.location.href = '../page_connexion/index.html', 800);
});
