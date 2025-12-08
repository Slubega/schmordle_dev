import React, { useState, useEffect, useCallback } from 'react';
import GameGrid from '../components/GameGrid';
import Keyboard from '../components/Keyboard';
import { useGameLogic } from '../hooks/useGameLogic';
import { fetchDailyChallenge } from '../api/daily';
import { fetchRhymeSet } from '../api/rhymeSets';
import { DailyChallengeConfig, RhymeSet } from '../interfaces/types';
import { getStats, updateStats } from '../utils/localStorageUtils';

const DailyChallenge: React.FC = () => {
  const [config, setConfig] = useState<DailyChallengeConfig | null>(null);
  const [rhymeSet, setRhymeSet] = useState<RhymeSet | null>(null);
  const [loading, setLoading] = useState(true);
  const [winWord, setWinWord] = useState<string>('');

  const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

  useEffect(() => {
    const loadDailyChallenge = async () => {
      setLoading(true);
      try {
        // Fetch config for today. This also creates one if it doesn't exist.
        const dailyConfig = await fetchDailyChallenge(today);
        setConfig(dailyConfig);
        
        // Load the rhyme set
        const rhyme = await fetchRhymeSet(dailyConfig.rhymeSetId);
        setRhymeSet(rhyme);
        
        // Check if the user has already played this daily
        const stats = getStats();
        if (stats.lastPlayedDate === today && stats.gamesPlayed > 0) {
            // NOTE: Simple check. For actual daily tracking, you'd store the result
            // (e.g., win/loss) in localStorage or Firestore along with the date.
            // For now, assume if they played today, they might be completed.
            // The full completion state is a future feature.
        }

      } catch (error) {
        console.error("Error loading daily challenge:", error);
      } finally {
        setLoading(false);
      }
    };

    loadDailyChallenge();
  }, [today]);

  const handleWin = useCallback((guess: string) => {
    updateStats(true); // Update local stats/streak
    setWinWord(guess);
    // In a future version, upload score/time to Firestore Leaderboard here.
  }, []);

  const handleLose = useCallback(() => {
    updateStats(false); // Update local stats/streak
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

  if (loading) {
    return <div className="loading-state">Loading Daily Challenge...</div>;
  }

  if (!rhymeSet || !config) {
    return <div className="error-state">Error: Could not load today's challenge configuration.</div>;
  }
  
  const stats = getStats();
  const alreadyCompleted = stats.lastPlayedDate === today && stats.gamesWon > 0 && isGameOver; // Simple win check
  const isWon = isGameOver && winWord !== '';
  
  if (alreadyCompleted) {
    return (
      <div className="game-mode-container">
        <h2>Daily Challenge: {config.date} 🗓️</h2>
        <div className="game-message result-message">
          <p className='win'>
            Completed
          </p>
          <p>You solved today's Schmordle.</p>
          <p>Come back tomorrow for a new rhyme set.</p>
        </div>
      </div>
    );
  }


  const winMessage = `You won! ${winWord} is a correct word in the ${rhymeSet.label} set. Your win has been logged (locally).`;
  const loseMessage = `Game over. The correct words included: ${rhymeSet.words.join(', ')}.`;

  return (
    <div className="game-mode-container">
      <h2>Daily Challenge: {config.date} 🗓️</h2>
      <p className="rhyme-theme">Theme: {rhymeSet.theme}</p>
      
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
          <p>Check the leaderboard (future feature) for your rank!</p>
        </div>
      )}

      {!isGameOver && <Keyboard onKey={onKey} guesses={guesses} />}
    </div>
  );
};

export default DailyChallenge;
