const express = require("express");

const router = express.Router();
const leaderboardController = require(
    "../controllers/leaderboardController"
);

router.get(
    "/",
    leaderboardController.getGlobal
);

router.get(
    "/:jeu",
    leaderboardController.getByGame
);

module.exports = router;