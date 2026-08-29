/**
 * controllers/reviewController.js
 */
const crypto = require('crypto');
const db = require('../config/database');

exports.getByGame = (req, res) => {
    const jeu = req.params.jeu;
    const reviews = db.prepare(`
        SELECT a.id, a.user_id as userId, u.username, a.note, a.commentaire, a.created_at as date
        FROM avis a JOIN users u ON u.id = a.user_id
        WHERE a.jeu_id = ?
        ORDER BY a.created_at DESC
    `).all(jeu);

    const stats = db.prepare(`SELECT AVG(note) as moyenne, COUNT(*) as nombre FROM avis WHERE jeu_id = ?`).get(jeu);

    res.json({
        reviews,
        moyenne: stats.moyenne ? Math.round(stats.moyenne * 10) / 10 : 0,
        nombre: stats.nombre
    });
};

exports.addReview = (req, res) => {
    const userId = req.userId;
    const { jeu, note, commentaire } = req.body;
    if (!jeu || !note || note < 1 || note > 5) {
        return res.status(400).json({ message: 'Feno ny jeux sy ny naotra (1-5).' });
    }

    // Un avis par (utilisateur, jeu) : upsert grâce à la contrainte UNIQUE(user_id, jeu_id)
    const id = `r_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`;
    db.prepare(`
        INSERT INTO avis (id, user_id, jeu_id, note, commentaire)
        VALUES (?, ?, ?, ?, ?)
        ON CONFLICT(user_id, jeu_id) DO UPDATE SET note=excluded.note, commentaire=excluded.commentaire, created_at=datetime('now')
    `).run(id, userId, jeu, note, commentaire || null);

    res.status(201).json({ message: 'Voaraikitra ny hevitrao.' });
};
