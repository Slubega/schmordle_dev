import React from 'react';
import Tile from './Tile';
import { TileState } from '../interfaces/types';

const WORD_LENGTH = 5;

interface TileRowProps {
  guess?: string; // The word typed so far
  feedback?: TileState[]; // Feedback from a submitted guess
  isCurrent: boolean;
}

const TileRow: React.FC<TileRowProps> = ({ guess = '', feedback, isCurrent }) => {
  let tiles: TileState[];

  if (feedback) {
    // Submitted guess with feedback
    tiles = feedback;
  } else {
    // Current or empty row
    tiles = Array(WORD_LENGTH)
      .fill(null)
      .map((_, i) => ({
        letter: guess[i] || '',
        state: i < guess.length ? 'empty' : 'empty', // No coloring until submitted
      }));
  }

  const rowClass = isCurrent && guess.length > 0 ? 'tile-row-current' : '';

  return (
    <div className={`tile-row ${rowClass}`}>
      {tiles.map((tile, index) => (
        <Tile key={index} tile={tile} />
      ))}
    </div>
  );
};

export default TileRow; 
