/* ===================================================================
   LANDING.JS
   =================================================================== */

document.getElementById('brand-icon').innerHTML = Utils.icon('game');

/* Les boutons de la page d'accueil gardent toujours leur destination fixe :
   - "Andao hilalao" / "Hisoratra anarana" -> toujours la page de connexion
   - "Ahoana no fiasany ?" -> toujours l'explication du site (#ahoana)
   Aucune redirection automatique vers le dashboard, même si un compte est
   déjà connecté (la page de connexion elle-même gère ce cas si besoin). */

/* ---- Tuiles de lettres flottantes (décor du hero) ---- */
const LETTRES = ['T', 'E', 'N', 'Y', 'M', 'G'];
document.getElementById('hero-visual').innerHTML = LETTRES.map(l => `<div class="letter-tile">${l}</div>`).join('');

/* ---- Fonctionnalités ---- */
const FEATURES = [
    { icon: 'game', title: 'Dimy lalao samihafa', desc: "Mot Nafenina, Devinette, Scrabble efa azo alaina — Pendu sy Wordle ho avy tsy ho ela." },
    { icon: 'trophy', title: 'Isa, XP ary haavo', desc: "300 haavo isaky ny lalao, mihamafy hatrany, miaraka amin'ny fikajiana XP sy isa manokana." },
    { icon: 'flame', title: "Fanamby isan'andro", desc: "Fanamby iray isan'andro, mitovy ho an'ny mpilalao rehetra, mampiakatra hatrany ny haavo." },
    { icon: 'message', title: 'Laharana sy hevitra', desc: "Fampitahana amin'ny mpilalao hafa, ary fizarana hevitra momba ny lalao tsirairay." },
    { icon: 'sun', title: 'Endrika mazava/maizina', desc: "Mifidiana ny endrika mety aminao, tahiry ho an'ny fitsidihana manaraka." },
    { icon: 'check', title: "Malalaka amin'ny finday", desc: "Mety amin'ny finday, tablette, ary solosaina — tsy misy fisavarambarana." }
];
document.getElementById('feature-grid').innerHTML = FEATURES.map(f => `
    <div class="feature-card">
        <div class="feature-card__icon">${Utils.icon(f.icon)}</div>
        <h3>${f.title}</h3>
        <p>${f.desc}</p>
    </div>
`).join('');

/* ---- Aperçu des jeux ---- */
const GAMES_PREVIEW = [
    { id: 'mot_cache', nom: 'litera Nafenina', desc: "Tadiavo ilay teny Malagasy miafina alohan'ny hifaranan'ny fotoana.", fonctionnel: true },
    { id: 'devinette', nom: 'Akamatatra', desc: "Valio ny fanontaniana amin'ny alalan'ny safidy atolotra.", fonctionnel: true },
    { id: 'scrabble', nom: 'Scrabble', desc: "Mamoròna teny Malagasy amin'ireo litera omena.", fonctionnel: true },
    { id: 'pendu', nom: 'Pendu', desc: "Tezao ilay teny alohan'ny hahatapitra ny fihodinana.", fonctionnel: false },
    { id: 'wordle', nom: 'Wordle', desc: "Tadiavo ilay teny ao anatin'ny fihodinana voafetra.", fonctionnel: false }
];
document.getElementById('games-preview-grid').innerHTML = GAMES_PREVIEW.map(g => `
    <div class="game-card">
        <div class="game-card__icon">${Utils.icon('game')}</div>
        <h3 class="game-card__title">${g.nom}</h3>
        <p class="game-card__desc">${g.desc}</p>
        <span class="game-card__status ${g.fonctionnel ? '' : 'status-soon'}">
            ${g.fonctionnel ? 'Azo alaina' : 'Ho avy tsy ho ela'}
        </span>
    </div>
`).join('');

/* ---- Étapes ---- */
const STEPS = [
    { title: 'Misoratra anarana', desc: "Amin'ny mailaka, na amin'ny Google/Facebook, mandritra ny segondra vitsivitsy monja." },
    { title: 'Misafidy lalao', desc: "Vakio aloha ny fitsipika, dia misafidiana ny haavo mifanaraka amin'ny fahaizanao." },
    { title: 'Miakatra haavo', desc: "Mahazo isa sy XP, miakatra ny laharana, ary manao ny fanamby isan'andro." }
];
document.getElementById('steps-row').innerHTML = STEPS.map((s, i) => `
    <div class="step-card">
        <div class="step-card__number">${i + 1}</div>
        <h3>${s.title}</h3>
        <p>${s.desc}</p>
    </div>
`).join('');