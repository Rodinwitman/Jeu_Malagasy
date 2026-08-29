/**
 * server.js — point d'entrée du backend (Node.js + Express + SQL)
 *
 * STATUT : squelette d'architecture pour la phase "préparation backend"
 * (priorité n°15 du cahier des charges). Le frontend v1 fonctionne en
 * autonomie avec localStorage (voir frontend/js/storage.js) ; ce backend
 * sera branché progressivement en remplaçant chaque méthode de Storage
 * par un appel fetch() vers les routes définies ici.
 *
 * Pile prévue : Node.js + Express + SQL (PostgreSQL ou MySQL au choix,
 * via un ORM comme Prisma ou Sequelize — voir config/database.js).
 *
 * Pour activer réellement ce serveur :
 *   npm init -y
 *   npm install express cors dotenv bcrypt jsonwebtoken pg   (ou mysql2)
 *   node server.js
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/authRoutes');
const gameRoutes = require('./routes/gameRoutes');
const scoreRoutes = require('./routes/scoreRoutes');
const leaderboardRoutes = require('./routes/leaderboardRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const challengeRoutes = require('./routes/challengeRoutes');

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/games', gameRoutes);
app.use('/api/scores', scoreRoutes);
app.use('/api/leaderboard', leaderboardRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/challenges', challengeRoutes);

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Teny Malagasy API mihodina eo amin'ny port ${PORT}`));
