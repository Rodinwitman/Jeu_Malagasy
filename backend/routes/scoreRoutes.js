const express = require("express");

const router = express.Router();
const scoreController = require(
    "../controllers/scoreController"
);

const authMiddleware = require(
    "../middleware/authMiddleware"
);

router.post(
    "/",
    authMiddleware,
    scoreController.addScore
);

router.get(
    "/:userId",
    authMiddleware,
    scoreController.getUserScores
);

module.exports = router;