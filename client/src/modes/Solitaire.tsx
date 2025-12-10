import React, { useState, useEffect, useCallback } from 'react';
import GameGrid from '../components/GameGrid';
import Keyboard from '../components/Keyboard';
import { useGameLogic } from '../hooks/useGameLogic';
import { getRandomRhymeSet, getThemeHint, getSolutionWord } from '../utils/gameUtils';
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
  const targetWord = getSolutionWord(rhymeSet);
  const winMessage = `You won! The word was ${winWord}.`;
  const loseMessage = `Game over. The word was ${targetWord}.`;

  return (
    <div className="game-mode-container">
      <h2>Arcade Solo</h2>
      <div className="info-box">
        <p>Guess the single target word in up to 6 tries, then instantly roll into the next round.</p>
        <p>The theme hints at the target word (not the entire rhyme set).</p>
        <p>Win or lose, hit Play Another to keep the arcade streak going.</p>
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
