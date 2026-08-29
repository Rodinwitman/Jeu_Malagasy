/**
 * controllers/reviewController.js
 */

const crypto = require("crypto");
const { pool } = require("../config/database");

exports.getByGame = async(req, res) => {
    try {
        const jeuId = req.params.jeu;

        const {
            rows: reviews
        } = await pool.query(
            `
      SELECT
        id,
        user_id,
        jeu_id,
        note,
        commentaire,
        created_at
      FROM avis
      WHERE jeu_id = $1
      ORDER BY created_at DESC
      `, [jeuId]
        );

        const {
            rows: statsRows
        } = await pool.query(
            `
      SELECT
        AVG(note)::numeric(10, 2) AS moyenne,
        COUNT(*)::integer AS nombre
      FROM avis
      WHERE jeu_id = $1
      `, [jeuId]
        );

        const stats = statsRows[0];

        const moyenne = stats.moyenne ?
            Math.round(Number(stats.moyenne) * 10) / 10 :
            0;

        return res.json({
            reviews,
            moyenne,
            nombre: Number(stats.nombre || 0)
        });
    } catch (error) {
        console.error(
            "Erreur récupération avis :",
            error
        );

        return res.status(500).json({
            message: "Erreur lors du chargement des avis."
        });
    }
};

exports.addReview = async(req, res) => {
    try {
        const userId = req.userId;

        const {
            jeu,
            note,
            commentaire
        } = req.body;

        const noteValue = Number(note);

        if (!userId) {
            return res.status(401).json({
                message: "Utilisateur non authentifié."
            });
        }

        if (!jeu ||
            !Number.isInteger(noteValue) ||
            noteValue < 1 ||
            noteValue > 5
        ) {
            return res.status(400).json({
                message: "Feno ny jeu sy ny naoty (1-5)."
            });
        }

        const id = `r_${Date.now()}_${crypto
      .randomBytes(3)
      .toString("hex")}`;

        const {
            rows
        } = await pool.query(
            `
      INSERT INTO avis (
        id,
        user_id,
        jeu_id,
        note,
        commentaire
      )
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (user_id, jeu_id)
      DO UPDATE SET
        note = EXCLUDED.note,
        commentaire = EXCLUDED.commentaire,
        created_at = NOW()
      RETURNING *
      `, [
                id,
                userId,
                jeu,
                noteValue,
                commentaire || null
            ]
        );

        return res.status(201).json({
            message: "Voaraikitra ny hevitrao.",
            review: rows[0]
        });
    } catch (error) {
        console.error(
            "Erreur ajout avis :",
            error
        );

        return res.status(500).json({
            message: "Erreur lors de l'enregistrement de l'avis."
        });
    }
};