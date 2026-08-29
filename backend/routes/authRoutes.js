const router = require('express').Router();
const authController = require('../controllers/authController');

router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/google', authController.loginWithGoogle);     // vérifie le jeton Google côté serveur
router.post('/facebook', authController.loginWithFacebook);  // vérifie le jeton Facebook côté serveur

module.exports = router;
