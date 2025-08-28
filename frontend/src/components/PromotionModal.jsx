import React from 'react';
import { getPieceSymbol } from '../utils/chess';
import { useTheme } from '../hooks/useTheme';

const PromotionModal = ({ isOpen, playerColor, onSelect, onCancel }) => {
  const theme = useTheme();
  
  if (!isOpen) return null;

  const promotionPieces = [
    { type: 'queen', name: 'Queen' },
    { type: 'rook', name: 'Rook' },
    { type: 'bishop', name: 'Bishop' },
    { type: 'knight', name: 'Knight' }
  ];

  const handleSelect = (pieceType) => {
    onSelect(pieceType);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className={`${theme.colors.card.background} rounded-lg p-4 lg:p-6 shadow-xl max-w-md w-full mx-4 transition-colors duration-300`}>
        <div className="text-center mb-6">
          <h2 className={`text-xl lg:text-2xl font-bold ${theme.colors.text.primary} mb-2 flex items-center justify-center`}>
            <svg className="w-6 h-6 mr-2 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" clipRule="evenodd" />
            </svg>
            Pawn Promotion
          </h2>
          <p className={theme.colors.text.secondary}>
            Choose a piece to promote your pawn to:
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6">
          {promotionPieces.map((piece) => (
            <button
              key={piece.type}
              onClick={() => handleSelect(piece.type)}
              className={`flex flex-col items-center p-4 border-2 ${theme.colors.border.primary} rounded-lg hover:border-blue-500 ${theme.colors.bg.hover} transition-all duration-200 group`}
            >
              <div className="text-4xl lg:text-6xl mb-2 transition-transform duration-200 group-hover:scale-110">
                {getPieceSymbol({ type: piece.type, color: playerColor })}
              </div>
              <span className={`text-sm lg:text-lg font-medium ${theme.colors.text.primary} group-hover:text-blue-700`}>
                {piece.name}
              </span>
            </button>
          ))}
        </div>

        <div className="text-center">
          <button
            onClick={onCancel}
            className={`px-4 py-2 ${theme.colors.text.secondary} hover:${theme.colors.text.primary} transition-colors duration-200`}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default PromotionModal;
