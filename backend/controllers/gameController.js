const { pool } = require("../config/database");

async function getGames(req, res) {
    try {
        const { rows } = await pool.query(
            `
      SELECT id, nom, description, fonctionnel
      FROM jeux
      ORDER BY nom
      `
        );

        res.json(rows);
    } catch (error) {
        console.error("Erreur récupération jeux :", error);

        res.status(500).json({
            error: "Impossible de récupérer les jeux"
        });
    }
}

module.exports = {
    getGames
};