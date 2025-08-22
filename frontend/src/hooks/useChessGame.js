import { useState, useCallback } from 'react';
import { 
  initializeBoard, 
  isValidMove, 
  makeMove, 
  getLegalMovesWithTypes,
  isInCheck, 
  isCheckmate,
  COLORS 
} from '../utils/chess';

export const useChessGame = () => {
  const [board, setBoard] = useState(initializeBoard());
  const [selectedSquare, setSelectedSquare] = useState(null);
  const [currentPlayer, setCurrentPlayer] = useState(COLORS.WHITE);
  const [gameStatus, setGameStatus] = useState('playing');
  const [possibleMoves, setPossibleMoves] = useState([]);
  const [captureMoves, setCaptureMoves] = useState([]);
  const [capturedPieces, setCapturedPieces] = useState({ white: [], black: [] });
  const [moveHistory, setMoveHistory] = useState([]);
  const [boardHistory, setBoardHistory] = useState([initializeBoard()]);

  const handleSquareClick = useCallback((row, col) => {
    const piece = board[row][col];
    
    // If no square is selected
    if (!selectedSquare) {
      if (piece && piece.color === currentPlayer) {
        setSelectedSquare({ row, col });
        // Use legal moves that don't leave king in check
        const movesWithTypes = getLegalMovesWithTypes(board, row, col, piece);
        const regularMoves = movesWithTypes.filter(move => !move.isCapture).map(move => [move.row, move.col]);
        const captures = movesWithTypes.filter(move => move.isCapture).map(move => [move.row, move.col]);
        setPossibleMoves(regularMoves);
        setCaptureMoves(captures);
      }
      return;
    }
    
    const { row: fromRow, col: fromCol } = selectedSquare;
    
    // If clicking the same square, deselect
    if (fromRow === row && fromCol === col) {
      setSelectedSquare(null);
      setPossibleMoves([]);
      setCaptureMoves([]);
      return;
    }
    
    // If clicking another piece of the same color, select it instead
    if (piece && piece.color === currentPlayer) {
      setSelectedSquare({ row, col });
      // Use legal moves that don't leave king in check
      const movesWithTypes = getLegalMovesWithTypes(board, row, col, piece);
      const regularMoves = movesWithTypes.filter(move => !move.isCapture).map(move => [move.row, move.col]);
      const captures = movesWithTypes.filter(move => move.isCapture).map(move => [move.row, move.col]);
      setPossibleMoves(regularMoves);
      setCaptureMoves(captures);
      return;
    }
    
    // Try to make a move
    if (isValidMove(board, fromRow, fromCol, row, col)) {
      const capturedPiece = board[row][col];
      const movingPiece = board[fromRow][fromCol];
      
      // Make the move
      const newBoard = makeMove(board, fromRow, fromCol, row, col);
      
      // Check if this move would put own king in check
      if (isInCheck(newBoard, currentPlayer)) {
        // Invalid move - would put own king in check
        setSelectedSquare(null);
        setPossibleMoves([]);
        setCaptureMoves([]);
        return;
      }
      
      // Update captured pieces
      if (capturedPiece) {
        // Store captured piece for the capturing player
        const capturingColor = currentPlayer;
        setCapturedPieces(prev => ({
          ...prev,
          [capturingColor]: [...prev[capturingColor], capturedPiece]
        }));
      }

      // Add move to history
      const move = {
        from: { row: fromRow, col: fromCol },
        to: { row, col },
        piece: movingPiece,
        captured: capturedPiece,
        timestamp: new Date().toISOString()
      };
      
      setBoard(newBoard);
      setBoardHistory(prev => [...prev, newBoard]);
      setMoveHistory(prev => [...prev, move]);
      setSelectedSquare(null);
      setPossibleMoves([]);
      setCaptureMoves([]);
      
      // Switch players
      const nextPlayer = currentPlayer === COLORS.WHITE ? COLORS.BLACK : COLORS.WHITE;
      setCurrentPlayer(nextPlayer);
      
      // Check game status
      if (isCheckmate(newBoard, nextPlayer)) {
        setGameStatus(`checkmate-${currentPlayer}`);
      } else if (isInCheck(newBoard, nextPlayer)) {
        setGameStatus('check');
      } else {
        setGameStatus('playing');
      }
    } else {
      // Invalid move
      setSelectedSquare(null);
      setPossibleMoves([]);
      setCaptureMoves([]);
    }
  }, [board, selectedSquare, currentPlayer]);

  const isSquareSelected = useCallback((row, col) => {
    return selectedSquare && selectedSquare.row === row && selectedSquare.col === col;
  }, [selectedSquare]);

  const isValidMoveSquare = useCallback((row, col) => {
    return possibleMoves.some(([moveRow, moveCol]) => moveRow === row && moveCol === col);
  }, [possibleMoves]);

  const isCaptureSquare = useCallback((row, col) => {
    return captureMoves.some(([moveRow, moveCol]) => moveRow === row && moveCol === col);
  }, [captureMoves]);

  const isKingInCheck = useCallback((row, col) => {
    const piece = board[row][col];
    return piece && 
           piece.type === 'king' && 
           piece.color === currentPlayer && 
           isInCheck(board, currentPlayer);
  }, [board, currentPlayer]);

  const resetGame = useCallback(() => {
    const initialBoard = initializeBoard();
    setBoard(initialBoard);
    setBoardHistory([initialBoard]);
    setSelectedSquare(null);
    setCurrentPlayer(COLORS.WHITE);
    setGameStatus('playing');
    setPossibleMoves([]);
    setCaptureMoves([]);
    setCapturedPieces({ white: [], black: [] });
    setMoveHistory([]);
  }, []);

  const undoLastMove = useCallback(() => {
    if (moveHistory.length === 0) return;
    
    const lastMove = moveHistory[moveHistory.length - 1];
    const previousBoard = boardHistory[boardHistory.length - 2];
    
    // Restore captured piece
    if (lastMove.captured) {
      setCapturedPieces(prev => ({
        ...prev,
        [lastMove.captured.color]: prev[lastMove.captured.color].slice(0, -1)
      }));
    }
    
    // Restore board state
    setBoard(previousBoard);
    setBoardHistory(prev => prev.slice(0, -1));
    setMoveHistory(prev => prev.slice(0, -1));
    
    // Switch player back
    setCurrentPlayer(prev => prev === COLORS.WHITE ? COLORS.BLACK : COLORS.WHITE);
    
    // Reset game status
    setGameStatus('playing');
    setSelectedSquare(null);
    setPossibleMoves([]);
    setCaptureMoves([]);
  }, [moveHistory, boardHistory]);

  const deselectSquare = useCallback(() => {
    setSelectedSquare(null);
    setPossibleMoves([]);
    setCaptureMoves([]);
  }, []);

  const getGameStatusMessage = useCallback(() => {
    switch (gameStatus) {
      case 'check':
        return `${currentPlayer === COLORS.WHITE ? 'White' : 'Black'} is in check!`;
      case `checkmate-${COLORS.WHITE}`:
        return 'White wins by checkmate!';
      case `checkmate-${COLORS.BLACK}`:
        return 'Black wins by checkmate!';
      default:
        return `${currentPlayer === COLORS.WHITE ? 'White' : 'Black'} to move`;
    }
  }, [gameStatus, currentPlayer]);

  return {
    // State
    board,
    selectedSquare,
    currentPlayer,
    gameStatus,
    possibleMoves,
    capturedPieces,
    moveHistory,
    
    // Actions
    handleSquareClick,
    resetGame,
    undoLastMove,
    deselectSquare,
    
    // Computed values
    isSquareSelected,
    isValidMoveSquare,
    isCaptureSquare,
    isKingInCheck,
    getGameStatusMessage
  };
};
