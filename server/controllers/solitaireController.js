const { db } = require("../firebase");

exports.submitSolitaireGame = async (req, res) => {
  try {
    const { guesses, won } = req.body;
    const uid = req.user.uid;

    await db.collection("solitaireGames").add({
      uid,
      guesses,
      won,
      timestamp: new Date(),
    });

    res.json({ success: true });
  } catch (err) {
    console.error("Solitaire submit error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};
