const router = require('express').Router();
const gameController = require('../controllers/gameController');

router.get('/', gameController.listGames);
router.get('/:id/niveau/:n', gameController.getLevelConfig); // paramètres du niveau N (1-300)

module.exports = router;
