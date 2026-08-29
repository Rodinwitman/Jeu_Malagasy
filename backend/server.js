/**
 * server.js — point d'entrée du backend
 *
 * Node.js + Express + PostgreSQL
 */

require("dotenv").config();

const express = require("express");
const cors = require("cors");

const {
    initializeDatabase,
    closeDatabase
} = require("./config/database");

const authRoutes = require("./routes/authRoutes");
const gameRoutes = require("./routes/gameRoutes");
const scoreRoutes = require("./routes/scoreRoutes");
const leaderboardRoutes = require("./routes/leaderboardRoutes");
const reviewRoutes = require("./routes/reviewRoutes");
const challengeRoutes = require("./routes/challengeRoutes");

const app = express();

/* ---------------------------------------------------------------------
   CONFIGURATION
   --------------------------------------------------------------------- */

const PORT = process.env.PORT || 4000;

const allowedOrigins = [
    "http://localhost:3000",
    "http://localhost:5173",
    process.env.FRONTEND_URL
].filter(Boolean);

/* ---------------------------------------------------------------------
   MIDDLEWARES
   --------------------------------------------------------------------- */

app.use(
    cors({
        origin(origin, callback) {
            // Autorise les outils comme curl, Postman ou les appels sans Origin.
            if (!origin) {
                return callback(null, true);
            }

            if (allowedOrigins.includes(origin)) {
                return callback(null, true);
            }

            return callback(
                new Error(`Origine CORS non autorisée : ${origin}`)
            );
        },

        credentials: true,

        methods: [
            "GET",
            "POST",
            "PUT",
            "PATCH",
            "DELETE",
            "OPTIONS"
        ],

        allowedHeaders: [
            "Content-Type",
            "Authorization"
        ]
    })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* ---------------------------------------------------------------------
   ROUTE DE TEST
   --------------------------------------------------------------------- */

app.get("/api/health", (req, res) => {
    res.status(200).json({
        status: "ok",
        message: "Teny Malagasy API fonctionne",
        environment: process.env.NODE_ENV || "development",
        timestamp: new Date().toISOString()
    });
});

/* ---------------------------------------------------------------------
   ROUTES API
   --------------------------------------------------------------------- */

app.use("/api/auth", authRoutes);
app.use("/api/games", gameRoutes);
app.use("/api/scores", scoreRoutes);
app.use("/api/leaderboard", leaderboardRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/challenges", challengeRoutes);

/* ---------------------------------------------------------------------
   ROUTE 404
   --------------------------------------------------------------------- */

app.use((req, res) => {
    res.status(404).json({
        error: "Route introuvable",
        path: req.originalUrl
    });
});

/* ---------------------------------------------------------------------
   GESTION DES ERREURS
   --------------------------------------------------------------------- */

app.use((error, req, res, next) => {
    console.error("Erreur serveur :", error);

    if (error.message && error.message.startsWith("Origine CORS")) {
        return res.status(403).json({
            error: "Origine non autorisée par CORS"
        });
    }

    res.status(error.status || 500).json({
        error: process.env.NODE_ENV === "production" ?
            "Erreur interne du serveur" :
            error.message
    });
});

/* ---------------------------------------------------------------------
   DÉMARRAGE DU SERVEUR
   --------------------------------------------------------------------- */

let server;

async function startServer() {
    try {
        await initializeDatabase();

        server = app.listen(PORT, "0.0.0.0", () => {
            console.log(
                `Teny Malagasy API mihodina amin'ny port ${PORT}`
            );
        });
    } catch (error) {
        console.error(
            "Impossible de démarrer le serveur :",
            error
        );

        process.exit(1);
    }
}

/* ---------------------------------------------------------------------
   ARRÊT PROPRE
   --------------------------------------------------------------------- */

async function shutdown(signal) {
    console.log(`${signal} reçu. Arrêt du serveur...`);

    if (server) {
        server.close(async() => {
            try {
                await closeDatabase();
                process.exit(0);
            } catch (error) {
                console.error(
                    "Erreur pendant la fermeture de la base :",
                    error
                );

                process.exit(1);
            }
        });
    } else {
        await closeDatabase();
        process.exit(0);
    }
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));

startServer();