import React from 'react';
import { FaChessKing, FaChessQueen, FaChessRook, FaChessBishop, FaChessKnight, FaChessPawn } from 'react-icons/fa';
import { useTheme } from '../hooks/useTheme';

const CapturedPieces = ({ capturedPieces }) => {
  const theme = useTheme();
  const pieceIcons = {
    k: <FaChessKing className="text-lg" />,
    q: <FaChessQueen className="text-lg" />,
    r: <FaChessRook className="text-lg" />,
    b: <FaChessBishop className="text-lg" />,
    n: <FaChessKnight className="text-lg" />,
    p: <FaChessPawn className="text-lg" />,
    king: <FaChessKing className="text-lg" />,
    queen: <FaChessQueen className="text-lg" />,
    rook: <FaChessRook className="text-lg" />,
    bishop: <FaChessBishop className="text-lg" />,
    knight: <FaChessKnight className="text-lg" />,
    pawn: <FaChessPawn className="text-lg" />,
  };

  const pieceValues = {
    pawn: 1,
    knight: 3,
    bishop: 3,
    rook: 5,
    queen: 9,
    king: 0,
    p: 1,
    n: 3,
    b: 3,
    r: 5,
    q: 9,
    k: 0,
  };

  // Helper to render captured pieces for a specific color
  const renderCapturedPiecesForColor = (pieces, color) => {
    if (!pieces || pieces.length === 0) {
      return (
        <div className="text-center py-4">
          <span className={`${theme.colors.text.muted} text-sm italic`}>No captures yet</span>
        </div>
      );
    }

    // Count pieces by type
    const counts = {};
    let totalValue = 0;
    
    pieces.forEach(piece => {
      if (!piece || !piece.type) return;
      const type = piece.type;
      counts[type] = (counts[type] || 0) + 1;
      totalValue += pieceValues[type] || 0;
    });

    return (
      <div className="space-y-2">
        <div className="flex flex-wrap gap-1 justify-center min-h-[2rem]">
          {Object.entries(counts).map(([type, count]) => {
            const iconKey = type;
            return (
              <div 
                key={type} 
                className={`flex items-center ${theme.colors.bg.tertiary} rounded-md px-2 py-1 border ${theme.colors.border.primary} shadow-sm transition-colors duration-300`}
              >
                <span className={color === 'white' ? theme.colors.text.primary : theme.colors.text.secondary}>
                  {pieceIcons[iconKey]}
                </span>
                {count > 1 && (
                  <span className={`ml-1 text-xs font-bold ${theme.colors.text.secondary}`}>
                    ×{count}
                  </span>
                )}
              </div>
            );
          })}
        </div>
        {totalValue > 0 && (
          <div className="text-center">
            <span className={`text-xs ${theme.colors.text.muted} font-medium`}>
              Material: +{totalValue}
            </span>
          </div>
        )}
      </div>
    );
  };

  // Calculate material advantage
  const calculateMaterialAdvantage = () => {
    if (!capturedPieces) return null;
    
    const whiteCaptured = capturedPieces.white || [];
    const blackCaptured = capturedPieces.black || [];
    
    const whiteValue = whiteCaptured.reduce((sum, piece) => {
      return sum + (pieceValues[piece?.type] || 0);
    }, 0);
    
    const blackValue = blackCaptured.reduce((sum, piece) => {
      return sum + (pieceValues[piece?.type] || 0);
    }, 0);
    
    const advantage = whiteValue - blackValue;
    return { advantage, whiteValue, blackValue };
  };

  const materialInfo = calculateMaterialAdvantage();
  
  return (
    <div className={`${theme.colors.card.background} rounded-xl shadow-lg border ${theme.colors.card.border} overflow-hidden transition-colors duration-300`}>
      {/* Header */}
      <div className={`${theme.colors.bg.tertiary} px-4 py-3 border-b ${theme.colors.border.primary}`}>
        <h3 className={`text-lg font-semibold ${theme.colors.text.primary} text-center`}>
          Captured Pieces
        </h3>
        {materialInfo && materialInfo.advantage !== 0 && (
          <div className="text-center mt-1">
            <span className={`text-sm font-medium ${
              materialInfo.advantage > 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              {materialInfo.advantage > 0 ? 'White' : 'Black'} +{Math.abs(materialInfo.advantage)}
            </span>
          </div>
        )}
      </div>

      {/* Captured pieces display */}
      <div className="p-4 space-y-4">
        {/* White's captures (pieces taken by white) */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className={`text-sm font-medium ${theme.colors.text.primary}`}>
              By White:
            </span>
            <span className={`text-xs ${theme.colors.text.muted}`}>
              {capturedPieces?.white?.length || 0} pieces
            </span>
          </div>
          {renderCapturedPiecesForColor(capturedPieces?.white, 'black')}
        </div>

        {/* Divider */}
        <div className={`border-t ${theme.colors.border.primary}`}></div>

        {/* Black's captures (pieces taken by black) */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className={`text-sm font-medium ${theme.colors.text.primary}`}>
              By Black:
            </span>
            <span className={`text-xs ${theme.colors.text.muted}`}>
              {capturedPieces?.black?.length || 0} pieces
            </span>
          </div>
          {renderCapturedPiecesForColor(capturedPieces?.black, 'white')}
        </div>
      </div>
    </div>
  );
};

export default CapturedPieces;
