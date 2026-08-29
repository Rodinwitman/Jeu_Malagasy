/**
 * controllers/authController.js
 *
 * Compte classique : bcrypt pour le mot de passe, JWT pour la session.
 * Google/Facebook : le jeton envoyé par le frontend (voir frontend/js/auth.js)
 * est vérifié ICI, côté serveur — jamais fait confiance au client seul.
 *
 * Pour que la vérification Google/Facebook fonctionne réellement en
 * production, il faut renseigner GOOGLE_CLIENT_ID et FACEBOOK_APP_ID/SECRET
 * dans le fichier .env (voir .env.example). Dans le bac à sable de
 * développement de ce projet, l'appel réseau vers Google/Facebook peut être
 * bloqué par la configuration réseau — le code est néanmoins correct et
 * prêt pour un environnement de production avec accès internet complet.
 */
const crypto = require('crypto');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../config/database');

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-tsy-azo-ampiasaina-amin-ny-production';
const SALT_ROUNDS = 10;

function newId(prefix) {
    return `${prefix}_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
}

function issueToken(user) {
    return jwt.sign({ sub: user.id, username: user.username }, JWT_SECRET, { expiresIn: '30d' });
}

function ensureProfile(userId) {
    const exists = db.prepare('SELECT 1 FROM profils_joueur WHERE user_id = ?').get(userId);
    if (!exists) {
        db.prepare('INSERT INTO profils_joueur (user_id, xp, niveau_global, points_total) VALUES (?, 0, 1, 0)').run(userId);
    }
}

function publicUser(u) {
    return { id: u.id, username: u.username, email: u.email, provider: u.provider };
}

exports.register = async (req, res) => {
    try {
        const { username, email, password } = req.body;
        if (!username || !email || !password) {
            return res.status(400).json({ message: 'Tsy feno ny mombamomba rehetra.' });
        }
        const existingUsername = db.prepare('SELECT 1 FROM users WHERE username = ?').get(username);
        if (existingUsername) return res.status(409).json({ message: "Efa misy mpampiasa manana io anarana io." });

        const existingEmail = db.prepare('SELECT 1 FROM users WHERE email = ?').get(email);
        if (existingEmail) return res.status(409).json({ message: 'Efa misafidy io mailaka io ny kaonty iray.' });

        const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
        const id = newId('u');
        db.prepare(`
            INSERT INTO users (id, username, email, password_hash, provider)
            VALUES (?, ?, ?, ?, 'local')
        `).run(id, username, email, passwordHash);
        ensureProfile(id);

        const user = db.prepare('SELECT * FROM users WHERE id = ?').get(id);
        res.status(201).json({ user: publicUser(user), token: issueToken(user) });
    } catch (e) {
        console.error(e);
        res.status(500).json({ message: 'Nisy olana teo am-panoratana ny kaonty.' });
    }
};

exports.login = async (req, res) => {
    try {
        const { username, password } = req.body;
        const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
        if (!user) return res.status(404).json({ message: 'Tsy hita ny mpampiasa.' });
        if (user.provider !== 'local') {
            return res.status(400).json({ message: `Ity kaonty ity dia mifamatotra amin'ny ${user.provider}.` });
        }
        const match = await bcrypt.compare(password, user.password_hash);
        if (!match) return res.status(401).json({ message: 'Diso ny teny miafina.' });

        res.json({ user: publicUser(user), token: issueToken(user) });
    } catch (e) {
        console.error(e);
        res.status(500).json({ message: 'Nisy olana teo am-pidirana.' });
    }
};

/** Trouve ou crée un utilisateur à partir d'un profil OAuth vérifié. */
function findOrCreateOAuthUser(provider, providerId, email, name) {
    let user = db.prepare('SELECT * FROM users WHERE provider = ? AND provider_id = ?').get(provider, providerId);
    if (user) return user;

    if (email) {
        user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
        if (user) {
            db.prepare('UPDATE users SET provider = ?, provider_id = ? WHERE id = ?').run(provider, providerId, user.id);
            return db.prepare('SELECT * FROM users WHERE id = ?').get(user.id);
        }
    }

    const id = newId('u');
    db.prepare(`
        INSERT INTO users (id, username, email, provider, provider_id)
        VALUES (?, ?, ?, ?, ?)
    `).run(id, name || (email ? email.split('@')[0] : 'mpilalao'), email || null, provider, providerId);
    ensureProfile(id);
    return db.prepare('SELECT * FROM users WHERE id = ?').get(id);
}

exports.loginWithGoogle = async (req, res) => {
    try {
        const { credential } = req.body; // JWT renvoyé par Google Identity Services
        if (!credential) return res.status(400).json({ message: 'Tsy nomena jeton Google.' });

        if (!process.env.GOOGLE_CLIENT_ID) {
            return res.status(501).json({
                message: "GOOGLE_CLIENT_ID tsy voafaritra ao amin'ny .env — tsy azo tsapain-tanana ny fanamarinana Google."
            });
        }

        // Vérification réelle du jeton (nécessite google-auth-library + accès internet)
        const { OAuth2Client } = require('google-auth-library');
        const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
        const ticket = await client.verifyIdToken({ idToken: credential, audience: process.env.GOOGLE_CLIENT_ID });
        const payload = ticket.getPayload();

        const user = findOrCreateOAuthUser('google', payload.sub, payload.email, payload.name);
        res.json({ user: publicUser(user), token: issueToken(user) });
    } catch (e) {
        console.error(e);
        res.status(401).json({ message: 'Tsy nekena ny jeton Google.' });
    }
};

exports.loginWithFacebook = async (req, res) => {
    try {
        const { accessToken } = req.body;
        if (!accessToken) return res.status(400).json({ message: 'Tsy nomena jeton Facebook.' });

        // Vérification réelle auprès de l'API Graph Facebook
        const url = `https://graph.facebook.com/me?fields=id,name,email&access_token=${encodeURIComponent(accessToken)}`;
        const response = await fetch(url);
        if (!response.ok) return res.status(401).json({ message: 'Tsy nekena ny jeton Facebook.' });
        const profile = await response.json();

        const user = findOrCreateOAuthUser('facebook', profile.id, profile.email, profile.name);
        res.json({ user: publicUser(user), token: issueToken(user) });
    } catch (e) {
        console.error(e);
        res.status(401).json({ message: 'Tsy nekena ny jeton Facebook.' });
    }
};

exports._internal = { JWT_SECRET, ensureProfile, publicUser };
