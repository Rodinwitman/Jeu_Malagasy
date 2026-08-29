const express = require("express");

const router = express.Router();
const authController = require(
    "../controllers/authController"
);

router.post(
    "/register",
    authController.register
);

router.post(
    "/login",
    authController.login
);

router.post(
    "/google",
    authController.loginWithGoogle
);

router.post(
    "/facebook",
    authController.loginWithFacebook
);

module.exports = router;