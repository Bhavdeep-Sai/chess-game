// Chess game logic utilities - Backend version

const PIECES = {
  PAWN: 'pawn',
  ROOK: 'rook',
  KNIGHT: 'knight',
  BISHOP: 'bishop',
  QUEEN: 'queen',
  KING: 'king'
};

const COLORS = {
  WHITE: 'white',
  BLACK: 'black'
};

// Initialize the chess board with pieces in starting positions
const initializeBoard = () => {
  const board = Array(8).fill(null).map(() => Array(8).fill(null));
  
  // Place pawns
  for (let i = 0; i < 8; i++) {
    board[1][i] = { type: PIECES.PAWN, color: COLORS.BLACK };
    board[6][i] = { type: PIECES.PAWN, color: COLORS.WHITE };
  }
  
  // Place other pieces
  const pieceOrder = [PIECES.ROOK, PIECES.KNIGHT, PIECES.BISHOP, PIECES.QUEEN, PIECES.KING, PIECES.BISHOP, PIECES.KNIGHT, PIECES.ROOK];
  
  for (let i = 0; i < 8; i++) {
    board[0][i] = { type: pieceOrder[i], color: COLORS.BLACK };
    board[7][i] = { type: pieceOrder[i], color: COLORS.WHITE };
  }
  
  return board;
};

// Get all possible moves for a piece
const getPossibleMoves = (board, row, col, piece) => {
  const moves = [];
  const { type, color } = piece;
  
  switch (type) {
    case PIECES.PAWN:
      moves.push(...getPawnMoves(board, row, col, color));
      break;
    case PIECES.ROOK:
      moves.push(...getRookMoves(board, row, col, color));
      break;
    case PIECES.KNIGHT:
      moves.push(...getKnightMoves(board, row, col, color));
      break;
    case PIECES.BISHOP:
      moves.push(...getBishopMoves(board, row, col, color));
      break;
    case PIECES.QUEEN:
      moves.push(...getQueenMoves(board, row, col, color));
      break;
    case PIECES.KING:
      moves.push(...getKingMoves(board, row, col, color));
      break;
    default:
      break;
  }
  
  return moves;
};

const getPawnMoves = (board, row, col, color) => {
  const moves = [];
  const direction = color === COLORS.WHITE ? -1 : 1;
  const startRow = color === COLORS.WHITE ? 6 : 1;
  
  // Move forward one square
  if (isValidPosition(row + direction, col) && !board[row + direction][col]) {
    moves.push([row + direction, col]);
    
    // Move forward two squares from starting position
    if (row === startRow && !board[row + 2 * direction][col]) {
      moves.push([row + 2 * direction, col]);
    }
  }
  
  // Capture diagonally
  [-1, 1].forEach(offset => {
    const newCol = col + offset;
    if (isValidPosition(row + direction, newCol)) {
      const targetPiece = board[row + direction][newCol];
      if (targetPiece && targetPiece.color !== color) {
        moves.push([row + direction, newCol]);
      }
    }
  });
  
  return moves;
};

const getRookMoves = (board, row, col, color) => {
  const moves = [];
  const directions = [[0, 1], [0, -1], [1, 0], [-1, 0]];
  
  directions.forEach(([dRow, dCol]) => {
    for (let i = 1; i < 8; i++) {
      const newRow = row + i * dRow;
      const newCol = col + i * dCol;
      
      if (!isValidPosition(newRow, newCol)) break;
      
      const targetPiece = board[newRow][newCol];
      if (!targetPiece) {
        moves.push([newRow, newCol]);
      } else {
        if (targetPiece.color !== color) {
          moves.push([newRow, newCol]);
        }
        break;
      }
    }
  });
  
  return moves;
};

const getKnightMoves = (board, row, col, color) => {
  const moves = [];
  const knightMoves = [
    [-2, -1], [-2, 1], [-1, -2], [-1, 2],
    [1, -2], [1, 2], [2, -1], [2, 1]
  ];
  
  knightMoves.forEach(([dRow, dCol]) => {
    const newRow = row + dRow;
    const newCol = col + dCol;
    
    if (isValidPosition(newRow, newCol)) {
      const targetPiece = board[newRow][newCol];
      if (!targetPiece || targetPiece.color !== color) {
        moves.push([newRow, newCol]);
      }
    }
  });
  
  return moves;
};

