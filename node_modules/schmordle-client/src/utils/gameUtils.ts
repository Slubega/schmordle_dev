import { RhymeSet, TileState, LetterState } from '../interfaces/types';
import rhymeSets from '../data/rhymeSets.json';

// Utility to get a random rhyme set from the local JSON data.
export const getRandomRhymeSet = (): RhymeSet => {
  const sets = rhymeSets as RhymeSet[];
  const randomIndex = Math.floor(Math.random() * sets.length);
  return sets[randomIndex];
};

// For now, the "solution" is the first word in the set.
// This keeps the game winnable without leaking the answer up front.
const getSolutionWord = (rhymeSet: RhymeSet): string => {
  return (rhymeSet.words[0] || "").toUpperCase();
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
  const feedback: TileState[] = [];
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
