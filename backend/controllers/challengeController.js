/**
 * controllers/challengeController.js
 *
 * Défi quotidien commun aux trois jeux :
 * - mot_cache
 * - devinette
 * - scrabble
 *
 * Le joueur doit réussir les trois jeux pour obtenir le bonus.
 */

const { pool } = require("../config/database");
const {
    getLevelConfig,
    MAX_NIVEAU
} = require("../services/levelService");

const JEUX_DEFI = [
    "mot_cache",
    "devinette",
    "scrabble"
];

const EPOCH = Date.UTC(2026, 7, 16);
// 16 août 2026 = jour 0 = niveau 1

const DAY_MS = 24 * 60 * 60 * 1000;

/* ---------------------------------------------------------------------
   OUTILS
   --------------------------------------------------------------------- */

function getTodayISO() {
    return new Date().toISOString().slice(0, 10);
}

function computeNiveauDuJour(dateISO) {
    const today = new Date(`${dateISO}T00:00:00Z`).getTime();
    const dayIndex = Math.floor((today - EPOCH) / DAY_MS);

    const wrapped =
        ((dayIndex % MAX_NIVEAU) + MAX_NIVEAU) % MAX_NIVEAU;

    return wrapped + 1;
}

/* ---------------------------------------------------------------------
   DÉFI DU JOUR
   --------------------------------------------------------------------- */

exports.getToday = async(req, res) => {
    try {
        const today = getTodayISO();
        const niveau = computeNiveauDuJour(today);

        res.json({
            date: today,
            niveau,
            jeux: JEUX_DEFI,
            recompensePartielle: 30,
            recompenseBonus: 100,
            levelConfig: getLevelConfig(niveau)
        });
    } catch (error) {
        console.error(
            "Erreur récupération défi du jour :",
            error
        );

        res.status(500).json({
            message: "Erreur lors de la récupération du défi du jour."
        });
    }
};

/* ---------------------------------------------------------------------
   PROGRESSION DE L'UTILISATEUR
   --------------------------------------------------------------------- */

exports.getProgress = async(req, res) => {
    try {
        const userId = req.userId;
        const today = getTodayISO();

        const {
            rows
        } = await pool.query(
            `
      SELECT
        jeu_id AS jeu,
        statut,
        score
      FROM defis_utilisateur
      WHERE user_id = $1
        AND date = $2
      `, [userId, today]
        );

        const progress = {};

        JEUX_DEFI.forEach((jeu) => {
            progress[jeu] = {
                statut: "tsy_natao",
                score: 0
            };
        });

        rows.forEach((row) => {
            progress[row.jeu] = {
                statut: row.statut,
                score: Number(row.score || 0)
            };
        });

        const {
            rows: bonusRows
        } = await pool.query(
            `
      SELECT 1
      FROM defis_bonus
      WHERE user_id = $1
        AND date = $2
      `, [userId, today]
        );

        res.json({
            date: today,
            progress,
            bonusAttribue: bonusRows.length > 0
        });
    } catch (error) {
        console.error(
            "Erreur récupération progression :",
            error
        );

        res.status(500).json({
            message: "Erreur lors de la récupération de la progression."
        });
    }
};

/* ---------------------------------------------------------------------
   MISE À JOUR DE LA PROGRESSION
   --------------------------------------------------------------------- */

