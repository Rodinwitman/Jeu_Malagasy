/**
 * controllers/leaderboardController.js
 */
const db = require('../config/database');

exports.getGlobal = (req, res) => {
    const rows = db.prepare(`
        SELECT p.user_id as userId, u.username, p.xp, p.niveau_global as niveauGlobal
        FROM profils_joueur p
        JOIN users u ON u.id = p.user_id
        WHERE p.xp > 0
        ORDER BY p.xp DESC
        LIMIT 100
    `).all();
    res.json(rows);
};

exports.getByGame = (req, res) => {
    const jeu = req.params.jeu;
    // Meilleur score par utilisateur pour ce jeu
    const rows = db.prepare(`
        SELECT s.user_id as userId, u.username, MAX(s.points) as points
        FROM scores s
        JOIN users u ON u.id = s.user_id
        WHERE s.jeu_id = ?
        GROUP BY s.user_id
        ORDER BY points DESC
        LIMIT 100
    `).all(jeu);
    res.json(rows);
};
