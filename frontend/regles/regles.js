/* ===================================================================
   REGLES.JS
   =================================================================== */

Navigation.renderSidebar('regles');

const GAMES = [
    {
        id: 'mot_cache', nom: 'Mot Nafenina', fonctionnel: true,
        desc: "Tadiavo ilay teny Malagasy miafina alohan'ny hifaranan'ny fotoana.",
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
        id: 'devinette', nom: 'Devinette', fonctionnel: true,
        desc: "Valio ny fanontaniana amin'ny alalan'ny safidy atolotra.",
        fitsipika: [
            "Vakio tsara ny fanontaniana.",
            "Mitadiava ny valiny marina.",
            "Afaka misafidy amin'ireo valiny atolotra ianao.",
            "Mahazo XP sy isa ianao rehefa marina ny valiny.",
            "Ny haavo Sarotra dia manome isa bebe kokoa."
        ]
    },
    {
        id: 'scrabble', nom: 'Scrabble', fonctionnel: true,
        desc: "Mamoròna teny Malagasy amin'ireo litera omena.",
        fitsipika: [
            "Mamoròna teny Malagasy amin'ireo litera omena.",
            "Tsy maintsy teny manan-kery ilay teny.",
            "Ny litera tsirairay dia manana isa.",
            "Ny teny lava sy sarotra dia afaka manome isa bebe kokoa.",
            "Tapitra ny fihodinana rehefa lany ny fotoana."
        ]
    },
    {
        id: 'pendu', nom: 'Pendu', fonctionnel: false,
        desc: "Tezao ilay teny alohan'ny hahatapitra ny fihodinana.",
        fitsipika: [
            "Tsotra: mitadiava ny litera ao anaty teny miafina.",
            "Litera tsy marina = fizarana amin'ny sarin'ilay olona voahantona.",
            "Mbola an-dàlam-panorenana — ho avy tsy ho ela."
        ]
    },
    {
        id: 'wordle', nom: 'Wordle', fonctionnel: false,
        desc: "Tadiavo ilay teny ao anatin'ny fihodinana voafetra.",
        fitsipika: [
            "Soraty ny teny heverinao, dia haneho loko ny valiny (marina, misy fa tsy eo, tsy misy).",
            "Fihodinana voafetra ihany no azo atao.",
            "Mbola an-dàlam-panorenana — ho avy tsy ho ela."
        ]
    }
];

const container = document.getElementById('rules-accordion');
container.innerHTML = GAMES.map(g => `
    <div class="rules-item" id="rules-${g.id}">
        <div class="rules-item__head" data-toggle="${g.id}">
            <div class="rules-item__icon">${Utils.icon('game')}</div>
            <div class="rules-item__title">
                <h3>${g.nom}</h3>
                <p>${g.desc}</p>
            </div>
            <span class="badge-diff ${g.fonctionnel ? 'mora' : 'antonony'}">
                ${g.fonctionnel ? 'Azo alaina' : 'Ho avy tsy ho ela'}
            </span>
            <span class="rules-item__chevron">${Utils.icon('chevron')}</span>
        </div>
        <div class="rules-item__body">
            <div class="rules-item__body-inner">
                <ol>${g.fitsipika.map(r => `<li>${r}</li>`).join('')}</ol>
                <a class="btn btn-sm" href="../jeux/${g.id}/index.html">
                    ${g.fonctionnel ? 'Hanomboka' : 'Hijery'}
                </a>
            </div>
        </div>
    </div>
`).join('');

document.querySelectorAll('[data-toggle]').forEach(head => {
    head.addEventListener('click', () => {
        document.getElementById(`rules-${head.dataset.toggle}`).classList.toggle('open');
    });
});

/* Le premier jeu est ouvert par défaut pour montrer le fonctionnement */
document.getElementById(`rules-${GAMES[0].id}`).classList.add('open');
