const path = require("path");

const rhymeSets = (() => {
  try {
    // Build from the shared generator (CJS for server)
    // eslint-disable-next-line import/no-dynamic-require, global-require
    return require(path.join(__dirname, "../../client/src/data/rhymeSetsGenerated.cjs")).rhymeSets;
  } catch (err) {
    console.error("Failed to load rhymeSetsGenerated.cjs:", err);
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
