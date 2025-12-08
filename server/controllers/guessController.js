// server/controllers/guessController.js
const path = require("path");

// Build rhyme sets dynamically from the shared word list (CJS version for the server)
let rhymeSets = [];
try {
  ({ rhymeSets } = require(path.join(__dirname, "../../client/src/data/rhymeSetsGenerated.cjs")));
} catch (e) {
  console.warn("Could not load rhymeSetsGenerated.cjs for guess validation. Falling back to format-only validation.");
}

exports.validateGuess = (req, res) => {
  // Require JSON to avoid body-parser errors from form-encoded data
  if (!req.is("application/json")) {
    return res.status(400).json({ valid: false, message: "Content-Type must be application/json" });
  }

  const guessRaw = (req.body?.guess ?? "").toString();
  const rhymeSetId = req.body?.rhymeSetId;

  const guess = guessRaw.trim().toLowerCase();

  // basic format check
  if (!/^[a-z]{5}$/.test(guess)) {
    return res.status(400).json({ valid: false, message: "Guess must be exactly 5 letters." });
  }

  // If we can't/don't want to check against a set, still return valid:true for MVP
  if (!rhymeSetId || !Array.isArray(rhymeSets) || rhymeSets.length === 0) {
    return res.json({ valid: true });
  }

  const set = rhymeSets.find((s) => s.id === rhymeSetId);
  if (!set) {
    return res.status(400).json({ valid: false, message: "Unknown rhymeSetId." });
  }

  const words = (set.words || []).map((w) => String(w).toLowerCase());
  const valid = words.includes(guess);

  return res.json({ valid, message: valid ? "" : "Not in word list." });
};
