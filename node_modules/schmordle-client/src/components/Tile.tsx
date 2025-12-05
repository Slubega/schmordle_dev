import React from 'react';
import { TileState, LetterState } from '../interfaces/types';

interface TileProps {
  tile: TileState;
}

const getStateClass = (state: LetterState): string => {
  switch (state) {
    case 'correct':
      return 'tile-correct';
    case 'present':
      return 'tile-present';
    case 'absent':
      return 'tile-absent';
    case 'empty':
    default:
      return 'tile-empty';
  }
};

const Tile: React.FC<TileProps> = ({ tile }) => {
  const stateClass = getStateClass(tile.state);
  
  return (
    <div className={`tile ${stateClass}`}>
      {tile.letter}
    </div>
  );
};

export default Tile;
