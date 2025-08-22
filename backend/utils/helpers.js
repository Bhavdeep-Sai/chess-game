const jwt = require('jsonwebtoken');
const crypto = require('crypto');

// Generate JWT token
const generateToken = (userId) => {
  return jwt.sign(
    { userId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN }
  );
};

// Generate guest ID
const generateGuestId = () => {
  return 'guest_' + crypto.randomBytes(8).toString('hex');
};

// Generate room ID
const generateRoomId = () => {
  return crypto.randomBytes(4).toString('hex').toUpperCase();
};

// Validate email format
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Validate username format
const isValidUsername = (username) => {
  const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
  return usernameRegex.test(username);
};

// Calculate new rating using basic ELO system
const calculateNewRating = (playerRating, opponentRating, result) => {
  const K = 32; // K-factor
  const expectedScore = 1 / (1 + Math.pow(10, (opponentRating - playerRating) / 400));
  
  let actualScore;
  switch (result) {
    case 'win':
      actualScore = 1;
      break;
    case 'loss':
      actualScore = 0;
      break;
    case 'draw':
      actualScore = 0.5;
      break;
    default:
      actualScore = 0.5;
  }
  
  const newRating = Math.round(playerRating + K * (actualScore - expectedScore));
  return Math.max(100, newRating); // Minimum rating of 100
};

// Format time for display
const formatTime = (milliseconds) => {
  const totalSeconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

// Chess notation utilities
const algebraicNotation = (from, to, piece, captured, isCheck, isCheckmate, promotion = null) => {
  const files = 'abcdefgh';
  const fromSquare = files[from.col] + (8 - from.row);
  const toSquare = files[to.col] + (8 - to.row);
  
  let notation = '';
  
  // Piece symbol (empty for pawn)
  if (piece.type !== 'pawn') {
    notation += piece.type.charAt(0).toUpperCase();
  }
  
  // Capture indicator
  if (captured) {
    if (piece.type === 'pawn') {
      notation += fromSquare[0]; // file of departure for pawn captures
    }
    notation += 'x';
  }
  
  // Destination square
  notation += toSquare;
  
  // Promotion
  if (promotion) {
    notation += '=' + promotion.charAt(0).toUpperCase();
  }
  
  // Check/checkmate indicator
  if (isCheckmate) {
    notation += '#';
  } else if (isCheck) {
    notation += '+';
  }
  
  return notation;
};

module.exports = {
  generateToken,
  generateGuestId,
  generateRoomId,
  isValidEmail,
  isValidUsername,
  calculateNewRating,
  formatTime,
  algebraicNotation
};
