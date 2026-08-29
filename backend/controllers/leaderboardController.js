/**
 * controllers/leaderboardController.js
 */

const { pool } = require("../config/database");

exports.getGlobal = async(req, res) => {
    try {
        const {
            rows
        } = await pool.query(
            `
      SELECT
        u.username,
        SUM(s.points)::integer AS points_total
      FROM scores s
      JOIN users u
        ON u.id = s.user_id
      GROUP BY u.id, u.username
      ORDER BY points_total DESC
      LIMIT 100
      `
        );

        return res.json(rows);
    } catch (error) {
        console.error(
            "Erreur classement global :",
            error
        );

        return res.status(500).json({
            message: "Erreur lors du chargement du classement."
        });
    }
};

exports.getByGame = async(req, res) => {
    try {
        const jeuId = req.params.jeu;

        const {
            rows
        } = await pool.query(
            `
      SELECT
        u.username,
        SUM(s.points)::integer AS points_total
      FROM scores s
      JOIN users u
        ON u.id = s.user_id
      WHERE s.jeu_id = $1
      GROUP BY u.id, u.username
      ORDER BY points_total DESC
      LIMIT 100
      `, [jeuId]
        );

        return res.json(rows);
    } catch (error) {
        console.error(
            "Erreur classement par jeu :",
            error
        );

        return res.status(500).json({
            message: "Erreur lors du chargement du classement."
        });
    }
};