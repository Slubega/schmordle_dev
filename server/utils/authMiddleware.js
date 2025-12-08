const { auth } = require("../firebase");

exports.verifyFirebaseToken = async (req, res, next) => {
  const authHeader = req.headers.authorization || "";
  const match = authHeader.match(/^Bearer (.+)$/);

  if (!match) return res.status(401).json({ error: "Missing auth token" });

  const idToken = match[1];

  try {
    const decoded = await auth.verifyIdToken(idToken);
    req.user = decoded;
    next();
  } catch (err) {
    console.error("Auth error:", err);
    return res.status(401).json({ error: "Invalid token" });
  }
};
