const { db } = require("../firebase");
const dayjs = require("dayjs");
const path = require("path");
const fs = require("fs");

const OFFLINE_MODE = process.env.OFFLINE_DAILY === "true";
const ALLOW_LOCAL_FALLBACK = process.env.ALLOW_LOCAL_DAILY_FALLBACK !== "false"; // default true
const RHYME_SETS_PATH = path.join(__dirname, "../../client/src/data/rhymeSets.json");

const loadLocalRhymeSets = () => {
  try {
    const raw = fs.readFileSync(RHYME_SETS_PATH, "utf-8");
    return JSON.parse(raw);
  } catch (err) {
    console.error("Failed to read local rhymeSets.json:", err);
    return [];
  }
};

// RETURNS today's challenge
exports.getDailyChallenge = async (req, res) => {
  try {
    const requestedDate = req.query.date || dayjs().format("YYYY-MM-DD");

    // Allow a local fallback for dev without Firestore
    if (OFFLINE_MODE) {
      const sets = loadLocalRhymeSets();
      if (!Array.isArray(sets) || sets.length === 0) {
        return res.status(500).json({ error: "No local rhyme sets available." });
      }
      const randomIndex = Math.floor(Math.random() * sets.length);
      const rhymeSet = sets[randomIndex];
      return res.json({
        date: requestedDate,
        rhymeSetId: rhymeSet.id,
        source: "local-fallback",
      });
    }

    const docRef = db.collection("dailyChallenges").doc(requestedDate);
    const docSnap = await docRef.get();

    if (!docSnap.exists) {
      if (ALLOW_LOCAL_FALLBACK) {
        const sets = loadLocalRhymeSets();
        if (!Array.isArray(sets) || sets.length === 0) {
          return res.status(404).json({
            error: `Daily challenge not found for ${requestedDate} and no local fallback available`,
          });
        }
        const randomIndex = Math.floor(Math.random() * sets.length);
        const rhymeSet = sets[randomIndex];
        return res.json({
          date: requestedDate,
          rhymeSetId: rhymeSet.id,
          source: "local-fallback-missing-doc",
        });
      }

      return res.status(404).json({
        error: `Daily challenge not found for ${requestedDate}`,
      });
    }

    return res.json(docSnap.data());
  } catch (err) {
    console.error("Error getting daily challenge:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

// USER submits today's completion
exports.submitDailyCompletion = async (req, res) => {
  try {
    const uid = req.user.uid; // comes from auth middleware
    const today = dayjs().format("YYYY-MM-DD");

    await db
      .collection("users")
      .doc(uid)
      .set(
        {
          dailyCompletions: {
            [today]: true,
          },
        },
        { merge: true }
      );

    return res.json({ success: true });
  } catch (err) {
    console.error("Error submitting completion:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};
