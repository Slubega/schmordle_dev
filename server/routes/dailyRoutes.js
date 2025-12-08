const express = require("express");
const router = express.Router();
const { verifyFirebaseToken } = require("../utils/authMiddleware");
const {
  getDailyChallenge,
  submitDailyCompletion,
} = require("../controllers/dailyController");

// Public: get today's challenge
router.get("/", getDailyChallenge);

// Protected: submit completion
router.post("/complete", verifyFirebaseToken, submitDailyCompletion);

module.exports = router;
