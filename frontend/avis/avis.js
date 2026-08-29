/* ===================================================================
   AVIS.JS
   Essaie d'abord le backend (avis visibles par tous les appareils),
   puis se replie sur le stockage local si le backend est indisponible.
   =================================================================== */

Auth.requireAuth();
Navigation.renderSidebar('avis');
const currentUser = Storage.getCurrentUser();

const JEUX = [
    { id: 'mot_cache', label: 'Mot Nafenina' },
    { id: 'devinette', label: 'Devinette' },
    { id: 'scrabble', label: 'Scrabble' }
];

let jeuActif = 'mot_cache';
let noteChoisie = 0;
let dernieresReviews = [];

function renderTabs() {
    document.getElementById('tabs').innerHTML = JEUX.map(j =>
        `<button class="tab-btn ${j.id === jeuActif ? 'active' : ''}" data-tab="${j.id}">${j.label}</button>`
    ).join('');
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            jeuActif = btn.dataset.tab;
            renderTabs();
            renderAll();
        });
    });
}

function renderStats(moyenne, nombre) {
    document.getElementById('review-stats').innerHTML = `
        <span class="review-stats__avg">${moyenne || '—'}</span>
        <div>
            ${Utils.starsHTML(moyenne, 5)}
            <p class="review-stats__count">${nombre} hevitra</p>
        </div>
    `;
}

function renderStarPicker() {
    const existant = dernieresReviews.find(r => r.userId === currentUser.id);
    noteChoisie = existant ? existant.note : 0;
    document.getElementById('review-comment').value = existant ? (existant.commentaire || '') : '';
    drawStarPicker();
}

function drawStarPicker() {
    const picker = document.getElementById('star-picker');
    picker.innerHTML = [1, 2, 3, 4, 5].map(n => `
        <button type="button" class="${n <= noteChoisie ? 'active' : ''}" data-n="${n}">
            ${Utils.icon(n <= noteChoisie ? 'star' : 'star-outline')}
        </button>
    `).join('');
    picker.querySelectorAll('button').forEach(btn => {
        btn.addEventListener('click', () => {
            noteChoisie = parseInt(btn.dataset.n, 10);
            drawStarPicker();
        });
    });
}

function renderReviewList() {
    const container = document.getElementById('review-list');

    if (!dernieresReviews.length) {
        container.innerHTML = `
            <div class="empty-state">
                ${Utils.icon('message')}
                <p>Mbola tsy misy hevitra momba ity jeux ity. Ianao no voalohany hanome hevitra !</p>
            </div>`;
        return;
    }

    container.innerHTML = dernieresReviews.map(r => `
        <div class="review-card">
            <div class="review-card__top">
                <span class="review-card__user">${r.username || 'Mpilalao'}</span>
                ${Utils.starsHTML(r.note, 5)}
            </div>
            ${r.commentaire ? `<p class="review-card__comment">${r.commentaire}</p>` : ''}
            <p class="review-card__date">${new Date(r.date).toLocaleDateString('fr-FR')}</p>
        </div>
    `).join('');
}

async function renderAll() {
    let moyenne = 0, nombre = 0;
    dernieresReviews = [];

    const backendUp = window.Api ? await Api.ping() : false;
    if (backendUp) {
        try {
            const result = await Api.getReviews(jeuActif);
            dernieresReviews = result.reviews.sort((a, b) => b.date.localeCompare(a.date));
            moyenne = result.moyenne;
            nombre = result.nombre;
        } catch (e) { /* repli local ci-dessous */ }
    }

    if (!nombre && !dernieresReviews.length) {
        dernieresReviews = Storage.getReviews(jeuActif).sort((a, b) => b.date.localeCompare(a.date));
        const stats = Storage.getReviewStats(jeuActif);
        moyenne = stats.moyenne;
        nombre = stats.nombre;
    }

    renderStats(moyenne, nombre);
    renderStarPicker();
    renderReviewList();
}

document.getElementById('btn-submit-review').addEventListener('click', async () => {
    if (!noteChoisie) { Utils.toast('Misafidiana kintana iray farafahakeliny.', 'error'); return; }
    const commentaire = document.getElementById('review-comment').value.trim();

    // Toujours écrire en local (fonctionne même sans backend, et donne un retour instantané).
    const all = Storage._read('tm_reviews', []);
    const filtered = all.filter(r => !(r.userId === currentUser.id && r.jeu === jeuActif));
    filtered.push({
        id: 'r_' + Date.now(),
        userId: currentUser.id,
        username: currentUser.username,
        jeu: jeuActif,
        note: noteChoisie,
        commentaire,
        date: new Date().toISOString()
    });
    Storage._write('tm_reviews', filtered);

    // En plus, si le backend est disponible, on y écrit aussi (visible par tout le monde).
    if (window.Api) {
        try { await Api.addReview({ jeu: jeuActif, note: noteChoisie, commentaire }); } catch (e) { /* déjà sauvegardé en local */ }
    }

    Utils.toast('Voaraikitra ny hevitrao, misaotra !', 'success');
    renderAll();
});

renderTabs();
renderAll();
