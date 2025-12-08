const wordList = require("./wordList.json");

const RHYME_CONFIG = [
  { ending: "AKE", label: "The -AKE Group", theme: "Common words ending in -AKE" },
  { ending: "IGHT", label: "The -IGHT Group", theme: "Illumination and intensity" },
  { ending: "OUND", label: "The -OUND Group", theme: "Noises and vibrations without naming them" },
  { ending: "EAST", label: "The -EAST Group", theme: "Directions and least/feast beats" },
  { ending: "ATCH", label: "The -ATCH Group", theme: "Quick grabs and matches" },
];

const buildSet = (cfg) => {
  const words = (wordList || [])
    .map((w) => String(w).toUpperCase())
    .filter((w) => w.length === 5 && w.endsWith(cfg.ending));

  if (words.length < 4) return null;

  return {
    id: `set_${cfg.ending.toLowerCase()}`,
    label: cfg.label,
    theme: cfg.theme,
    words,
  };
};

const rhymeSets = RHYME_CONFIG.map(buildSet).filter(Boolean);

module.exports = { rhymeSets };
