/**
 * controllers/authController.js
 *
 * Authentification locale avec bcrypt + JWT.
 * OAuth Google/Facebook vérifié côté serveur.
 */

const crypto = require("crypto");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { pool } = require("../config/database");

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
    throw new Error(
        "JWT_SECRET doit être défini dans les variables d'environnement."
    );
}

const SALT_ROUNDS = 10;

function newId(prefix) {
    return `${prefix}_${Date.now()}_${crypto
    .randomBytes(4)
    .toString("hex")}`;
}

function issueToken(user) {
    return jwt.sign({
            sub: user.id,
            username: user.username
        },
        JWT_SECRET, {
            expiresIn: "30d"
        }
    );
}

async function ensureProfile(userId) {
    const { rows } = await pool.query(
        `
    SELECT 1
    FROM profils_joueur
    WHERE user_id = $1
    `, [userId]
    );

    if (rows.length === 0) {
        await pool.query(
            `
      INSERT INTO profils_joueur (
        user_id,
        xp,
        niveau_global,
        points_total
      )
      VALUES ($1, 0, 1, 0)
      ON CONFLICT (user_id) DO NOTHING
      `, [userId]
        );
    }
}

function publicUser(user) {
    return {
        id: user.id,
        username: user.username,
        email: user.email,
        provider: user.provider
    };
}

/* ---------------------------------------------------------------------
   INSCRIPTION LOCALE
   --------------------------------------------------------------------- */

exports.register = async(req, res) => {
    try {
        const {
            username,
            email,
            password
        } = req.body;

        if (!username || !email || !password) {
            return res.status(400).json({
                message: "Tsy feno ny mombamomba rehetra."
            });
        }

        if (password.length < 6) {
            return res.status(400).json({
                message: "Ny teny miafina dia tokony hanana litera 6 farafahakeliny."
            });
        }

        const {
            rows: usernameRows
        } = await pool.query(
            `
      SELECT 1
      FROM users
      WHERE username = $1
      `, [username]
        );

        if (usernameRows.length > 0) {
            return res.status(409).json({
                message: "Efa misy mpampiasa manana io anarana io."
            });
        }

        const {
            rows: emailRows
        } = await pool.query(
            `
      SELECT 1
      FROM users
      WHERE email = $1
      `, [email]
        );

        if (emailRows.length > 0) {
            return res.status(409).json({
                message: "Efa ampiasain'ny kaonty iray io mailaka io."
            });
        }

        const passwordHash = await bcrypt.hash(
            password,
            SALT_ROUNDS
        );

        const id = newId("u");

        const {
            rows
        } = await pool.query(
            `
      INSERT INTO users (
        id,
        username,
        email,
        password_hash,
        provider
      )
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
      `, [
                id,
                username,
                email,
                passwordHash,
                "local"
            ]
        );

        const user = rows[0];

        await ensureProfile(user.id);

        return res.status(201).json({
            user: publicUser(user),
            token: issueToken(user)
        });
    } catch (error) {
        console.error("Erreur inscription :", error);

        if (error.code === "23505") {
            return res.status(409).json({
                message: "Le nom d'utilisateur ou l'email existe déjà."
            });
        }

        return res.status(500).json({
            message: "Nisy olana teo am-panoratana ny kaonty."
        });
    }
};

/* ---------------------------------------------------------------------
   CONNEXION LOCALE
   --------------------------------------------------------------------- */

exports.login = async(req, res) => {
    try {
        const {
            username,
            password
        } = req.body;

        if (!username || !password) {
            return res.status(400).json({
                message: "Nom d'utilisateur et mot de passe obligatoires."
            });
        }

        const {
            rows
        } = await pool.query(
            `
      SELECT *
      FROM users
      WHERE username = $1
      `, [username]
        );

        const user = rows[0];

        if (!user) {
            return res.status(404).json({
                message: "Tsy hita ny mpampiasa."
            });
        }

        if (user.provider !== "local") {
            return res.status(400).json({
                message: `Ity kaonty ity dia mifamatotra amin'ny ${user.provider}.`
            });
        }

        const match = await bcrypt.compare(
            password,
            user.password_hash
        );

        if (!match) {
            return res.status(401).json({
                message: "Diso ny teny miafina."
            });
        }

        return res.json({
            user: publicUser(user),
            token: issueToken(user)
        });
    } catch (error) {
        console.error("Erreur connexion :", error);

        return res.status(500).json({
            message: "Nisy olana teo am-pidirana."
        });
    }
};

