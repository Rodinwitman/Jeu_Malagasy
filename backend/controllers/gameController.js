/**
 * controllers/gameController.js
 */
const db = require('../config/database');
const { getLevelConfig, MAX_NIVEAU } = require('../services/levelService');

exports.listGames = (req, res) => {
    const games = db.prepare('SELECT id, nom, description, fonctionnel FROM jeux').all();
    res.json(games.map(g => ({ ...g, fonctionnel: !!g.fonctionnel })));
};

exports.getLevelConfig = (req, res) => {
    const n = parseInt(req.params.n, 10);
    if (!n || n < 1 || n > MAX_NIVEAU) {
        return res.status(400).json({ message: `Ny haavo dia tokony ho eo anelanelan'ny 1 sy ${MAX_NIVEAU}.` });
    }
    res.json(getLevelConfig(n));
};
