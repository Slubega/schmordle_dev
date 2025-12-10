import React, { useEffect } from 'react';
import TileRow from './TileRow';
import { GuessResult } from '../interfaces/types';

const MAX_GUESSES = 6;

interface GameGridProps {
  currentGuess: string;
  guesses: GuessResult[];
  isGameOver: boolean;
}

const GameGrid: React.FC<GameGridProps> = ({ currentGuess, guesses, isGameOver }) => {
  
  // Listen for keyboard input on the whole window
  useEffect(() => {
    // Only listen if the game is not over (or if a specific hook is used to manage input)
    // The useGameLogic hook handles the key input, so we don't need a separate listener here
  }, []);

  const remaining = Math.max(
    0,
    MAX_GUESSES - guesses.length - (isGameOver ? 0 : 1)
  );
  const emptyRows = Array(remaining).fill(null);
  
  return (
    <div className="game-grid-container">
      <div className="game-grid">
        {/* Render submitted guesses */}
        {guesses.map((result, index) => (
          <TileRow key={index} feedback={result.feedback} isCurrent={false} />
        ))}
        
        {/* Render current typing row */}
        {!isGameOver && guesses.length < MAX_GUESSES && (
          <TileRow guess={currentGuess} isCurrent={true} />
        )}
        
        {/* Render remaining empty rows */}
        {emptyRows.map((_, index) => (
          <TileRow key={`empty-${index}`} isCurrent={false} />
        ))}
      </div>
    </div>
  );
};

export default GameGrid;
