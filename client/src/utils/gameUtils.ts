import { RhymeSet, TileState } from '../interfaces/types';
import rhymeSets from '../data/rhymeSets.json';

const pickRandom = <T,>(items: T[]): T => items[Math.floor(Math.random() * items.length)];

// Utility to get a random rhyme set from the local JSON data, selecting a random target word for this session.
export const getRandomRhymeSet = (): RhymeSet => {
  const sets = rhymeSets as unknown as RhymeSet[];
  const randomSet = pickRandom(sets);
  const solutionWord = pickRandom(randomSet.words);

  // Return a copy so we don't mutate the base dataset
  return { ...randomSet, solutionWord };
};

// For now, the "solution" is the first word in the set.
// This keeps the game winnable without leaking the answer up front.
export const getSolutionWord = (rhymeSet: RhymeSet): string => {
  return (rhymeSet.solutionWord || rhymeSet.words[0] || "").toUpperCase();
};

// Returns a theme/hint for the current target word, falling back to the generic set theme.
export const getThemeHint = (rhymeSet: RhymeSet): string => {
  const target = getSolutionWord(rhymeSet);
  return rhymeSet.wordThemes?.[target] ?? rhymeSet.theme;
};

/**
 * Generates the Wordle-style tile coloring feedback for a guess against the rhyme set.
 * In Schmordle, the 'solution' is the entire rhyme set. We check against all words
 * in the set to determine 'present' and 'absent' status.
 * @param guess The player's guessed 5-letter word.
 * @param rhymeSet The set of valid winning words.
 * @returns An array of TileState for each letter.
 */
export const getGuessFeedback = (guess: string, rhymeSet: RhymeSet): TileState[] => {
  const guessUpper = guess.toUpperCase();
  const targetWord = getSolutionWord(rhymeSet);
  const targetLetters = targetWord.split('');
  
  // To handle duplicate letters, we create a mutable map of available letters in the target.
  const targetLetterMap: { [key: string]: number } = {};
  for (const letter of targetLetters) {
    targetLetterMap[letter] = (targetLetterMap[letter] || 0) + 1;
  }

  // Pass 1: Find 'correct' (green) letters
  const guessLetters = guessUpper.split('');
  const result: TileState[] = guessLetters.map(letter => ({ letter, state: 'absent' })); // Default state
  
  for (let i = 0; i < guessLetters.length; i++) {
    if (guessLetters[i] === targetLetters[i]) {
      result[i].state = 'correct';
      targetLetterMap[guessLetters[i]]!--;
    }
  }

  // Pass 2: Find 'present' (yellow) letters
  for (let i = 0; i < guessLetters.length; i++) {
    if (result[i].state === 'correct') continue;

    const letter = guessLetters[i];
    if (targetLetterMap[letter] && targetLetterMap[letter] > 0) {
      result[i].state = 'present';
      targetLetterMap[letter]!--;
    } else {
      result[i].state = 'absent';
    }
  }

  return result;
};

// Check if a word is a valid 5-letter word in the current rhyme set.
export const isValidGuess = (guess: string, rhymeSet: RhymeSet): boolean => {
  return guess.length === 5 && rhymeSet.words.includes(guess.toUpperCase());
};

// Check if the current game is won.
export const checkWin = (guess: string, rhymeSet: RhymeSet): boolean => {
  return guess.toUpperCase() === getSolutionWord(rhymeSet);
};
