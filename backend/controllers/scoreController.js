/**
 * controllers/scoreController.js
 */

const crypto = require("crypto");
const { pool } = require("../config/database");
const {
    isScorePlausible
} = require("../services/levelService");

exports.addScore = async(req, res) => {
    try {
        const userId = req.userId;

        const {
            jeu,
            niveau,
            points,
            etoiles
        } = req.body;

        if (!userId) {
            return res.status(401).json({
                message: "Utilisateur non authentifié."
            });
        }

        if (!jeu || niveau == null || points == null) {
            return res.status(400).json({
                message: "Tsy feno ny angona nalefa."
            });
        }

        const niveauValue = Number(niveau);
        const pointsValue = Number(points);
        const etoilesValue =
            etoiles == null ? null : Number(etoiles);

        if (!Number.isInteger(niveauValue) ||
            niveauValue < 1
        ) {
            return res.status(400).json({
                message: "Niveau invalide."
            });
        }

        if (!Number.isFinite(pointsValue) ||
            pointsValue < 0
        ) {
            return res.status(400).json({
                message: "Points invalides."
            });
        }

        if (
            etoilesValue !== null &&
            (!Number.isInteger(etoilesValue) ||
                etoilesValue < 0
            )
        ) {
            return res.status(400).json({
                message: "Nombre d'étoiles invalide."
            });
        }

        if (!isScorePlausible(niveauValue, pointsValue)) {
            return res.status(422).json({
                message: "Toa tsy mifanaraka amin'ny haavo ilay isa nalefa."
            });
        }

        const id = `s_${Date.now()}_${crypto
      .randomBytes(3)
      .toString("hex")}`;

        await pool.query(
            `
      INSERT INTO scores (
        id,
        user_id,
        jeu_id,
        niveau,
        points,
        etoiles
      )
      VALUES ($1, $2, $3, $4, $5, $6)
      `, [
                id,
                userId,
                jeu,
                niveauValue,
                pointsValue,
                etoilesValue
            ]
        );

        const xpGagne = Math.round(pointsValue / 4);

        await pool.query(
            `
      INSERT INTO profils_joueur (
        user_id,
        xp,
        niveau_global,
        points_total,
        dernier_jeu
      )
      VALUES ($1, $2, 1, $3, $4)
      ON CONFLICT (user_id)
      DO UPDATE SET
        xp = profils_joueur.xp + EXCLUDED.xp,
        points_total =
          profils_joueur.points_total + EXCLUDED.points_total,
        dernier_jeu = EXCLUDED.dernier_jeu,
        niveau_global = GREATEST(
          profils_joueur.niveau_global,
          1 + FLOOR(
            (profils_joueur.xp + EXCLUDED.xp) / 100.0
          )::integer
        )
      `, [
                userId,
                xpGagne,
                pointsValue,
                jeu
            ]
        );

        return res.status(201).json({
            id,
            jeu,
            niveau: niveauValue,
            points: pointsValue,
            etoiles: etoilesValue,
            xpGagne
        });
    } catch (error) {
        console.error("Erreur ajout score :", error);

        return res.status(500).json({
            message: "Erreur lors de l'enregistrement du score."
        });
    }
};

exports.getUserScores = async(req, res) => {
    try {
        const {
            rows: scores
        } = await pool.query(
            `
      SELECT *
      FROM scores
      WHERE user_id = $1
      ORDER BY created_at DESC
      LIMIT 100
      `, [req.params.userId]
        );

        return res.json(scores);
    } catch (error) {
        console.error(
            "Erreur récupération scores :",
            error
        );

        return res.status(500).json({
            message: "Erreur lors de la récupération des scores."
        });
    }
};