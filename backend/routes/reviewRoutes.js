const express = require("express");

const router = express.Router();
const reviewController = require(
    "../controllers/reviewController"
);

const authMiddleware = require(
    "../middleware/authMiddleware"
);

router.get(
    "/:jeu",
    reviewController.getByGame
);

router.post(
    "/",
    authMiddleware,
    reviewController.addReview
);

module.exports = router;