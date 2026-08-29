const path = require("path");
const fs = require("fs");
const { Pool } = require("pg");

// Créer le dossier avant d'ouvrir la base
const dataDir = path.join(__dirname, '../data');
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
}

if (!process.env.DATABASE_URL) {
    throw new Error(
        "La variable DATABASE_URL est obligatoire."
    );
}

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    },
    max: 5,
    connectionTimeoutMillis: 15000,
    idleTimeoutMillis: 30000
});

pool.on("error", (error) => {
    console.error("Erreur PostgreSQL :", error);
});

async function testConnection() {
    const client = await pool.connect();

    try {
        await client.query("SELECT NOW()");
        console.log("Connexion PostgreSQL réussie.");
    } finally {
        client.release();
    }
}

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

    console.log("Tables PostgreSQL créées ou déjà existantes.");
}

async function seedJeux() {
    const gamesPath = path.join(
        __dirname,
        "..",
        "data",
        "games.json"
    );

    if (!fs.existsSync(gamesPath)) {
        console.warn(`Fichier introuvable : ${gamesPath}`);
        return;
    }

    let games;

    try {
        games = require(gamesPath);
    } catch (error) {
        console.warn(
            "Impossible de lire games.json :",
            error.message
        );
        return;
    }

    if (!Array.isArray(games)) {
        console.warn("games.json doit contenir un tableau.");
        return;
    }

    const client = await pool.connect();

    try {
        await client.query("BEGIN");

        for (const game of games) {
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
                    game.id,
                    game.nom,
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
        throw error;
    } finally {
        client.release();
    }
}

async function initializeDatabase() {
    await testConnection();
    await createTables();
    await seedJeux();

    console.log("Base PostgreSQL prête.");
}

async function closeDatabase() {
    await pool.end();
}

module.exports = {
    pool,
    initializeDatabase,
    closeDatabase
};