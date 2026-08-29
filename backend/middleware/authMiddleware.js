/**
 * middleware/authMiddleware.js — vérifie le JWT sur les routes protégées.
 */
const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-tsy-azo-ampiasaina-amin-ny-production';

module.exports = function requireAuth(req, res, next) {
    const header = req.headers.authorization;
    if (!header || !header.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'Tsy manana lalana hiditra.' });
    }
    try {
        const payload = jwt.verify(header.replace('Bearer ', ''), JWT_SECRET);
        req.userId = payload.sub;
        next();
    } catch (e) {
        res.status(401).json({ message: 'Jeton tsy mety na lany fe-potoana.' });
    }
};
