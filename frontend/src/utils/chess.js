// Chess game logic utilities

export const PIECES = {
  PAWN: 'pawn',
  ROOK: 'rook',
  KNIGHT: 'knight',
  BISHOP: 'bishop',
  QUEEN: 'queen',
  KING: 'king'
};

export const COLORS = {
  WHITE: 'white',
  BLACK: 'black'
};

// Initialize the chess board with pieces in starting positions
export const initializeBoard = () => {
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

// Get all possible moves for a piece with move type information
export const getPossibleMoves = (board, row, col, piece) => {
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

// Get possible moves with capture information
export const getPossibleMovesWithTypes = (board, row, col, piece) => {
  const moves = [];
  const { type, color } = piece;
  
  switch (type) {
    case PIECES.PAWN:
      moves.push(...getPawnMovesWithTypes(board, row, col, color));
      break;
    case PIECES.ROOK:
      moves.push(...getRookMovesWithTypes(board, row, col, color));
      break;
    case PIECES.KNIGHT:
      moves.push(...getKnightMovesWithTypes(board, row, col, color));
      break;
    case PIECES.BISHOP:
      moves.push(...getBishopMovesWithTypes(board, row, col, color));
      break;
    case PIECES.QUEEN:
      moves.push(...getQueenMovesWithTypes(board, row, col, color));
      break;
    case PIECES.KING:
      moves.push(...getKingMovesWithTypes(board, row, col, color));
      break;
    default:
      break;
  }
  
  return moves;
};

// Get only legal moves that don't leave the king in check
export const getLegalMoves = (board, row, col, piece) => {
  const allMoves = getPossibleMoves(board, row, col, piece);
  const legalMoves = [];
  
  for (const [toRow, toCol] of allMoves) {
    const tempBoard = makeMove(board, row, col, toRow, toCol);
    if (!isInCheck(tempBoard, piece.color)) {
      legalMoves.push([toRow, toCol]);
    }
  }
  
  return legalMoves;
};

// Get legal moves with capture information that don't leave the king in check
export const getLegalMovesWithTypes = (board, row, col, piece) => {
  const allMoves = getPossibleMovesWithTypes(board, row, col, piece);
  const legalMoves = [];
  
  for (const move of allMoves) {
    const tempBoard = makeMove(board, row, col, move.row, move.col);
    if (!isInCheck(tempBoard, piece.color)) {
      legalMoves.push(move);
    }
  }
  
  return legalMoves;
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

const getPawnMovesWithTypes = (board, row, col, color) => {
  const moves = [];
  const direction = color === COLORS.WHITE ? -1 : 1;
  const startRow = color === COLORS.WHITE ? 6 : 1;
  
  // Move forward one square
  if (isValidPosition(row + direction, col) && !board[row + direction][col]) {
    moves.push({ row: row + direction, col, isCapture: false });
    
    // Move forward two squares from starting position
    if (row === startRow && !board[row + 2 * direction][col]) {
      moves.push({ row: row + 2 * direction, col, isCapture: false });
    }
  }
  
  // Capture diagonally
  [-1, 1].forEach(offset => {
    const newCol = col + offset;
    if (isValidPosition(row + direction, newCol)) {
      const targetPiece = board[row + direction][newCol];
      if (targetPiece && targetPiece.color !== color) {
        moves.push({ row: row + direction, col: newCol, isCapture: true });
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

const getRookMovesWithTypes = (board, row, col, color) => {
  const moves = [];
  const directions = [[0, 1], [0, -1], [1, 0], [-1, 0]];
  
  directions.forEach(([dRow, dCol]) => {
    for (let i = 1; i < 8; i++) {
      const newRow = row + i * dRow;
      const newCol = col + i * dCol;
      
      if (!isValidPosition(newRow, newCol)) break;
      
      const targetPiece = board[newRow][newCol];
      if (!targetPiece) {
        moves.push({ row: newRow, col: newCol, isCapture: false });
      } else {
        if (targetPiece.color !== color) {
          moves.push({ row: newRow, col: newCol, isCapture: true });
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

const getKnightMovesWithTypes = (board, row, col, color) => {
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
      if (!targetPiece) {
        moves.push({ row: newRow, col: newCol, isCapture: false });
      } else if (targetPiece.color !== color) {
        moves.push({ row: newRow, col: newCol, isCapture: true });
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

const getBishopMovesWithTypes = (board, row, col, color) => {
  const moves = [];
  const directions = [[1, 1], [1, -1], [-1, 1], [-1, -1]];
  
  directions.forEach(([dRow, dCol]) => {
    for (let i = 1; i < 8; i++) {
      const newRow = row + i * dRow;
      const newCol = col + i * dCol;
      
      if (!isValidPosition(newRow, newCol)) break;
      
      const targetPiece = board[newRow][newCol];
      if (!targetPiece) {
        moves.push({ row: newRow, col: newCol, isCapture: false });
      } else {
        if (targetPiece.color !== color) {
          moves.push({ row: newRow, col: newCol, isCapture: true });
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

const getQueenMovesWithTypes = (board, row, col, color) => {
  return [
    ...getRookMovesWithTypes(board, row, col, color),
    ...getBishopMovesWithTypes(board, row, col, color)
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

const getKingMovesWithTypes = (board, row, col, color) => {
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
      if (!targetPiece) {
        moves.push({ row: newRow, col: newCol, isCapture: false });
      } else if (targetPiece.color !== color) {
        moves.push({ row: newRow, col: newCol, isCapture: true });
      }
    }
  });
  
  return moves;
};

const isValidPosition = (row, col) => {
  return row >= 0 && row < 8 && col >= 0 && col < 8;
};

// Check if a move is valid
export const isValidMove = (board, fromRow, fromCol, toRow, toCol) => {
  const piece = board[fromRow][fromCol];
  if (!piece) return false;
  
  const possibleMoves = getPossibleMoves(board, fromRow, fromCol, piece);
  return possibleMoves.some(([row, col]) => row === toRow && col === toCol);
};

// Make a move on the board
export const makeMove = (board, fromRow, fromCol, toRow, toCol) => {
  const newBoard = board.map(row => [...row]);
  const piece = newBoard[fromRow][fromCol];
  
  newBoard[toRow][toCol] = piece;
  newBoard[fromRow][fromCol] = null;
  
  return newBoard;
};

// Check if the king is in check
export const isInCheck = (board, color) => {
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
export const isCheckmate = (board, color) => {
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

// Get piece symbol for display
export const getPieceSymbol = (piece) => {
  if (!piece) return '';
  
  const symbols = {
    [PIECES.KING]: piece.color === COLORS.WHITE ? '♔' : '♚',
    [PIECES.QUEEN]: piece.color === COLORS.WHITE ? '♕' : '♛',
    [PIECES.ROOK]: piece.color === COLORS.WHITE ? '♖' : '♜',
    [PIECES.BISHOP]: piece.color === COLORS.WHITE ? '♗' : '♝',
    [PIECES.KNIGHT]: piece.color === COLORS.WHITE ? '♘' : '♞',
    [PIECES.PAWN]: piece.color === COLORS.WHITE ? '♙' : '♟',
  };
  
  return symbols[piece.type] || '';
};
