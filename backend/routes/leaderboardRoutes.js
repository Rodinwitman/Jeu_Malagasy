const router = require('express').Router();
const leaderboardController = require('../controllers/leaderboardController');

router.get('/global', leaderboardController.getGlobal);
router.get('/:jeu', leaderboardController.getByGame);

module.exports = router;
