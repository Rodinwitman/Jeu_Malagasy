const router = require('express').Router();
const scoreController = require('../controllers/scoreController');
const requireAuth = require('../middleware/authMiddleware');

router.post('/', requireAuth, scoreController.addScore);
router.get('/user/:userId', scoreController.getUserScores);

module.exports = router;
