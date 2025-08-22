import React from 'react';

const GameInfo = ({ 
  currentPlayer, 
  gameStatus, 
  moveHistory, 
  capturedPieces,
  onNewGame,
  onUndoMove 
}) => {
  const getStatusColor = () => {
    if (gameStatus.includes('checkmate')) return 'text-green-600';
    if (gameStatus === 'check') return 'text-red-600';
    return 'text-blue-600';
  };

  const getStatusIcon = () => {
    if (gameStatus.includes('checkmate')) return (
      <svg className="w-6 h-6 inline-block mr-2 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" clipRule="evenodd" />
      </svg>
    );
    if (gameStatus === 'check') return (
      <svg className="w-6 h-6 inline-block mr-2 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z" />
      </svg>
    );
    return (
      <svg className="w-6 h-6 inline-block mr-2 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    );
  };

  const formatMove = (move, index) => {
    const { from, to, piece, captured } = move;
    const fromSquare = String.fromCharCode(97 + from.col) + (8 - from.row);
    const toSquare = String.fromCharCode(97 + to.col) + (8 - to.row);
    const pieceSymbol = getPieceSymbol(piece);
    const captureSymbol = captured ? 'x' : '-';
    
    return `${Math.floor(index / 2) + 1}${index % 2 === 0 ? '.' : '...'} ${pieceSymbol}${fromSquare}${captureSymbol}${toSquare}`;
  };

  const getPieceSymbol = (piece) => {
    const symbols = {
      king: 'K',
      queen: 'Q',
      rook: 'R',
      bishop: 'B',
      knight: 'N',
      pawn: ''
    };
    return symbols[piece.type] || '';
  };

  const renderPieceIcon = (piece) => {
    const isWhite = piece.color === 'white';
    const pieceType = piece.type;
    
    // Chess piece SVG icons
    const pieceIcons = {
      king: (
        <svg className="w-6 h-6" viewBox="0 0 45 45" fill={isWhite ? "#fff" : "#000"} stroke="#000" strokeWidth="1.5">
          <g style={{ fill: isWhite ? "#fff" : "#000", stroke: "#000", strokeWidth: "1.5", strokeLinecap: "round", strokeLinejoin: "round" }}>
            <path d="M22.5,11.63V6M20,8h5M22.5,25s4.5-7.5,3-10.5c0,0-1-2.5-3-2.5s-3,2.5-3,2.5c-1.5,3,3,10.5,3,10.5" fill={isWhite ? "#fff" : "#000"} stroke="#000" strokeLinejoin="miter" />
            <path d="M11.5,37c5.5,3.5,15.5,3.5,21,0v-7s9-4.5,6-10.5c-4-6.5-13.5-3.5-16,4V27v-3.5c-3.5-7.5-13-10.5-16-4-3,6,5,10,5,10V37z" />
            <path d="M11.5,30c5.5-3,15.5-3,21,0M11.5,33.5c5.5-3,15.5-3,21,0M11.5,37c5.5-3,15.5-3,21,0" />
          </g>
        </svg>
      ),
      queen: (
        <svg className="w-6 h-6" viewBox="0 0 45 45" fill={isWhite ? "#fff" : "#000"} stroke="#000" strokeWidth="1.5">
          <g style={{ fill: isWhite ? "#fff" : "#000", stroke: "#000", strokeWidth: "1.5", strokeLinecap: "round", strokeLinejoin: "round" }}>
            <path d="M8,12a2,2 0 1,1 -4,0 2,2 0 1,1 4,0zM24.5,7.5a2,2 0 1,1 -4,0 2,2 0 1,1 4,0zM41,12a2,2 0 1,1 -4,0 2,2 0 1,1 4,0zM16,8.5a2,2 0 1,1 -4,0 2,2 0 1,1 4,0zM33,9a2,2 0 1,1 -4,0 2,2 0 1,1 4,0z" />
            <path d="M9,26c8.5-1.5,21-1.5,27,0l2-12-7,11V11l-5.5,13.5-3-15-3,15-5.5-13.5V25L7,14L9,26z" />
            <path d="M9,26c0,2,1.5,2,2.5,4,1,1.5,1,1,0.5,3.5-1.5,1-1.5,2.5-1.5,2.5-1.5,1.5.5,2.5.5,2.5,6.5,1,16.5,1,23,0,0,0,2-1,0.5-2.5,0,0,0-1.5-1.5-2.5-.5-2.5-.5-2,0.5-3.5,1-2,2.5-2,2.5-4-8.5-1.5-18.5-1.5-27,0z" />
            <path d="M11.5,30c3.5-1,18.5-1,22,0M12,33.5c6-1,15-1,21,0" />
          </g>
        </svg>
      ),
      rook: (
        <svg className="w-6 h-6" viewBox="0 0 45 45" fill={isWhite ? "#fff" : "#000"} stroke="#000" strokeWidth="1.5">
          <g style={{ fill: isWhite ? "#fff" : "#000", stroke: "#000", strokeWidth: "1.5", strokeLinecap: "round", strokeLinejoin: "round" }}>
            <path d="M9,39h27v-3H9v3zM12,36v-4h21v4H12zM11,14V9h4v2h5V9h5v2h5V9h4v5" stroke="#000" strokeLinecap="butt" />
            <path d="M34,14l-3,3H14l-3-3" />
            <path d="M31,17v12.5H14V17" strokeLinecap="butt" strokeLinejoin="miter" />
            <path d="M31,29.5l1.5,2.5h-20l1.5-2.5" />
            <path d="M11,14h23" fill="none" stroke="#000" strokeLinejoin="miter" />
          </g>
        </svg>
      ),
      bishop: (
        <svg className="w-6 h-6" viewBox="0 0 45 45" fill={isWhite ? "#fff" : "#000"} stroke="#000" strokeWidth="1.5">
          <g style={{ fill: isWhite ? "#fff" : "#000", stroke: "#000", strokeWidth: "1.5", strokeLinecap: "round", strokeLinejoin: "round" }}>
            <g fill={isWhite ? "#fff" : "#000"}>
              <path d="M9,36c3.39-.97,10.11.43,13.5-2,3.39,2.43,10.11,1.03,13.5,2,0,0,1.65.54,3,2-.68.97-1.65.99-3,0.5-3.39-.97-10.11.46-13.5-1-3.39,1.46-10.11.03-13.5,1-1.354.49-2.323.47-3-.5,1.354-1.94,3-2,3-2z" />
              <path d="M15,32c2.5,2.5,12.5,2.5,15,0,0.5-1.5,0-2,0-2,0-2.5-2.5-4-2.5-4,5.5-1.5,6-11.5-5-15.5-11,4-10.5,14-5,15.5,0,0-2.5,1.5-2.5,4,0,0-0.5.5,0,2z" />
              <path d="M25,8a2.5,2.5,0,1,1-5,0,2.5,2.5,0,1,1,5,0z" />
              <path d="M17.5,26h10M15,30h15m-7.5-14.5v5M20,18h5" stroke="#000" strokeLinecap="butt" strokeLinejoin="miter" />
            </g>
          </g>
        </svg>
      ),
      knight: (
        <svg className="w-6 h-6" viewBox="0 0 45 45" fill={isWhite ? "#fff" : "#000"} stroke="#000" strokeWidth="1.5">
          <g style={{ fill: isWhite ? "#fff" : "#000", stroke: "#000", strokeWidth: "1.5", strokeLinecap: "round", strokeLinejoin: "round" }}>
            <path d="M22,10c10.5,1,16.5,8,16,29H15c0-9,10-6.5,8-21" />
            <path d="M24,18c.38,2.91-5.55,7.37-8,9-3,2-2.82,4.34-5,4-1.042-.94,1.41-3.04,0-3-1,3.06-1.866,2.46-3.5,3.5-3.5,0-3.5-1.5-3.5-1.5-.5-1.5,1-2.5,1-2.5-7.5-1.5-7.5-2.5-7.5-2.5,1.5-1,2.5-2.5,2.5-2.5C8.5,14.5,12.5,12,16,12s5.5,3,7.5,4s3.5,0,4.5,2.5S24,18,24,18z" />
            <path d="M9.5,25.5a0.5,0.5,0,1,1-1,0a0.5,0.5,0,1,1,1,0z" fill="#000" stroke="#000" />
            <path d="M14.933,15.75a0.25,1.25,30,1,1-.5,-0.866a0.25,1.25,30,1,1,.5,0.866z" fill="#000" stroke="#000" strokeWidth="1.49997" />
          </g>
        </svg>
      ),
      pawn: (
        <svg className="w-6 h-6" viewBox="0 0 45 45" fill={isWhite ? "#fff" : "#000"} stroke="#000" strokeWidth="1.5">
          <path d="M22.5,9c-2.21,0-4,1.79-4,4,0,0.89,0.29,1.71,0.78,2.38C17.33,16.5,16,18.59,16,21c0,2.03,0.94,3.84,2.41,5.03-3,1.06-7.41,5.55-7.41,13.47h23c0-7.92-4.41-12.41-7.41-13.47C27.06,24.84,28,23.03,28,21c0-2.41-1.33-4.5-3.28-5.62C25.21,14.71,25.5,13.89,25.5,13c0-2.21-1.79-4-4-4z" fill={isWhite ? "#fff" : "#000"} stroke="#000" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      )
    };

    return pieceIcons[pieceType] || null;
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 w-80 card-hover fade-in">
      {/* Game Status */}
      <div className="text-center mb-6">
        <div className={`text-2xl font-bold ${getStatusColor()} mb-2`}>
          {getStatusIcon()} Game Status
        </div>
        <div className="text-lg text-gray-700">
          {gameStatus.includes('checkmate') 
            ? `${gameStatus.includes('white') ? 'White' : 'Black'} Wins!`
            : gameStatus === 'check'
            ? `${currentPlayer === 'white' ? 'White' : 'Black'} in Check`
            : `${currentPlayer === 'white' ? 'White' : 'Black'} to Move`
          }
        </div>
      </div>

      {/* Player Turn Indicator */}
      <div className="flex items-center justify-center mb-6">
        <div className={`w-4 h-4 rounded-full mr-2 transition-all duration-300 ${
          currentPlayer === 'white' ? 'bg-gray-200 border-2 border-gray-400 shadow-lg animate-pulse' : 'bg-gray-800'
        }`}></div>
        <span className="font-medium text-gray-700">
          {currentPlayer === 'white' ? 'White' : 'Black'} Turn
        </span>
        <div className={`w-4 h-4 rounded-full ml-2 transition-all duration-300 ${
          currentPlayer === 'black' ? 'bg-gray-800 shadow-lg animate-pulse' : 'bg-gray-200 border-2 border-gray-400'
        }`}></div>
      </div>

      {/* Captured Pieces */}
      <div className="mb-6">
        <h3 className="font-semibold text-gray-700 mb-3">Captured Pieces</h3>
        
        {/* White Captured */}
        <div className="mb-3">
          <div className="text-sm text-gray-600 mb-2 flex items-center">
            <div className="w-3 h-3 bg-gray-200 border border-gray-400 rounded mr-2"></div>
            White Captured:
          </div>
          <div className="flex flex-wrap gap-1 bg-gray-50 p-2 rounded min-h-[2rem]">
            {capturedPieces.white.length === 0 ? (
              <span className="text-gray-400 text-sm italic">None captured</span>
            ) : (
              capturedPieces.white.map((piece, index) => (
                <span 
                  key={index} 
                  className="hover:scale-110 transition-transform duration-200"
                  title={`${piece.type.charAt(0).toUpperCase()}${piece.type.slice(1)}`}
                >
                  {renderPieceIcon(piece)}
                </span>
              ))
            )}
          </div>
        </div>

        {/* Black Captured */}
        <div>
          <div className="text-sm text-gray-600 mb-2 flex items-center">
            <div className="w-3 h-3 bg-gray-800 rounded mr-2"></div>
            Black Captured:
          </div>
          <div className="flex flex-wrap gap-1 bg-gray-50 p-2 rounded min-h-[2rem]">
            {capturedPieces.black.length === 0 ? (
              <span className="text-gray-400 text-sm italic">None captured</span>
            ) : (
              capturedPieces.black.map((piece, index) => (
                <span 
                  key={index} 
                  className="hover:scale-110 transition-transform duration-200"
                  title={`${piece.type.charAt(0).toUpperCase()}${piece.type.slice(1)}`}
                >
                  {renderPieceIcon(piece)}
                </span>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Move History */}
      <div className="mb-6">
        <h3 className="font-semibold text-gray-700 mb-3 flex items-center">
          <svg className="w-5 h-5 mr-2 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Move History
          <span className="ml-2 text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded-full">
            {moveHistory.length}
          </span>
        </h3>
        <div className="max-h-32 overflow-y-auto bg-gray-50 p-2 rounded move-history">
          {moveHistory.length === 0 ? (
            <div className="text-gray-400 text-sm text-center py-4">
              <svg className="w-8 h-8 mx-auto mb-2 text-gray-400" viewBox="0 0 45 45" fill="currentColor">
                <path d="M22.5,9c-2.21,0-4,1.79-4,4,0,0.89,0.29,1.71,0.78,2.38C17.33,16.5,16,18.59,16,21c0,2.03,0.94,3.84,2.41,5.03-3,1.06-7.41,5.55-7.41,13.47h23c0-7.92-4.41-12.41-7.41-13.47C27.06,24.84,28,23.03,28,21c0-2.41-1.33-4.5-3.28-5.62C25.21,14.71,25.5,13.89,25.5,13c0-2.21-1.79-4-4-4z" stroke="#000" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
              No moves yet
            </div>
          ) : (
            <div className="space-y-1">
              {moveHistory.map((move, index) => (
                <div key={index} className="text-sm text-gray-700 font-mono hover:bg-gray-200 p-1 rounded transition-colors duration-150">
                  {formatMove(move, index)}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Game Controls */}
      <div className="space-y-3">
        <button
          onClick={onNewGame}
          className="w-full px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center justify-center"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          New Game
        </button>
        
        {moveHistory.length > 0 && (
          <button
            onClick={onUndoMove}
            className="w-full px-4 py-2 bg-amber-600 text-white font-semibold rounded-lg hover:bg-amber-700 transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl"
          >
            ↶ Undo Last Move
          </button>
        )}
      </div>

      {/* Game Rules Quick Reference */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <h4 className="font-semibold text-gray-700 mb-2">Quick Guide</h4>
        <div className="text-xs text-gray-600 space-y-1">
          <div className="flex items-center">
            <div className="w-3 h-3 bg-blue-300 border-2 border-blue-500 rounded mr-2"></div>
            <span>Selected piece</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
            <span>Available moves</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
            <span>Capture moves</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GameInfo;
