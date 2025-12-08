const express = require("express");
const { verifyFirebaseToken } = require("../utils/authMiddleware");
const { submitSolitaireGame } = require("../controllers/solitaireController");

const router = express.Router();

router.post("/submit", verifyFirebaseToken, submitSolitaireGame);

module.exports = router;
