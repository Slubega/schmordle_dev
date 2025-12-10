import React, { useState, useEffect, useCallback } from 'react';
import GameGrid from '../components/GameGrid';
import Keyboard from '../components/Keyboard';
import { useGameLogic } from '../hooks/useGameLogic';
import { getRandomRhymeSet, getThemeHint } from '../utils/gameUtils';
import { RhymeSet, UserStats } from '../interfaces/types';
import { getSolitaireStats, updateSolitaireStats } from '../utils/localStorageUtils';

const Solitaire: React.FC = () => {
  const [rhymeSet, setRhymeSet] = useState<RhymeSet | null>(null);
  const [stats, setStats] = useState<UserStats>(getSolitaireStats());
  const [winWord, setWinWord] = useState<string>('');
  
  useEffect(() => {
    // Load a random rhyme set when the component mounts
    setRhymeSet(getRandomRhymeSet());
    setStats(getSolitaireStats()); // Always load fresh stats
    setWinWord('');
  }, []);

  const handleWin = useCallback((guess: string) => {
    updateSolitaireStats(true);
    setStats(getSolitaireStats());
    setWinWord(guess);
  }, []);

  const handleLose = useCallback(() => {
    updateSolitaireStats(false);
    setStats(getSolitaireStats());
  }, []);

  const { currentGuess, guesses, isGameOver, error, onKey } = useGameLogic(
    rhymeSet, 
    handleWin, 
    handleLose
  );

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      onKey(event.key.toUpperCase());
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onKey]);

  const handleNewGame = () => {
    setRhymeSet(getRandomRhymeSet());
    setWinWord('');
  };

  if (!rhymeSet) {
    return <div className="loading-state">Loading Rhyme Set...</div>;
  }

  const isWon = isGameOver && winWord !== '';
  const winMessage = `You won! ${winWord} is a correct word in the ${rhymeSet.label} set.`;
  const loseMessage = `Game over. The correct words included: ${rhymeSet.words.join(', ')}.`;

  return (
    <div className="game-mode-container">
      <h2>Solitaire Mode 🧘</h2>
      <div className="info-box">
        <p>How it works: You get 6 guesses to find the single target word for this round.</p>
        <p>The theme is a hint for that one target word, not the whole rhyme set.</p>
        <p>You win only when you guess the target word; other rhymes are revealed after 6 misses.</p>
      </div>
      <p className="rhyme-theme">Theme: {getThemeHint(rhymeSet)}</p>
      <div className="stats-box">
        Games Played: {stats.gamesPlayed} | Wins: {stats.gamesWon} | Current Streak: {stats.currentStreak}
      </div>

      <GameGrid 
        currentGuess={currentGuess} 
        guesses={guesses} 
        isGameOver={isGameOver}
      />

      {error && <div className="game-message error-message">{error}</div>}

      {isGameOver && (
        <div className="game-message result-message">
          <p className={isWon ? 'win' : 'lose'}>
            {isWon ? winMessage : loseMessage}
          </p>
          <button onClick={handleNewGame} className="button-primary">Play Another</button>
        </div>
      )}

      {!isGameOver && <Keyboard onKey={onKey} guesses={guesses} />}
    </div>
  );
};

export default Solitaire;
