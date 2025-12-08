import wordList from "./wordList.json";

// Define rhyme endings we care about; all 5-letter words ending with these are included.
const RHYME_CONFIG = [
  { ending: "AKE", label: "The -AKE Crew", theme: "Warm starts and quick sparks" },
  { ending: "IGHT", label: "The -IGHT Flight", theme: "Shadows and glimmers" },
  { ending: "OUND", label: "The -OUND Soundscape", theme: "Ripples and resonances" },
  { ending: "EAST", label: "The -EAST Feast", theme: "Maps and meetups" },
  { ending: "ATCH", label: "The -ATCH Match", theme: "Snaps and surprises" }
];

const buildSet = (cfg) => {
  const words = (wordList || [])
    .map((w) => String(w).toUpperCase())
    .filter((w) => w.length === 5 && w.endsWith(cfg.ending));

  if (words.length < 4) return null; // skip tiny sets

  return {
    id: `set_${cfg.ending.toLowerCase()}`,
    label: cfg.label,
    theme: cfg.theme,
    words,
  };
};

export const rhymeSets = RHYME_CONFIG.map(buildSet).filter(Boolean);
export default rhymeSets;
