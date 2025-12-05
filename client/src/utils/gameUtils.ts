import { RhymeSet, TileState, LetterState } from '../interfaces/types';
import rhymeSets from '../data/rhymeSets.json';

// Utility to get a random rhyme set from the local JSON data.
export const getRandomRhymeSet = (): RhymeSet => {
  const sets = rhymeSets as RhymeSet[];
  const randomIndex = Math.floor(Math.random() * sets.length);
  return sets[randomIndex];
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
  const words = rhymeSet.words.map(w => w.toUpperCase());

  // Check for an exact win first
  const isWin = words.includes(guessUpper);

  if (isWin) {
    // If the word is a win, all tiles are correct
    for (const letter of guessUpper) {
      feedback.push({ letter, state: 'correct' });
    }
    return feedback;
  }

  // --- Core Wordle logic for non-winning words ---
  
  // 1. Identify 'correct' letters (green) by comparing against all possible solution words.
  //    A letter is 'correct' if it's in the correct position in *any* word in the set.
  //    This makes the game harder/different than standard Wordle.

  // NOTE: For simplicity and the spirit of Schmordle (where only a full win matters),
  // we'll revert to the standard Wordle coloring but *only* for feedback,
  // where the 'solution' is an *arbitrary* word from the set.
  // Let's use the first word in the set for the coloring logic.
  const targetWord = words[0]; 
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
  return rhymeSet.words.includes(guess.toUpperCase());
};
