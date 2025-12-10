import { useCallback, useEffect, useState } from "react";
import type { GuessResult, RhymeSet } from "../interfaces/types";
import { checkWin, getGuessFeedback } from "../utils/gameUtils";
import { isEnglishWord } from "../utils/dictionary";

const WORD_LENGTH = 5;
const MAX_GUESSES = 6;

export const useGameLogic = (
  rhymeSet: RhymeSet | null,
  handleWin: (guess: string) => void,
  handleLose: () => void
) => {
  const [currentGuess, setCurrentGuess] = useState("");
  const [guesses, setGuesses] = useState<GuessResult[]>([]);
  const [isGameOver, setIsGameOver] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset when the rhyme set changes (including same id but new solution)
  useEffect(() => {
    setCurrentGuess("");
    setGuesses([]);
    setIsGameOver(false);
    setError(null);
  }, [rhymeSet]);

  const submitGuess = useCallback(() => {
    if (!rhymeSet) return;
    if (isGameOver) return;

    const guess = currentGuess.toUpperCase();

    if (guess.length !== WORD_LENGTH) {
      setError("Word must be 5 letters.");
      return;
    }

    void (async () => {
      try {
        // backend validation
        const res = await fetch("/api/guess", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ guess, rhymeSetId: rhymeSet.id }),
        });

        const data = await res.json().catch(() => ({} as any));

        // If backend rejects, just log; don't block local flow
        if (!res.ok || data?.valid === false) {
          console.warn("Backend validation rejected guess:", data?.message ?? "invalid");
        }

        // Dictionary validation: require a real English word unless it's one of the target rhyme words
        const isRhymeSetWord = rhymeSet.words.includes(guess);
        const isWord = isRhymeSetWord || await isEnglishWord(guess);
        if (!isWord) {
          setError("Not a valid word.");
          return;
        }

        const feedback = getGuessFeedback(guess, rhymeSet);
        const didWin = checkWin(guess, rhymeSet);
        const next: GuessResult = { guess, feedback, isWin: didWin };

        setGuesses((prev) => [...prev, next]);
        setCurrentGuess("");
        setError(null);

        if (didWin) {
          setIsGameOver(true);
          handleWin(guess);
          return;
        }

        const nextGuessCount = guesses.length + 1;
        if (nextGuessCount >= MAX_GUESSES) {
          setIsGameOver(true);
          handleLose();
        }
      } catch (e) {
        console.error("POST /api/guess failed:", e);
        setError("Backend error validating guess.");
      }
    })();
  }, [rhymeSet, isGameOver, currentGuess, guesses.length, handleWin, handleLose]);

  const onKey = useCallback(
    (key: string) => {
      if (!rhymeSet) return;
      if (isGameOver) return;

      const k = key.toUpperCase();

      // letters
      if (/^[A-Z]$/.test(k) && currentGuess.length < WORD_LENGTH) {
        setCurrentGuess((prev) => (prev + k).slice(0, WORD_LENGTH));
        return;
      }

      // backspace
      if (k === "BACKSPACE" || k === "⌫") {
        setCurrentGuess((prev) => prev.slice(0, -1));
        return;
      }

      // enter
      if (k === "ENTER") {
        submitGuess();
      }
    },
    [rhymeSet, isGameOver, currentGuess.length, submitGuess]
  );

  return { currentGuess, guesses, isGameOver, error, onKey };
};
