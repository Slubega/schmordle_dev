const express = require("express");
const router = express.Router();
const { validateGuess } = require("../controllers/guessController");

router.post("/", validateGuess);

module.exports = router;
