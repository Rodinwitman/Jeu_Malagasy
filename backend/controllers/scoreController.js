/**
 * controllers/scoreController.js
 */
const crypto = require('crypto');
const db = require('../config/database');
const { isScorePlausible } = require('../services/levelService');

exports.addScore = (req, res) => {
    const userId = req.userId;
    const { jeu, niveau, points, etoiles } = req.body;

    if (!jeu || !niveau || points == null) {
        return res.status(400).json({ message: 'Tsy feno ny angona nalefa.' });
    }
    if (!isScorePlausible(niveau, points)) {
        return res.status(422).json({ message: "Toa tsy mifanaraka amin'ny haavo ilay isa nalefa." });
    }

    const id = `s_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`;
    db.prepare(`
        INSERT INTO scores (id, user_id, jeu_id, niveau, points, etoiles)
        VALUES (?, ?, ?, ?, ?, ?)
    `).run(id, userId, jeu, niveau, points, etoiles || 0);

    // Met à jour le profil (XP simplifié = points ; à affiner selon la formule côté jeu)
    const xpGagne = Math.round(points / 4);
    db.prepare(`
        UPDATE profils_joueur
        SET xp = xp + ?, points_total = points_total + ?, dernier_jeu = ?,
            niveau_global = MAX(niveau_global, 1 + CAST((xp + ?) / 100 AS INTEGER))
        WHERE user_id = ?
    `).run(xpGagne, points, jeu, xpGagne, userId);

    res.status(201).json({ id, points, xpGagne });
};

exports.getUserScores = (req, res) => {
    const scores = db.prepare('SELECT * FROM scores WHERE user_id = ? ORDER BY created_at DESC LIMIT 100').all(req.params.userId);
    res.json(scores);
};
