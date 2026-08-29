/**
 * config/database.js
 *
 * Connexion PostgreSQL pour le projet Teny Malagasy.
 *
 * Développement local :
 *   DATABASE_URL=postgresql://postgres:motdepasse@localhost:5432/teny_malagasy
 *
 * Production Railway :
 *   DATABASE_URL=${{Postgres.DATABASE_URL}}
 *
 * Installation :
 *   npm install pg
 */

const path = require("path");
const fs = require("fs");
const { Pool } = require("pg");

/* ---------------------------------------------------------------------
   CONFIGURATION DE LA CONNEXION
   --------------------------------------------------------------------- */

if (!process.env.DATABASE_URL) {
    console.warn(
        "Attention : la variable DATABASE_URL n'est pas définie."
    );
}

const isProduction = process.env.NODE_ENV === "production";

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,

    // Railway utilise généralement une connexion SSL.
    // En local, SSL est désactivé.
    ssl: isProduction ? { rejectUnauthorized: false } : false,

    // Évite de garder trop de connexions ouvertes.
    max: 10,

    // Temps maximal d'attente pour obtenir une connexion.
    connectionTimeoutMillis: 10000,

    // Ferme les connexions inactives après 30 secondes.
    idleTimeoutMillis: 30000
});

/* ---------------------------------------------------------------------
   GESTION DES ERREURS DE CONNEXION
   --------------------------------------------------------------------- */

pool.on("error", (error) => {
    console.error(
        "Erreur inattendue de la connexion PostgreSQL :",
        error
    );
});

/* ---------------------------------------------------------------------
   TEST DE CONNEXION
   --------------------------------------------------------------------- */

async function testConnection() {
    const client = await pool.connect();

    try {
        await client.query("SELECT NOW()");
        console.log("Connexion PostgreSQL réussie.");
    } finally {
        client.release();
    }
}

/* ---------------------------------------------------------------------
   CRÉATION DU SCHÉMA
   --------------------------------------------------------------------- */

async function createTables() {
    await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE,
      password_hash TEXT,
      provider TEXT DEFAULT 'local',
      provider_id TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS profils_joueur (
      user_id TEXT PRIMARY KEY
        REFERENCES users(id)
        ON DELETE CASCADE,

      xp INTEGER DEFAULT 0,
      niveau_global INTEGER DEFAULT 1,
      points_total INTEGER DEFAULT 0,
      dernier_jeu TEXT
    );

    CREATE TABLE IF NOT EXISTS jeux (
      id TEXT PRIMARY KEY,
      nom TEXT NOT NULL,
      description TEXT,
      fonctionnel BOOLEAN DEFAULT FALSE
    );

    CREATE TABLE IF NOT EXISTS scores (
      id TEXT PRIMARY KEY,

      user_id TEXT
        REFERENCES users(id)
        ON DELETE CASCADE,

      jeu_id TEXT
        REFERENCES jeux(id)
        ON DELETE SET NULL,

      niveau INTEGER NOT NULL,
      points INTEGER NOT NULL,
      etoiles INTEGER,

      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS defis_utilisateur (
      user_id TEXT
        REFERENCES users(id)
        ON DELETE CASCADE,

      date DATE NOT NULL,

      jeu_id TEXT
        REFERENCES jeux(id)
        ON DELETE CASCADE,

      statut TEXT DEFAULT 'tsy_natao',
      score INTEGER DEFAULT 0,

      PRIMARY KEY (user_id, date, jeu_id)
    );

    CREATE TABLE IF NOT EXISTS defis_bonus (
      user_id TEXT
        REFERENCES users(id)
        ON DELETE CASCADE,

      date DATE NOT NULL,

      PRIMARY KEY (user_id, date)
    );

    CREATE TABLE IF NOT EXISTS defis_stats (
      user_id TEXT PRIMARY KEY
        REFERENCES users(id)
        ON DELETE CASCADE,

      xp_defi INTEGER DEFAULT 0,
      points_defi INTEGER DEFAULT 0,
      defis_reussis INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS avis (
      id TEXT PRIMARY KEY,

      user_id TEXT
        REFERENCES users(id)
        ON DELETE CASCADE,

      jeu_id TEXT
        REFERENCES jeux(id)
        ON DELETE CASCADE,

      note INTEGER CHECK (note BETWEEN 1 AND 5),
      commentaire TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW(),

      UNIQUE(user_id, jeu_id)
    );
  `);

    console.log("Tables PostgreSQL vérifiées ou créées.");
}

/* ---------------------------------------------------------------------
   SEED DES JEUX
   --------------------------------------------------------------------- */

async function seedJeux() {
    const gamesPath = path.join(
        __dirname,
        "..",
        "..",
        "data",
        "games.json"
    );

    if (!fs.existsSync(gamesPath)) {
        console.warn(
            `Fichier games.json introuvable : ${gamesPath}`
        );
        return;
    }

    let games;

    try {
        games = require(gamesPath);
    } catch (error) {
        console.warn(
            "Impossible de lire data/games.json :",
            error.message
        );
        return;
    }

    if (!Array.isArray(games)) {
        console.warn(
            "data/games.json doit contenir un tableau JSON."
        );
        return;
    }

    const client = await pool.connect();

    try {
        await client.query("BEGIN");

        for (const game of games) {
            if (!game.id || !game.nom) {
                console.warn(
                    "Jeu ignoré : les propriétés id et nom sont obligatoires.",
                    game
                );
                continue;
            }

            await client.query(
                `
        INSERT INTO jeux (
          id,
          nom,
          description,
          fonctionnel
        )
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (id)
        DO UPDATE SET
          nom = EXCLUDED.nom,
          description = EXCLUDED.description,
          fonctionnel = EXCLUDED.fonctionnel
        `, [
                    String(game.id),
                    String(game.nom),
                    game.description || null,
                    Boolean(game.fonctionnel)
                ]
            );
        }

        await client.query("COMMIT");

        console.log(
            `${games.length} jeu(x) initialisé(s).`
        );
    } catch (error) {
        await client.query("ROLLBACK");

        console.error(
            "Erreur pendant le seed des jeux :",
            error
        );

        throw error;
    } finally {
        client.release();
    }
}

/* ---------------------------------------------------------------------
   INITIALISATION COMPLÈTE DE LA BASE
   --------------------------------------------------------------------- */

async function initializeDatabase() {
    await testConnection();
    await createTables();
    await seedJeux();

    console.log("Base de données prête.");
}

/* ---------------------------------------------------------------------
   FERMETURE PROPRE
   --------------------------------------------------------------------- */

async function closeDatabase() {
    await pool.end();
    console.log("Connexion PostgreSQL fermée.");
}

/* ---------------------------------------------------------------------
   EXPORTS
   --------------------------------------------------------------------- */

module.exports = {
    pool,
    initializeDatabase,
    closeDatabase
};