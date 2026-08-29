const router = require('express').Router();
const reviewController = require('../controllers/reviewController');
const requireAuth = require('../middleware/authMiddleware');

router.get('/:jeu', reviewController.getByGame);
router.post('/', requireAuth, reviewController.addReview);

module.exports = router;
