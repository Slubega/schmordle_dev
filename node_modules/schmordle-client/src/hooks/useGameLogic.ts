import { useState, useCallback, useEffect } from 'react';
import { TileState, GuessResult, RhymeSet } from '../interfaces/types';
import { getGuessFeedback, isValidGuess, checkWin } from '../utils/gameUtils';

const MAX_GUESSES = 6;
const WORD_LENGTH = 5;

// Shared game state logic hook for Solitaire/Daily/Multiplayer (input/grid logic)
export const useGameLogic = (
  rhymeSet: RhymeSet | null, 
  onWin: (guess: string) => void,
  onLose: () => void
) => {
  const [currentGuess, setCurrentGuess] = useState<string>('');
  const [guesses, setGuesses] = useState<GuessResult[]>([]);
  const [isGameOver, setIsGameOver] = useState(false);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (rhymeSet) {
        // Reset state when a new rhyme set is loaded
        setCurrentGuess('');
        setGuesses([]);
        setIsGameOver(false);
        setError('');
    }
  }, [rhymeSet]);

  const onKey = useCallback((key: string) => {
    if (isGameOver || !rhymeSet) return;

    if (key === 'ENTER') {
      submitGuess();
    } else if (key === 'BACKSPACE') {
      setCurrentGuess((prev) => prev.slice(0, -1));
    } else if (key.length === 1 && /^[a-zA-Z]$/.test(key)) {
      if (currentGuess.length < WORD_LENGTH) {
        setCurrentGuess((prev) => prev + key.toUpperCase());
      }
    }
  }, [currentGuess, isGameOver, rhymeSet]);

  const submitGuess = useCallback(() => {
    if (currentGuess.length !== WORD_LENGTH) {
      setError('Not enough letters!');
      setTimeout(() => setError(''), 1000);
      return;
    }

    if (!rhymeSet) {
        setError("Game not initialized.");
        return;
    }

    // Check against the full word list (can be relaxed for a full dictionary check later)
    if (!rhymeSet.words.includes(currentGuess)) {
      setError('Word not in rhyme set (yet)!');
      setTimeout(() => setError(''), 1000);
      return;
    }

    // 1. Generate feedback
    const feedback: TileState[] = getGuessFeedback(currentGuess, rhymeSet);
    const isWin = checkWin(currentGuess, rhymeSet);
    
    const newGuessResult: GuessResult = {
        guess: currentGuess,
        feedback,
        isWin,
    }

    // 2. Update state
    setGuesses((prev) => [...prev, newGuessResult]);
    setCurrentGuess('');

    // 3. Check for game over
    if (isWin) {
      setIsGameOver(true);
      onWin(currentGuess);
      return;
    }

    if (guesses.length + 1 >= MAX_GUESSES) {
      setIsGameOver(true);
      onLose();
    }

  }, [currentGuess, guesses.length, rhymeSet, onWin, onLose]);

  return {
    currentGuess,
    guesses,
    isGameOver,
    error,
    onKey,
    submitGuess,
  };
}; 
