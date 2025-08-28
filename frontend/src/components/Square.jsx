import React from 'react';
import { getPieceSymbol } from '../utils/chess';
import { useTheme } from '../hooks/useTheme';

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
  const theme = useTheme();
  
  const getSquareClasses = () => {
    let classes = 'chess-square aspect-square w-10 sm:w-12 md:w-14 lg:w-16 flex items-center justify-center text-lg sm:text-xl md:text-2xl lg:text-3xl cursor-pointer relative transition-all duration-200 leading-none box-border ';
    
    // Base color with theme support
    if (isLight) {
      classes += `${theme.colors.chess.lightSquare} hover:brightness-110 `;
    } else {
      classes += `${theme.colors.chess.darkSquare} hover:brightness-110 `;
    }
    
    // Selection state
    if (isSelected) {
      classes += `hover:ring-2 transition-all duration-300 ring-blue-500 ring-inset ${theme.colors.chess.highlight} scale-100 shadow-lg`;
    }
    
    // Valid move indicator (all moves show as green)
    if (isValidMove || isCapture) {
      classes += `hover:ring-2 transition-all duration-300 ring-green-500 ring-inset scale-100 shadow-lg`;
    }
    
    // Check indicator
    if (isInCheck) {
      classes += `check-animation animate-pulse ${theme.colors.chess.check}`;
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
          className={`chess-piece select-none ${piece.color === 'white' ? 'text-white' : 'text-black'}`}
          style={{
            filter: piece.color === 'white' 
              ? 'drop-shadow(-1px -1px 1px #000)' 
              : 'drop-shadow(-1px -1px 1px #fff)',
            fontSize: 'inherit'
          }}
        >
          {getPieceSymbol(piece)}
        </span>
      )}
      
      {/* Valid move indicator dot for all moves */}
      {(isValidMove || isCapture) && !piece && (
        <div className={`absolute w-2 h-2 sm:w-2.5 sm:h-2.5 md:w-3 md:h-3 ${theme.colors.chess.possibleMove} rounded-full opacity-70 move-indicator shadow-lg`}></div>
      )}
      
      {/* Move indicator for pieces that can be captured or moved to */}
      {(isValidMove || isCapture) && piece && (
        <div className={`absolute inset-0 border-2 ${theme.colors.chess.capture} move-indicator shadow-lg`}></div>
      )}
      
    </div>
  );
};

export default Square;
