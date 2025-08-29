import React from 'react';
import { useTheme } from '../hooks/useTheme';

const MoveHistory = ({ moves = [], currentPlayer }) => {
  const theme = useTheme();

  const formatTime = (milliseconds) => {
    if (!milliseconds) return '';
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const getPieceSymbol = (piece) => {
    const symbols = {
      'king': { 'white': '♔', 'black': '♚' },
      'queen': { 'white': '♕', 'black': '♛' },
      'rook': { 'white': '♖', 'black': '♜' },
      'bishop': { 'white': '♗', 'black': '♝' },
      'knight': { 'white': '♘', 'black': '♞' },
      'pawn': { 'white': '♙', 'black': '♟' }
    };
    return symbols[piece?.type]?.[piece?.color] || '';
  };

  const getSquareName = (row, col) => {
    const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
    const ranks = ['8', '7', '6', '5', '4', '3', '2', '1'];
    return files[col] + ranks[row];
  };

  // Group moves into pairs (white, black)
  const movePairs = [];
  for (let i = 0; i < moves.length; i += 2) {
    movePairs.push({
      moveNumber: Math.floor(i / 2) + 1,
      white: moves[i] || null,
      black: moves[i + 1] || null
    });
  }

  return (
    <div className={`${theme.colors.card.background} rounded-lg shadow-lg mb-4 transition-colors duration-300`}>
      {/* Move History Header */}
      <div className={`px-4 py-3 border-b ${theme.colors.border.primary} ${theme.colors.bg.tertiary} rounded-t-lg`}>
        <h3 className={`font-semibold ${theme.colors.text.primary} flex items-center`}>
          <svg className={`w-5 h-5 mr-2 ${theme.colors.text.accent}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Move History
          <span className={`ml-2 text-xs bg-blue-200 dark:bg-blue-900/30 ${theme.colors.text.accent} px-2 py-1 rounded-full`}>
            {moves.length}
          </span>
        </h3>
      </div>

      {/* Move History Content */}
      <div className={`max-h-40 overflow-y-auto p-3 ${theme.colors.bg.primary}`}>
        {moves.length === 0 ? (
          <div className={`text-center ${theme.colors.text.muted} text-sm py-8`}>
            <svg className={`w-12 h-12 mx-auto mb-2 ${theme.colors.text.muted}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} 
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p>No moves yet.</p>
            <p className="text-xs">Game will start soon!</p>
          </div>
        ) : (
          <div className="space-y-1">
            {movePairs.map((pair, index) => (
              <div 
                key={index} 
                className={`flex items-center gap-2 p-2 rounded transition-colors duration-200 ${
                  index === movePairs.length - 1 ? `${theme.colors.bg.tertiary} border ${theme.colors.border.secondary}` : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                }`}
              >
                {/* Move Number */}
                <div className={`w-8 text-center font-mono text-sm font-bold ${theme.colors.text.secondary}`}>
                  {pair.moveNumber}.
                </div>

                {/* White Move */}
                <div className="flex-1 flex items-center gap-1">
                  {pair.white ? (
                    <>
                      <span className="text-lg">{getPieceSymbol(pair.white.piece)}</span>
                      <span className={`font-mono text-sm ${theme.colors.text.primary}`}>
                        {pair.white.notation || `${getSquareName(pair.white.from.row, pair.white.from.col)}-${getSquareName(pair.white.to.row, pair.white.to.col)}`}
                      </span>
                      {pair.white.moveTime && (
                        <span className={`text-xs ${theme.colors.text.muted} ml-1`}>
                          ({formatTime(pair.white.moveTime)})
                        </span>
                      )}
                    </>
                  ) : (
                    currentPlayer === 'white' && index === movePairs.length - 1 && (
                      <span className={`text-sm ${theme.colors.text.muted} italic`}>thinking...</span>
                    )
                  )}
                </div>

                {/* Black Move */}
                <div className="flex-1 flex items-center gap-1">
                  {pair.black ? (
                    <>
                      <span className="text-lg">{getPieceSymbol(pair.black.piece)}</span>
                      <span className={`font-mono text-sm ${theme.colors.text.primary}`}>
                        {pair.black.notation || `${getSquareName(pair.black.from.row, pair.black.from.col)}-${getSquareName(pair.black.to.row, pair.black.to.col)}`}
                      </span>
                      {pair.black.moveTime && (
                        <span className={`text-xs ${theme.colors.text.muted} ml-1`}>
                          ({formatTime(pair.black.moveTime)})
                        </span>
                      )}
                    </>
                  ) : (
                    currentPlayer === 'black' && index === movePairs.length - 1 && (
                      <span className={`text-sm ${theme.colors.text.muted} italic`}>thinking...</span>
                    )
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MoveHistory;
