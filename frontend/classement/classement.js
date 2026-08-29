/* ===================================================================
   CLASSEMENT.JS
   =================================================================== */

Auth.requireAuth();
Navigation.renderSidebar('classement');
const currentUser = Storage.getCurrentUser();

const ONGLETS = [
    { id: 'global', label: 'Rehetra' },
    { id: 'mot_cache', label: 'Mot Nafenina' },
    { id: 'devinette', label: 'Devinette' },
    { id: 'scrabble', label: 'Scrabble' }
];

let ongletActif = 'global';

function renderTabs() {
    document.getElementById('tabs').innerHTML = ONGLETS.map(o =>
        `<button class="tab-btn ${o.id === ongletActif ? 'active' : ''}" data-tab="${o.id}">${o.label}</button>`
    ).join('');
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            ongletActif = btn.dataset.tab;
            renderTabs();
            renderList();
        });
    });
}

function medalClass(rank) {
    if (rank === 1) return 'gold';
    if (rank === 2) return 'silver';
    if (rank === 3) return 'bronze';
    return '';
}

async function renderList() {
    const container = document.getElementById('ranking-list');
    let data;

    const backendUp = window.Api ? await Api.ping() : false;
    if (backendUp) {
        try {
            const rows = ongletActif === 'global'
                ? await Api.globalLeaderboard()
                : await Api.gameLeaderboard(ongletActif);
            data = ongletActif === 'global'
                ? rows.map(l => ({ userId: l.userId, username: l.username, value: l.xp, label: 'XP' }))
                : rows.map(l => ({ userId: l.userId, username: l.username, value: l.points, label: 'isa' }));
        } catch (e) {
            data = null; // repli local ci-dessous
        }
    }

    if (!data) {
        data = ongletActif === 'global'
            ? Storage.getGlobalLeaderboard().map(l => ({ userId: l.userId, username: l.username, value: l.xp, label: 'XP' }))
            : Storage.getGameLeaderboard(ongletActif).map(l => ({ userId: l.userId, username: l.username, value: l.points, label: 'isa' }));
    }

    if (!data.length) {
        container.innerHTML = `
            <div class="empty-state">
                ${Utils.icon('trophy')}
                <p>Mbola tsy misy laharana eto. Ianao no ho voalohany raha milalao izao !</p>
            </div>`;
        return;
    }

    container.innerHTML = data.map((row, i) => {
        const rank = i + 1;
        const isMe = row.userId === currentUser.id;
        return `
            <div class="ranking-row ${isMe ? 'is-me' : ''}">
                <div class="ranking-row__rank ${medalClass(rank)}">${rank}</div>
                <div class="ranking-row__name">${row.username}${isMe ? '<span class="you-tag">(Ianao)</span>' : ''}</div>
                <div class="ranking-row__value">${row.value} ${row.label}</div>
            </div>`;
    }).join('');
}

renderTabs();
renderList();
