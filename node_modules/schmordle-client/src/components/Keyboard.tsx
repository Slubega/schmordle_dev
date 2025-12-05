import React from 'react';
import { GuessResult, LetterState } from '../interfaces/types';

interface KeyboardProps {
  onKey: (key: string) => void;
  guesses: GuessResult[];
}

const Keyboard: React.FC<KeyboardProps> = ({ onKey, guesses }) => {
  const keyRows = [
    ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
    ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
    ['ENTER', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', 'BACKSPACE'],
  ];

  // Map of letter to its state ('correct', 'present', 'absent')
  const letterStates: Record<string, LetterState> = {};

  guesses.forEach(guess => {
    guess.feedback.forEach(tile => {
      const letter = tile.letter;
      const state = tile.state;
      
      // 'Correct' is the highest priority
      if (letterStates[letter] === 'correct') return;
      
      // Then 'present'
      if (letterStates[letter] === 'present' && state !== 'correct') return;

      // Update the state
      letterStates[letter] = state;
    });
  });

  const getKeyClass = (key: string) => {
    const state = letterStates[key];
    switch (state) {
      case 'correct':
        return 'key-correct';
      case 'present':
        return 'key-present';
      case 'absent':
        return 'key-absent';
      default:
        return 'key-default';
    }
  };

  return (
    <div className="keyboard-container">
      {keyRows.map((row, i) => (
        <div key={i} className="keyboard-row">
          {row.map((key) => (
            <button
              key={key}
              className={`key ${getKeyClass(key)} ${key.length > 1 ? 'key-large' : ''}`}
              onClick={() => onKey(key)}
            >
              {key === 'BACKSPACE' ? '⌫' : key}
            </button>
          ))}
        </div>
      ))}
    </div>
  );
};

export default Keyboard; 
