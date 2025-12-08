const path = require("path");

const rhymeSets = (() => {
  try {
    // Reuse the client-side JSON data for now
    // eslint-disable-next-line import/no-dynamic-require, global-require
    return require(path.join(__dirname, "../../client/src/data/rhymeSets.json"));
  } catch (err) {
    console.error("Failed to load rhymeSets.json:", err);
    return [];
  }
})();

exports.getRhymeSetById = (req, res) => {
  const { id } = req.params;
  const set = Array.isArray(rhymeSets) ? rhymeSets.find((s) => s.id === id) : null;

  if (!set) {
    return res.status(404).json({ error: "Rhyme set not found" });
  }

  return res.json(set);
};