/* ---------------------------------------------------------------------
   OAUTH : TROUVER OU CRÉER UN UTILISATEUR
   --------------------------------------------------------------------- */

async function findOrCreateOAuthUser(
    provider,
    providerId,
    email,
    name
) {
    const {
        rows: providerRows
    } = await pool.query(
        `
    SELECT *
    FROM users
    WHERE provider = $1
      AND provider_id = $2
    `, [provider, providerId]
    );

    if (providerRows.length > 0) {
        return providerRows[0];
    }

    if (email) {
        const {
            rows: emailRows
        } = await pool.query(
            `
      SELECT *
      FROM users
      WHERE email = $1
      `, [email]
        );

        if (emailRows.length > 0) {
            const existingUser = emailRows[0];

            const {
                rows: updatedRows
            } = await pool.query(
                `
        UPDATE users
        SET provider = $1,
            provider_id = $2
        WHERE id = $3
        RETURNING *
        `, [
                    provider,
                    providerId,
                    existingUser.id
                ]
            );

            return updatedRows[0];
        }
    }

    const id = newId("u");

    const username =
        name ||
        (email ?
            email.split("@")[0] :
            `mpilalao_${Date.now()}`);

    const {
        rows
    } = await pool.query(
        `
    INSERT INTO users (
      id,
      username,
      email,
      provider,
      provider_id
    )
    VALUES ($1, $2, $3, $4, $5)
    RETURNING *
    `, [
            id,
            username,
            email || null,
            provider,
            providerId
        ]
    );

    const user = rows[0];

    await ensureProfile(user.id);

    return user;
}

/* ---------------------------------------------------------------------
   CONNEXION GOOGLE
   --------------------------------------------------------------------- */

exports.loginWithGoogle = async(req, res) => {
    try {
        const {
            credential
        } = req.body;

        if (!credential) {
            return res.status(400).json({
                message: "Tsy nomena jeton Google."
            });
        }

        if (!process.env.GOOGLE_CLIENT_ID) {
            return res.status(501).json({
                message: "GOOGLE_CLIENT_ID tsy voafaritra ao amin'ny .env."
            });
        }

        const {
            OAuth2Client
        } = require("google-auth-library");

        const client = new OAuth2Client(
            process.env.GOOGLE_CLIENT_ID
        );

        const ticket = await client.verifyIdToken({
            idToken: credential,
            audience: process.env.GOOGLE_CLIENT_ID
        });

        const payload = ticket.getPayload();

        if (!payload || !payload.sub) {
            return res.status(401).json({
                message: "Jeton Google invalide."
            });
        }

        const user = await findOrCreateOAuthUser(
            "google",
            payload.sub,
            payload.email,
            payload.name
        );

        return res.json({
            user: publicUser(user),
            token: issueToken(user)
        });
    } catch (error) {
        console.error("Erreur Google :", error);

        return res.status(401).json({
            message: "Tsy nekena ny jeton Google."
        });
    }
};

/* ---------------------------------------------------------------------
   CONNEXION FACEBOOK
   --------------------------------------------------------------------- */

exports.loginWithFacebook = async(req, res) => {
    try {
        const {
            accessToken
        } = req.body;

        if (!accessToken) {
            return res.status(400).json({
                message: "Tsy nomena jeton Facebook."
            });
        }

        const url =
            "https://graph.facebook.com/me" +
            `?fields=id,name,email` +
            `&access_token=${encodeURIComponent(accessToken)}`;

        const response = await fetch(url);

        if (!response.ok) {
            return res.status(401).json({
                message: "Tsy nekena ny jeton Facebook."
            });
        }

        const profile = await response.json();

        if (!profile.id) {
            return res.status(401).json({
                message: "Profil Facebook invalide."
            });
        }

        const user = await findOrCreateOAuthUser(
            "facebook",
            profile.id,
            profile.email,
            profile.name
        );

        return res.json({
            user: publicUser(user),
            token: issueToken(user)
        });
    } catch (error) {
        console.error("Erreur Facebook :", error);

        return res.status(401).json({
            message: "Tsy nekena ny jeton Facebook."
        });
    }
};

exports._internal = {
    JWT_SECRET,
    ensureProfile,
    publicUser
};