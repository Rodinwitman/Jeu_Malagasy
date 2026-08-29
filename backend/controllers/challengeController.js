/**
 * controllers/challengeController.js
 *
 * Le défi quotidien est maintenant le MÊME niveau, mélangé sur les 3 jeux
 * fonctionnels (mot_cache, devinette, scrabble) : le joueur doit réussir
 * les 3 pour obtenir le bonus. Le niveau progresse chaque jour à partir
 * du niveau 1 (au lieu d'être toujours très difficile) et boucle après
 * le niveau 300.
 */
const db = require('../config/database');
const { getLevelConfig, MAX_NIVEAU } = require('../services/levelService');

const JEUX_DEFI = ['mot_cache', 'devinette', 'scrabble'];
const EPOCH = Date.UTC(2026, 7, 16); // 16 août 2026 = jour 0 = niveau 1 (date de lancement du défi progressif)

function computeNiveauDuJour(dateISO) {
    const today = new Date(dateISO + 'T00:00:00Z').getTime();
    const dayIndex = Math.floor((today - EPOCH) / 86400000);
    const wrapped = ((dayIndex % MAX_NIVEAU) + MAX_NIVEAU) % MAX_NIVEAU;
    return wrapped + 1; // toujours entre 1 et 300
}

exports.getToday = (req, res) => {
    const today = new Date().toISOString().slice(0, 10);
    const niveau = computeNiveauDuJour(today);
    res.json({
        date: today,
        niveau,
        jeux: JEUX_DEFI,
        recompensePartielle: 30,
        recompenseBonus: 100,
        levelConfig: getLevelConfig(niveau)
    });
};

exports.getProgress = (req, res) => {
    const userId = req.userId;
    const today = new Date().toISOString().slice(0, 10);
    const rows = db.prepare('SELECT jeu_id as jeu, statut, score FROM defis_utilisateur WHERE user_id = ? AND date = ?').all(userId, today);

    const progress = {};
    JEUX_DEFI.forEach(j => { progress[j] = { statut: 'tsy_natao', score: 0 }; });
    rows.forEach(r => { progress[r.jeu] = { statut: r.statut, score: r.score }; });

    const bonus = db.prepare('SELECT 1 FROM defis_bonus WHERE user_id = ? AND date = ?').get(userId, today);
    res.json({ progress, bonusAttribue: !!bonus });
};

/**
 * IMPORTANT : la progression et les récompenses du défi quotidien sont
 * volontairement TOTALEMENT SÉPARÉES du profil général du joueur (table
 * `profils_joueur`, utilisée par le classement et le tableau de bord).
 * Le bonus de défi n'alimente que `defis_stats`, jamais `profils_joueur`.
 */
exports.updateProgress = (req, res) => {
    const userId = req.userId;
    const { date, jeu, statut, score } = req.body;
    if (!JEUX_DEFI.includes(jeu)) return res.status(400).json({ message: 'Jeu tsy fantatra.' });

    db.prepare(`
        INSERT INTO defis_utilisateur (user_id, date, jeu_id, statut, score)
        VALUES (?, ?, ?, ?, ?)
        ON CONFLICT(user_id, date, jeu_id) DO UPDATE SET statut=excluded.statut, score=excluded.score
    `).run(userId, date, jeu, statut, score || 0);

    // Vérifie si les 3 jeux sont maintenant réussis -> bonus (une seule fois)
    const rows = db.prepare('SELECT jeu_id, statut FROM defis_utilisateur WHERE user_id = ? AND date = ?').all(userId, date);
    const doneSet = new Set(rows.filter(r => r.statut === 'vita').map(r => r.jeu_id));
    const toutesVita = JEUX_DEFI.every(j => doneSet.has(j));

    let bonusAttribue = false;
    if (toutesVita) {
        const already = db.prepare('SELECT 1 FROM defis_bonus WHERE user_id = ? AND date = ?').get(userId, date);
        if (!already) {
            db.prepare('INSERT INTO defis_bonus (user_id, date) VALUES (?, ?)').run(userId, date);
            db.prepare(`
                INSERT INTO defis_stats (user_id, xp_defi, points_defi, defis_reussis)
                VALUES (?, 50, 100, 1)
                ON CONFLICT(user_id) DO UPDATE SET
                    xp_defi = xp_defi + 50,
                    points_defi = points_defi + 100,
                    defis_reussis = defis_reussis + 1
            `).run(userId);
            bonusAttribue = true;
        }
    }

    res.json({ message: 'Voaraikitra.', toutesVita, bonusAttribue });
};

/**
 * Stats CUMULÉES des défis, totalement séparées de `profils_joueur`
 * (voir la note au-dessus de `updateProgress`).
 */
exports.getStats = (req, res) => {
    const row = db.prepare(`
        SELECT xp_defi as xpDefi, points_defi as pointsDefi, defis_reussis as defisReussis
        FROM defis_stats WHERE user_id = ?
    `).get(req.userId);
    res.json(row || { xpDefi: 0, pointsDefi: 0, defisReussis: 0 });
};
