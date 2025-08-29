const mongoose = require('mongoose');

const gameSchema = new mongoose.Schema({
  roomId: {
    type: String,
    required: true,
    unique: true
  },
  players: {
    white: {
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
      },
      username: String,
      isGuest: {
        type: Boolean,
        default: false
      },
      guestId: String,
      socketId: String,
      isReady: {
        type: Boolean,
        default: false
      }
    },
    black: {
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
      },
      username: String,
      isGuest: {
        type: Boolean,
        default: false
      },
      guestId: String,
      socketId: String,
      isReady: {
        type: Boolean,
        default: false
      }
    }
  },
  board: {
    type: [[Object]], // 8x8 array of pieces
    default: null
  },
  currentPlayer: {
    type: String,
    enum: ['white', 'black'],
    default: 'white'
  },
  gameStatus: {
    type: String,
    enum: ['waiting', 'active', 'paused', 'finished'],
    default: 'waiting'
  },
  result: {
    winner: {
      type: String,
      enum: ['white', 'black', 'draw'],
      default: null
    },
    reason: {
      type: String,
      enum: ['checkmate', 'resignation', 'timeout', 'draw', 'stalemate'],
      default: null
    }
  },
  moves: [{
    from: {
      row: Number,
      col: Number
    },
    to: {
      row: Number,
      col: Number
    },
    piece: Object,
    captured: Object,
    notation: String,
    moveTime: {
      type: Number,
      default: 0
    },
    timestamp: {
      type: Date,
      default: Date.now
    }
  }],
  timeControl: {
    initialTime: {
      type: Number,
      default: 600000 // 10 minutes in milliseconds
    },
    increment: {
      type: Number,
      default: 0
    },
    whiteTime: Number,
    blackTime: Number
  },
  settings: {
    isPrivate: {
      type: Boolean,
      default: false
    },
    password: String,
    allowSpectators: {
      type: Boolean,
      default: true
    },
    autoStart: {
      type: Boolean,
      default: false
    }
  },
  spectators: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    username: String,
    isGuest: Boolean,
    guestId: String,
    socketId: String
  }],
  chat: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    username: String,
    message: String,
    timestamp: {
      type: Date,
      default: Date.now
    },
    isSystem: {
      type: Boolean,
      default: false
    }
  }],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  startedAt: Date,
  endedAt: Date
}, {
  timestamps: true
});

// Indexes for performance
gameSchema.index({ 'players.white.userId': 1 });
gameSchema.index({ 'players.black.userId': 1 });
gameSchema.index({ gameStatus: 1 });
gameSchema.index({ createdAt: -1 });

// Pre-save validation to prevent same user in both slots
gameSchema.pre('save', function(next) {
  // Check for authenticated users - handle both populated and non-populated userId fields
  const whiteUserId = this.players.white.userId?._id ? 
    this.players.white.userId._id.toString() : 
    this.players.white.userId?.toString();
  const blackUserId = this.players.black.userId?._id ? 
    this.players.black.userId._id.toString() : 
    this.players.black.userId?.toString();
    
  if (whiteUserId && blackUserId && whiteUserId === blackUserId) {
    return next(new Error('Same authenticated user cannot be in both player slots'));
  }
  
  // Check for guest users by guestId
  if (this.players.white.guestId && this.players.black.guestId && 
      this.players.white.guestId === this.players.black.guestId) {
    return next(new Error('Same guest user cannot be in both player slots'));
  }
  
  // Check for guest users by username (additional safety)
  if (this.players.white.isGuest && this.players.black.isGuest &&
      this.players.white.username && this.players.black.username &&
      this.players.white.username === this.players.black.username) {
    return next(new Error('Same guest username cannot be in both player slots'));
  }
  
  next();
});

// Method to get game state for client
gameSchema.methods.getGameState = function() {
  return {
    roomId: this.roomId,
    players: this.players,
    board: this.board,
    currentPlayer: this.currentPlayer,
    gameStatus: this.gameStatus,
    result: this.result,
    moves: this.moves,
    timeControl: this.timeControl,
    settings: this.settings,
    spectators: this.spectators.map(s => ({
      username: s.username,
      isGuest: s.isGuest
    })),
    moveCount: this.moves.length
  };
};

// Method to add a move
gameSchema.methods.addMove = function(move) {
  this.moves.push(move);
  this.currentPlayer = this.currentPlayer === 'white' ? 'black' : 'white';
};

// Method to check if user is player
gameSchema.methods.isPlayer = function(userId, guestId) {
  if (userId) {
    // Handle both populated and non-populated userId fields
    const whiteUserId = this.players.white.userId?._id ? 
      this.players.white.userId._id.toString() : 
      this.players.white.userId?.toString();
    const blackUserId = this.players.black.userId?._id ? 
      this.players.black.userId._id.toString() : 
      this.players.black.userId?.toString();
      
    return (whiteUserId === userId.toString()) || (blackUserId === userId.toString());
  } else if (guestId) {
    return this.players.white.guestId === guestId || this.players.black.guestId === guestId;
  }
  return false;
};

// Method to get player color
gameSchema.methods.getPlayerColor = function(userId, guestId) {
  console.log('getPlayerColor called with:', {
    userId,
    guestId,
    whitePlayer: this.players.white,
    blackPlayer: this.players.black
  });

  // For authenticated users, check by userId
  if (userId) {
    // Handle both populated and non-populated userId fields
    const whiteUserId = this.players.white.userId?._id ? 
      this.players.white.userId._id.toString() : 
      this.players.white.userId?.toString();
    const blackUserId = this.players.black.userId?._id ? 
      this.players.black.userId._id.toString() : 
      this.players.black.userId?.toString();
      
    console.log('User ID comparison:', {
      userId: userId.toString(),
      whiteUserId,
      blackUserId,
      whiteMatch: whiteUserId === userId.toString(),
      blackMatch: blackUserId === userId.toString()
    });

    if (whiteUserId === userId.toString()) return 'white';
    if (blackUserId === userId.toString()) return 'black';
  }
  
  // For guest users, check by guestId
  if (guestId) {
    console.log('Guest ID comparison:', {
      guestId,
      whiteGuestId: this.players.white.guestId,
      blackGuestId: this.players.black.guestId,
      whiteMatch: this.players.white.guestId === guestId,
      blackMatch: this.players.black.guestId === guestId
    });

    if (this.players.white.guestId === guestId) return 'white';
    if (this.players.black.guestId === guestId) return 'black';
  }
  
  return null;
};

// Method to get player color with fallback to username check
gameSchema.methods.getPlayerColorWithFallback = function(userId, guestId, username) {
  console.log('getPlayerColorWithFallback called with:', {
    userId,
    guestId,
    username,
    whitePlayer: this.players.white,
    blackPlayer: this.players.black
  });

  // Try the standard method first
  const color = this.getPlayerColor(userId, guestId);
  if (color) {
    console.log('Standard method returned color:', color);
    return color;
  }
  
  // Fallback to username check for edge cases
  if (username) {
    if (this.players.white.username === username) {
      console.log('Fallback method matched white player by username');
      return 'white';
    }
    if (this.players.black.username === username) {
      console.log('Fallback method matched black player by username');
      return 'black';
    }
  }
  
  console.log('No player color match found');
  return null;
};

module.exports = mongoose.model('Game', gameSchema);