const getBishopMoves = (board, row, col, color) => {
  const moves = [];
  const directions = [[1, 1], [1, -1], [-1, 1], [-1, -1]];
  
  directions.forEach(([dRow, dCol]) => {
    for (let i = 1; i < 8; i++) {
      const newRow = row + i * dRow;
      const newCol = col + i * dCol;
      
      if (!isValidPosition(newRow, newCol)) break;
      
      const targetPiece = board[newRow][newCol];
      if (!targetPiece) {
        moves.push([newRow, newCol]);
      } else {
        if (targetPiece.color !== color) {
          moves.push([newRow, newCol]);
        }
        break;
      }
    }
  });
  
  return moves;
};

const getQueenMoves = (board, row, col, color) => {
  return [
    ...getRookMoves(board, row, col, color),
    ...getBishopMoves(board, row, col, color)
  ];
};

const getKingMoves = (board, row, col, color) => {
  const moves = [];
  const directions = [
    [-1, -1], [-1, 0], [-1, 1],
    [0, -1],           [0, 1],
    [1, -1],  [1, 0],  [1, 1]
  ];
  
  directions.forEach(([dRow, dCol]) => {
    const newRow = row + dRow;
    const newCol = col + dCol;
    
    if (isValidPosition(newRow, newCol)) {
      const targetPiece = board[newRow][newCol];
      if (!targetPiece || targetPiece.color !== color) {
        moves.push([newRow, newCol]);
      }
    }
  });
  
  return moves;
};

const isValidPosition = (row, col) => {
  return row >= 0 && row < 8 && col >= 0 && col < 8;
};

// Check if a move is valid
const isValidMove = (board, fromRow, fromCol, toRow, toCol) => {
  const piece = board[fromRow][fromCol];
  if (!piece) return false;
  
  const possibleMoves = getPossibleMoves(board, fromRow, fromCol, piece);
  return possibleMoves.some(([row, col]) => row === toRow && col === toCol);
};

// Make a move on the board
const makeMove = (board, fromRow, fromCol, toRow, toCol, promotion = null) => {
  const newBoard = board.map(row => [...row]);
  const piece = newBoard[fromRow][fromCol];
  
  // Handle pawn promotion
  if (piece.type === PIECES.PAWN && promotion && 
      ((piece.color === COLORS.WHITE && toRow === 0) || 
       (piece.color === COLORS.BLACK && toRow === 7))) {
    newBoard[toRow][toCol] = { type: promotion, color: piece.color };
  } else {
    newBoard[toRow][toCol] = piece;
  }
  
  newBoard[fromRow][fromCol] = null;
  
  return newBoard;
};

// Check if a move requires pawn promotion
const requiresPromotion = (board, fromRow, fromCol, toRow, toCol) => {
  const piece = board[fromRow][fromCol];
  if (!piece || piece.type !== PIECES.PAWN) return false;
  
  return (piece.color === COLORS.WHITE && toRow === 0) ||
         (piece.color === COLORS.BLACK && toRow === 7);
};

// Check if the king is in check
const isInCheck = (board, color) => {
  // Find the king
  let kingRow, kingCol;
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const piece = board[row][col];
      if (piece && piece.type === PIECES.KING && piece.color === color) {
        kingRow = row;
        kingCol = col;
        break;
      }
    }
  }
  
  // Check if any opponent piece can attack the king
  const opponentColor = color === COLORS.WHITE ? COLORS.BLACK : COLORS.WHITE;
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const piece = board[row][col];
      if (piece && piece.color === opponentColor) {
        const moves = getPossibleMoves(board, row, col, piece);
        if (moves.some(([moveRow, moveCol]) => moveRow === kingRow && moveCol === kingCol)) {
          return true;
        }
      }
    }
  }
  
  return false;
};

// Check if it's checkmate
const isCheckmate = (board, color) => {
  if (!isInCheck(board, color)) return false;
  
  // Try all possible moves for the current player
  for (let fromRow = 0; fromRow < 8; fromRow++) {
    for (let fromCol = 0; fromCol < 8; fromCol++) {
      const piece = board[fromRow][fromCol];
      if (piece && piece.color === color) {
        const moves = getPossibleMoves(board, fromRow, fromCol, piece);
        
        for (const [toRow, toCol] of moves) {
          const tempBoard = makeMove(board, fromRow, fromCol, toRow, toCol);
          if (!isInCheck(tempBoard, color)) {
            return false; // Found a move that gets out of check
          }
        }
      }
    }
  }
  
  return true; // No moves can get out of check
};

module.exports = {
  PIECES,
  COLORS,
  initializeBoard,
  getPossibleMoves,
  isValidMove,
  makeMove,
  requiresPromotion,
  isInCheck,
  isCheckmate
};
