import React from 'react';
import { getPieceSymbol } from '../utils/chess';

const Square = ({ 
  piece, 
  isLight, 
  isSelected, 
  isValidMove, 
  isCapture,
  isInCheck, 
  onClick, 
  row, 
  col 
}) => {
  const getSquareClasses = () => {
    let classes = 'chess-square flex items-center justify-center text-4xl cursor-pointer relative transition-all duration-200 ';
    
    // Base color
    if (isLight) {
      classes += 'bg-amber-100 hover:bg-amber-200 ';
    } else {
      classes += 'bg-amber-800 hover:bg-amber-700 ';
    }
    
    // Selection state
    if (isSelected) {
      classes += 'hover:ring-2 transition-all duration-300 ring-blue-500 ring-inset bg-blue-300 scale-100 shadow-lg';
    }
    
    // Valid move indicator (all moves show as green)
    if (isValidMove || isCapture) {
      classes += 'hover:ring-2 transition-all duration-300 ring-green-500 ring-inset scale-100 shadow-lg';
    }
    
    // Check indicator
    if (isInCheck) {
      classes += 'check-animation animate-pulse';
    }
    
    return classes;
  };

  return (
    <div 
      className={getSquareClasses()}
      onClick={() => onClick(row, col)}
    >
      {/* Piece */}
      {piece && (
        <span 
          className={`chess-piece  select-none ${piece.color === 'white' ? 'text-white' : 'text-black'}`}
          style={{
            filter: piece.color === 'white' 
              ? 'drop-shadow(-1px -1px 1px #000)' 
              : 'drop-shadow(-1px -1px 1px #fff)'
          }}
        >
          {getPieceSymbol(piece)}
        </span>
      )}
      
      {/* Valid move indicator dot for all moves */}
      {(isValidMove || isCapture) && !piece && (
        <div className="absolute w-3 h-3 bg-green-500 rounded-full opacity-70 move-indicator shadow-lg"></div>
      )}
      
      {/* Move indicator for pieces that can be captured or moved to */}
      {(isValidMove || isCapture) && piece && (
        <div className="absolute inset-0 border-2 border-green-500  move-indicator shadow-lg"></div>
      )}
      
      {/* Coordinates */}
      {(row === 7 && col === 0) && (
        <>
          <div className="absolute bottom-0 right-0 text-xs opacity-50 pointer-events-none board-label">
            {String.fromCharCode(97 + col)}{8 - row}
          </div>
        </>
      )}
    </div>
  );
};

export default Square;
