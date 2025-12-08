import wordList from "../data/wordList.json";

// Local set of allowed words (uppercase for comparisons)
const localWords = new Set((wordList as string[]).map((w) => w.toUpperCase()));

// Simple in-memory cache for API lookups
const apiCache = new Map<string, boolean>();

/**
 * Checks if a word is an English word using a local list first,
 * then falling back to dictionaryapi.dev. Results are cached in-memory.
 */
export const isEnglishWord = async (word: string): Promise<boolean> => {
  const key = word.toUpperCase();

  if (apiCache.has(key)) return apiCache.get(key)!;
  if (localWords.has(key)) {
    apiCache.set(key, true);
    return true;
  }

  try {
    const res = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${key}`);
    const ok = res.ok;
    apiCache.set(key, ok);
    return ok;
  } catch (err) {
    console.warn("Dictionary lookup failed:", err);
    apiCache.set(key, false);
    return false;
  }
};

export const isInLocalDictionary = (word: string): boolean => {
  return localWords.has(word.toUpperCase());
};
