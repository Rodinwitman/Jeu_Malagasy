const express = require("express");

const router = express.Router();
const challengeController = require(
    "../controllers/challengeController"
);

const authMiddleware = require(
    "../middleware/authMiddleware"
);

router.get(
    "/today",
    challengeController.getToday
);

router.get(
    "/progress",
    authMiddleware,
    challengeController.getProgress
);

router.post(
    "/progress",
    authMiddleware,
    challengeController.updateProgress
);

router.get(
    "/stats",
    authMiddleware,
    challengeController.getStats
);

module.exports = router;