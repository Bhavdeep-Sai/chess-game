import React from 'react';
import Square from './Square';
import GameInfo from './GameInfo';
import MoveIndicatorLegend from './MoveIndicatorLegend';
import CapturedPieces from './CapturedPieces';
import { useChessGame } from '../hooks/useChessGame';

const ChessBoard = ({ onLeaveGame }) => {
  const {
    board,
    selectedSquare,
    currentPlayer,
    gameStatus,
    capturedPieces,
    moveHistory,
    handleSquareClick,
    resetGame,
    undoLastMove,
    deselectSquare,
    isSquareSelected,
    isValidMoveSquare,
    isCaptureSquare,
    isKingInCheck,
    getGameStatusMessage
  } = useChessGame();

  return (
    <div className="flex flex-col lg:flex-row items-start justify-center gap-10 p-10 bg-gradient-to-br from-gray-50 to-gray-200 min-h-screen font-sans">
      {/* Game Header - Mobile */}
      <div className="lg:hidden w-full text-center mb-4">
        <h1 className="text-4xl font-bold text-gray-800 mb-2 flex items-center justify-center">
          <svg className="w-8 h-8 mr-3 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
              d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
          Practice Mode
        </h1>
        <div className="text-xl font-semibold text-gray-700">
          {getGameStatusMessage()}
        </div>
      </div>

      {/* Game Info & Captured Pieces Panel */}
      <div className="order-2 lg:order-1 space-y-6 w-full max-w-xs">
        <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
          <GameInfo
            currentPlayer={currentPlayer}
            gameStatus={gameStatus}
            moveHistory={moveHistory}
            capturedPieces={capturedPieces}
            onNewGame={resetGame}
            onUndoMove={undoLastMove}
          />
        </div>
        
        {/* Enhanced Captured Pieces Display */}
        <CapturedPieces capturedPieces={capturedPieces} />
        
        <div className="bg-white rounded-2xl shadow-xl p-4 border border-gray-100">
          <MoveIndicatorLegend />
        </div>
      </div>

  {/* Main Game Area */}
  <div className="order-1 lg:order-2 flex flex-col items-center w-full max-w-2xl">
        {/* Game Header - Desktop */}
        <div className="hidden lg:block text-center mb-6">
          <h1 className="text-5xl font-bold text-gray-800 mb-3 flex items-center justify-center">
            <svg className="w-12 h-12 mr-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
            Practice Mode
          </h1>
          <div className="text-xl text-purple-600 mb-2 font-medium">
            Perfect your chess skills offline
          </div>
          <div className="text-2xl font-semibold text-gray-700 mb-2">
            {getGameStatusMessage()}
          </div>
          {(gameStatus.includes('checkmate') || gameStatus === 'check') && (
            <div className={`text-xl font-medium flex items-center justify-center ${gameStatus === 'check' ? 'text-red-600' : 'text-green-600'}`}>
              {gameStatus === 'check' ? (
                <>
                  <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                  Check!
                </>
              ) : (
                <>
                  <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                      d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                  </svg>
                  Game Over!
                </>
              )}
            </div>
          )}
        </div>

  {/* Chess Board */}
  <div className="relative flex flex-col items-center">
          {/* Board Labels */}
          <div className="absolute -left-8 top-0 h-full flex flex-col justify-around text-gray-600 font-semibold">
            {[8, 7, 6, 5, 4, 3, 2, 1].map(num => (
              <div key={num} className="h-16 flex items-center">
                {num}
              </div>
            ))}
          </div>
          
          <div className="absolute -bottom-8 left-0 w-full flex justify-around text-gray-600 font-semibold">
            {['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'].map(letter => (
              <div key={letter} className="w-16 text-center">
                {letter}
              </div>
            ))}
          </div>

          {/* Main Board */}
          <div className="border-8 border-gray-900 bg-gray-900 p-4 rounded-2xl shadow-2xl">
            <div className="grid grid-cols-8 gap-0 bg-white p-2 rounded-xl">
              {board.map((row, rowIndex) =>
                row.map((piece, colIndex) => {
                  const isLight = (rowIndex + colIndex) % 2 === 0;
                  return (
                    <Square
                      key={`${rowIndex}-${colIndex}`}
                      piece={piece}
                      isLight={isLight}
                      isSelected={isSquareSelected(rowIndex, colIndex)}
                      isValidMove={isValidMoveSquare(rowIndex, colIndex)}
                      isCapture={isCaptureSquare(rowIndex, colIndex)}
                      isInCheck={isKingInCheck(rowIndex, colIndex)}
                      onClick={handleSquareClick}
                      row={rowIndex}
                      col={colIndex}
                    />
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Quick Controls - Mobile */}
        <div className="lg:hidden mt-6 flex gap-4">
          {onLeaveGame && (
            <button
              onClick={onLeaveGame}
              className="px-6 py-3 bg-gray-600 text-white font-semibold rounded-lg hover:bg-gray-700 transition-colors duration-200 shadow-lg"
            >
              ← Back to Lobby
            </button>
          )}
          
          <button
            onClick={resetGame}
            className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors duration-200 shadow-lg"
          >
            New Game
          </button>
          
          {selectedSquare && (
            <button
              onClick={deselectSquare}
              className="px-6 py-3 bg-gray-600 text-white font-semibold rounded-lg hover:bg-gray-700 transition-colors duration-200 shadow-lg"
            >
              Deselect
            </button>
          )}
        </div>

        {/* Game Instructions */}
        <div className="mt-8 max-w-xl w-full text-center">
          <h3 className="text-lg font-semibold text-gray-700 mb-2">Practice Mode Instructions</h3>
          <p className="text-gray-600 mb-2">
            Click on a piece to select it, then click on a highlighted square to move.<br />
            <span className="text-green-600 font-semibold">Green</span> highlights show valid moves.<br />
            The game automatically detects <span className="font-semibold">check</span> and <span className="font-semibold">checkmate</span>.<br />
            Captured pieces are shown for both players.
          </p>
          <div className="text-sm text-purple-600 bg-purple-50 p-3 rounded-lg flex items-center justify-center">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
            This is offline practice mode - perfect for learning chess rules and practicing strategies!
          </div>
        </div>
      </div>

      {/* Empty space for balance on desktop */}
      <div className="hidden lg:block order-3 w-80"></div>
    </div>
  );
};

export default ChessBoard;
