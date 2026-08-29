const router = require('express').Router();
const challengeController = require('../controllers/challengeController');
const requireAuth = require('../middleware/authMiddleware');

router.get('/today', challengeController.getToday);
router.get('/progress', requireAuth, challengeController.getProgress);
router.post('/progress', requireAuth, challengeController.updateProgress);
router.get('/stats', requireAuth, challengeController.getStats);

module.exports = router;
