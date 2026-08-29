/**
 * services/levelService.js
 * Reproduit EXACTEMENT la formule de frontend/js/utils.js -> getLevelConfig
 * (6 paliers, 2 sous-parties par grande difficulté), pour que le serveur
 * puisse vérifier qu'un score envoyé par un client est cohérent avec le
 * niveau annoncé (le client ne peut pas juste inventer des points).
 */
const MAX_NIVEAU = 300;

function getLevelConfig(niveau) {
    const n = Math.min(Math.max(niveau, 1), MAX_NIVEAU);
    const progress = (n - 1) / (MAX_NIVEAU - 1);

    let palier, longueurMin, longueurMax, categorie;
    if (n <= 50) { palier = 'tres_facile'; longueurMin = 3; longueurMax = 4; categorie = 'moderne'; }
    else if (n <= 100) { palier = 'facile'; longueurMin = 5; longueurMax = 7; categorie = 'moderne'; }
    else if (n <= 150) { palier = 'intermediaire'; longueurMin = 8; longueurMax = 9; categorie = 'moderne'; }
    else if (n <= 200) { palier = 'pseudo_difficile'; longueurMin = 8; longueurMax = 9; categorie = 'moderne'; }
    else if (n <= 250) { palier = 'difficile'; longueurMin = 5; longueurMax = 16; categorie = 'ancien'; }
    else { palier = 'infernal'; longueurMin = 5; longueurMax = 18; categorie = 'archaique'; }

    const tempsBase = 90 - Math.pow(progress, 1.4) * 78;
    const tempsSecondes = Math.max(12, Math.round(tempsBase));

    const indicesAutorises = Math.max(0, 3 - Math.floor(progress * 4));
    const multiplicateurPoints = Math.round((1 + progress * 4) * 10) / 10;
    const xpBase = Math.round(10 + progress * 90);
    const nbDistracteurs = Math.min(6, Math.floor(progress * 8));

    return { niveau: n, palier, categorie, longueurMin, longueurMax, tempsSecondes, indicesAutorises, multiplicateurPoints, xpBase, nbDistracteurs };
}

/**
 * Vérifie qu'un score soumis reste dans une fourchette plausible pour le
 * niveau annoncé (protection basique anti-triche, pas un anti-cheat complet).
 */
function isScorePlausible(niveau, points) {
    const cfg = getLevelConfig(niveau);
    const plafond = Math.round(100 * cfg.multiplicateurPoints * 1.2) + 50; // marge
    return points >= 0 && points <= plafond;
}

module.exports = { MAX_NIVEAU, getLevelConfig, isScorePlausible };