exports.updateProgress = async(req, res) => {
    const client = await pool.connect();

    try {
        const userId = req.userId;

        const {
            date,
            jeu,
            statut,
            score
        } = req.body;

        const today = date || getTodayISO();
        const scoreValue = Number(score || 0);

        if (!userId) {
            return res.status(401).json({
                message: "Utilisateur non authentifié."
            });
        }

        if (!JEUX_DEFI.includes(jeu)) {
            return res.status(400).json({
                message: "Jeu tsy fantatra."
            });
        }

        if (!statut) {
            return res.status(400).json({
                message: "Le statut est obligatoire."
            });
        }

        if (!/^\d{4}-\d{2}-\d{2}$/.test(today)) {
            return res.status(400).json({
                message: "Format de date invalide. Utilise YYYY-MM-DD."
            });
        }

        if (!Number.isFinite(scoreValue) || scoreValue < 0) {
            return res.status(400).json({
                message: "Le score doit être un nombre positif ou nul."
            });
        }

        await client.query("BEGIN");

        /*
         * PostgreSQL utilise EXCLUDED pour désigner les valeurs proposées
         * dans la partie INSERT lors d'un ON CONFLICT.
         */
        await client.query(
            `
      INSERT INTO defis_utilisateur (
        user_id,
        date,
        jeu_id,
        statut,
        score
      )
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (user_id, date, jeu_id)
      DO UPDATE SET
        statut = EXCLUDED.statut,
        score = EXCLUDED.score
      `, [
                userId,
                today,
                jeu,
                statut,
                scoreValue
            ]
        );

        /*
         * On relit les trois jeux après la mise à jour.
         */
        const {
            rows
        } = await client.query(
            `
      SELECT
        jeu_id,
        statut,
        score
      FROM defis_utilisateur
      WHERE user_id = $1
        AND date = $2
      `, [userId, today]
        );

        const doneSet = new Set(
            rows
            .filter((row) => row.statut === "vita")
            .map((row) => row.jeu_id)
        );

        const toutesVita = JEUX_DEFI.every((jeuId) =>
            doneSet.has(jeuId)
        );

        let bonusAttribue = false;

        if (toutesVita) {
            /*
             * On crée le bonus uniquement s'il n'existe pas déjà.
             */
            const {
                rows: insertedBonusRows
            } = await client.query(
                `
        INSERT INTO defis_bonus (
          user_id,
          date
        )
        VALUES ($1, $2)
        ON CONFLICT (user_id, date)
        DO NOTHING
        RETURNING user_id
        `, [userId, today]
            );

            /*
             * RETURNING renvoie une ligne seulement si le bonus
             * vient réellement d'être créé.
             */
            if (insertedBonusRows.length > 0) {
                await client.query(
                    `
          INSERT INTO defis_stats (
            user_id,
            xp_defi,
            points_defi,
            defis_reussis
          )
          VALUES ($1, 50, 100, 1)
          ON CONFLICT (user_id)
          DO UPDATE SET
            xp_defi = defis_stats.xp_defi + 50,
            points_defi = defis_stats.points_defi + 100,
            defis_reussis =
              defis_stats.defis_reussis + 1
          `, [userId]
                );

                bonusAttribue = true;
            }
        }

        await client.query("COMMIT");

        res.json({
            message: "Voaraikitra.",
            date: today,
            jeu,
            statut,
            score: scoreValue,
            toutesVita,
            bonusAttribue
        });
    } catch (error) {
        await client.query("ROLLBACK");

        console.error(
            "Erreur mise à jour progression :",
            error
        );

        res.status(500).json({
            message: "Erreur lors de la mise à jour de la progression."
        });
    } finally {
        client.release();
    }
};

/* ---------------------------------------------------------------------
   STATISTIQUES CUMULÉES
   --------------------------------------------------------------------- */

exports.getStats = async(req, res) => {
    try {
        const userId = req.userId;

        const {
            rows
        } = await pool.query(
            `
      SELECT
        xp_defi AS "xpDefi",
        points_defi AS "pointsDefi",
        defis_reussis AS "defisReussis"
      FROM defis_stats
      WHERE user_id = $1
      `, [userId]
        );

        res.json(
            rows[0] || {
                xpDefi: 0,
                pointsDefi: 0,
                defisReussis: 0
            }
        );
    } catch (error) {
        console.error(
            "Erreur récupération statistiques défis :",
            error
        );

        res.status(500).json({
            message: "Erreur lors de la récupération des statistiques."
        });
    }
};