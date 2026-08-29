/**
 * config/database.js — connexion SQL réelle avec SQLite (better-sqlite3).
 *
 * Choix de SQLite pour la V1 : c'est une vraie base SQL (mêmes requêtes
 * SQL qu'avec PostgreSQL/MySQL), mais elle vit dans un simple fichier,
 * donc aucun serveur de base de données externe n'est nécessaire pour
 * développer et tester. Migrer vers PostgreSQL plus tard ne demande que
 * de changer ce fichier (les requêtes SQL des contrôleurs restent
 * presque identiques — voir la note de migration en bas de fichier).
 */
const path = require('path');
const Database = require('better-sqlite3');

const DB_PATH = process.env.DB_PATH || path.join(__dirname, '..', 'data', 'teny_malagasy.sqlite');
const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

/* ---------------------------------------------------------------------
   SCHÉMA — créé automatiquement au premier démarrage s'il n'existe pas.
   --------------------------------------------------------------------- */
db.exec(`
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE,
    password_hash TEXT,
    provider TEXT DEFAULT 'local',      -- local | google | facebook
    provider_id TEXT,
    created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS profils_joueur (
    user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    xp INTEGER DEFAULT 0,
    niveau_global INTEGER DEFAULT 1,
    points_total INTEGER DEFAULT 0,
    dernier_jeu TEXT
);

CREATE TABLE IF NOT EXISTS jeux (
    id TEXT PRIMARY KEY,               -- mot_cache | devinette | scrabble | pendu | wordle
    nom TEXT NOT NULL,
    description TEXT,
    fonctionnel INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS scores (
    id TEXT PRIMARY KEY,
    user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
    jeu_id TEXT REFERENCES jeux(id),
    niveau INTEGER NOT NULL,
    points INTEGER NOT NULL,
    etoiles INTEGER,
    created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS defis_utilisateur (
    user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
    date TEXT,
    jeu_id TEXT REFERENCES jeux(id),
    statut TEXT DEFAULT 'tsy_natao',
    score INTEGER DEFAULT 0,
    PRIMARY KEY (user_id, date, jeu_id)
);

CREATE TABLE IF NOT EXISTS defis_bonus (
    user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
    date TEXT,
    PRIMARY KEY (user_id, date)
);

CREATE TABLE IF NOT EXISTS defis_stats (
    user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    xp_defi INTEGER DEFAULT 0,
    points_defi INTEGER DEFAULT 0,
    defis_reussis INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS avis (
    id TEXT PRIMARY KEY,
    user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
    jeu_id TEXT REFERENCES jeux(id),
    note INTEGER CHECK (note BETWEEN 1 AND 5),
    commentaire TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    UNIQUE(user_id, jeu_id)
);
`);

/* Seed des jeux (idempotent) à partir de data/games.json */
const seedJeux = db.prepare(`
    INSERT INTO jeux (id, nom, description, fonctionnel)
    VALUES (@id, @nom, @description, @fonctionnel)
    ON CONFLICT(id) DO UPDATE SET nom=excluded.nom, description=excluded.description, fonctionnel=excluded.fonctionnel
`);
try {
    const games = require('../../data/games.json');
    const insertMany = db.transaction((rows) => {
        rows.forEach(g => seedJeux.run({
            id: g.id, nom: g.nom, description: g.description, fonctionnel: g.fonctionnel ? 1 : 0
        }));
    });
    insertMany(games);
} catch (e) {
    console.warn('Tsy voavaky ny data/games.json ho an\'ny seed (tsy misy fiantraikany lehibe):', e.message);
}

module.exports = db;

/* ---------------------------------------------------------------------
   MIGRATION FUTURE VERS POSTGRESQL/MYSQL :
   - Remplacer `new Database(...)` par un pool `pg`/`mysql2`.
   - `datetime('now')` -> `NOW()` (Postgres) ou équivalent MySQL.
   - `INSERT ... ON CONFLICT` -> syntaxe équivalente (Postgres identique,
     MySQL utilise `ON DUPLICATE KEY UPDATE`).
   - Les requêtes SELECT/INSERT/UPDATE des contrôleurs restent presque
     inchangées (SQL standard).
   --------------------------------------------------------------------- */
