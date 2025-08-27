const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Game = require('../models/Game');
const roomManager = require('../utils/roomManager');
const { 
  generateGuestId, 
  generateRoomId,
  calculateNewRating, 
  algebraicNotation 
} = require('../utils/helpers');

// Import chess logic from frontend (we'll need to copy it)
const { 
  initializeBoard, 
  isValidMove, 
  makeMove, 
  requiresPromotion,
  isInCheck, 
  isCheckmate,
  COLORS 
} = require('../utils/chessLogic');

// Socket authentication middleware
const socketAuth = async (socket, next) => {
  try {
    const token = socket.handshake.auth.token;
    const guestId = socket.handshake.auth.guestId;
    const guestUsername = socket.handshake.auth.guestUsername;

    if (token) {
      // Authenticated user
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.userId);
      
      if (user) {
        socket.userId = user._id.toString();
        socket.username = user.username;
        socket.isGuest = false;
        
        // Update user online status
        user.isOnline = true;
        user.lastSeen = new Date();
        await user.save();
      }
    } else if (guestId && guestUsername) {
      // Guest user
      socket.guestId = guestId;
      socket.username = guestUsername;
      socket.isGuest = true;
    }

    next();
  } catch (error) {
    console.error('Socket auth error:', error);
    next(new Error('Authentication failed'));
  }
};

// Socket event handlers
const handleConnection = (io) => {
  return async (socket) => {
    console.log(`User connected: ${socket.username} (${socket.isGuest ? 'Guest' : 'User'})`);

    // Join user to their personal room for notifications
    if (socket.userId) {
      socket.join(`user_${socket.userId}`);
    }

    // Handle disconnection cleanup
    socket.on('disconnect', async () => {
      console.log(`User disconnected: ${socket.username}`);
      
      // Update user offline status for authenticated users
      if (socket.userId) {
        try {
          const user = await User.findById(socket.userId);
          if (user) {
            user.isOnline = false;
            user.lastSeen = new Date();
            await user.save();
          }
        } catch (error) {
          console.error('Error updating user offline status:', error);
        }
      }
      
      // Notify room about disconnection if in a game
      if (socket.currentRoom) {
        socket.to(`game_${socket.currentRoom}`).emit('player_disconnected', {
          username: socket.username,
          isGuest: socket.isGuest
        });
      }
    });

    // Handle creating a game room via socket
    socket.on('create_room', async (data) => {
      try {
        const { timeControl, settings, isGuest, guestUsername } = data;
        
        let roomId;
        let attempts = 0;
        do {
          roomId = generateRoomId();
          const existingGame = await Game.findOne({ roomId });
          if (!existingGame) break;
          attempts++;
        } while (attempts < 10);

        if (attempts >= 10) {
          socket.emit('error', { message: 'Unable to generate unique room ID' });
          return;
        }

        const gameData = {
          roomId,
          timeControl: {
            initialTime: timeControl?.initialTime || 600000,
            increment: timeControl?.increment || 0,
            whiteTime: timeControl?.initialTime || 600000,
            blackTime: timeControl?.initialTime || 600000
          },
          settings: {
            isPrivate: settings?.isPrivate || false,
            password: settings?.password || null,
            allowSpectators: settings?.allowSpectators !== false,
            autoStart: settings?.autoStart || false
          }
        };

        if (socket.userId) {
          // Authenticated user
          gameData.players = {
            white: {
              userId: socket.userId,
              username: socket.username,
              isGuest: false,
              socketId: socket.id
            },
            black: {
              userId: null,
              username: null,
              isGuest: false
            }
          };
          gameData.createdBy = socket.userId;
        } else if (isGuest && guestUsername) {
          // Guest user
          gameData.players = {
            white: {
              userId: null,
              username: guestUsername,
              isGuest: true,
              guestId: socket.guestId,
              socketId: socket.id
            },
            black: {
              userId: null,
              username: null,
              isGuest: false
            }
          };
        } else {
          socket.emit('error', { message: 'Authentication required or guest username needed' });
          return;
        }

        const game = new Game(gameData);
        await game.save();

        // Join the room
        socket.join(`game_${roomId}`);
        socket.currentRoom = roomId;

        // Track room activity
        roomManager.updateRoomActivity(roomId);

        socket.emit('room_created', {
          message: 'Game room created successfully',
          roomId: game.roomId,
          game: game.getGameState()
        });

        console.log(`Room ${roomId} created by ${socket.username}`);

      } catch (error) {
        console.error('Create room error:', error);
        socket.emit('error', { message: 'Failed to create room' });
      }
    });

    // Handle reconnecting to a room
    socket.on('reconnect_to_room', async (data) => {
      try {
        const { roomId } = data;
        
        const game = await Game.findOne({ roomId })
          .populate('players.white.userId', 'username stats.rating')
          .populate('players.black.userId', 'username stats.rating');

        if (!game) {
          socket.emit('error', { message: 'Game room not found' });
          return;
        }

        // Update socket ID for reconnecting player
        let reconnected = false;
        if (socket.userId) {
          // Handle both populated and non-populated userId fields
          const whiteUserId = game.players.white.userId?._id ? 
            game.players.white.userId._id.toString() : 
            game.players.white.userId?.toString();
          const blackUserId = game.players.black.userId?._id ? 
            game.players.black.userId._id.toString() : 
            game.players.black.userId?.toString();
            
          if (whiteUserId === socket.userId) {
            game.players.white.socketId = socket.id;
            reconnected = true;
          } else if (blackUserId === socket.userId) {
            game.players.black.socketId = socket.id;
            reconnected = true;
          }
        } else if (socket.guestId) {
          if (game.players.white.guestId === socket.guestId) {
            game.players.white.socketId = socket.id;
            reconnected = true;
          } else if (game.players.black.guestId === socket.guestId) {
            game.players.black.socketId = socket.id;
            reconnected = true;
          }
        }

        if (reconnected) {
          await game.save();
          
          // Join the room
          socket.join(`game_${roomId}`);
          socket.currentRoom = roomId;
          
          // Update room activity
          roomManager.updateRoomActivity(roomId);

          // Send current game state
          socket.emit('game_state', {
            game: game.getGameState(),
            playerColor: game.getPlayerColor(socket.userId, socket.guestId),
            isSpectator: false
          });

          // Notify others about reconnection
          socket.to(`game_${roomId}`).emit('player_reconnected', {
            username: socket.username,
            isGuest: socket.isGuest
          });

          console.log(`${socket.username} reconnected to room ${roomId}`);
        } else {
          socket.emit('error', { message: 'You are not a player in this game' });
        }

      } catch (error) {
        console.error('Reconnect to room error:', error);
        socket.emit('error', { message: 'Failed to reconnect to room' });
      }
    });

    // Handle joining a game room
    socket.on('join_room', async (data) => {
      try {
        const { roomId, spectate: spectateParam = false } = data;
        let spectate = spectateParam;
        console.log(`${socket.username} attempting to join room ${roomId} (spectate: ${spectate})`);
        
        const game = await Game.findOne({ roomId })
          .populate('players.white.userId', 'username stats.rating')
          .populate('players.black.userId', 'username stats.rating');

        if (!game) {
          console.log(`Room ${roomId} not found for ${socket.username}`);
          socket.emit('error', { message: 'Game room not found' });
          return;
        }

        console.log(`Game found: ${roomId}, current players:`, {
          white: game.players.white.username || 'empty',
          black: game.players.black.username || 'empty'
        });

        // Leave any previous game rooms
        const rooms = Array.from(socket.rooms);
        rooms.forEach(room => {
          if (room.startsWith('game_')) {
            socket.leave(room);
          }
        });

        // Check for existing connections by the same user in this room
        const roomSockets = await io.in(`game_${roomId}`).fetchSockets();
        for (const existingSocket of roomSockets) {
          let isDuplicate = false;
          
          if (socket.userId && existingSocket.userId === socket.userId) {
            isDuplicate = true;
          } else if (socket.guestId && existingSocket.guestId === socket.guestId) {
            isDuplicate = true;
          } else if (socket.isGuest && existingSocket.isGuest && 
                     existingSocket.username === socket.username && 
                     existingSocket.id !== socket.id) {
            isDuplicate = true;
          }
          
          if (isDuplicate && existingSocket.id !== socket.id) {
            console.log(`Disconnecting duplicate connection for ${socket.username} (old: ${existingSocket.id}, new: ${socket.id})`);
            existingSocket.disconnect(true);
          }
        }

        // Join the game room
        socket.join(`game_${roomId}`);
        socket.currentRoom = roomId;

        // Track room activity
        roomManager.updateRoomActivity(roomId);

        if (spectate) {
          // Handle spectator
          const spectatorIndex = game.spectators.findIndex(s => {
            const spectatorUserId = s.userId?._id ? s.userId._id.toString() : s.userId?.toString();
            return spectatorUserId === socket.userId || s.guestId === socket.guestId;
          });
          
          if (spectatorIndex >= 0) {
            game.spectators[spectatorIndex].socketId = socket.id;
          } else if (game.settings.allowSpectators) {
            game.spectators.push({
              userId: socket.userId || null,
              username: socket.username,
              isGuest: socket.isGuest,
              guestId: socket.guestId || null,
              socketId: socket.id
            });
          } else {
            socket.emit('error', { message: 'Spectating not allowed in this room' });
            return;
          }
        } else {
          // Handle player joining
          let playerJoined = false;
          
          // Check if player is already in the game (for reconnection)
          if (socket.userId) {
            // Handle both populated and non-populated userId fields
            const whiteUserId = game.players.white.userId?._id ? 
              game.players.white.userId._id.toString() : 
              game.players.white.userId?.toString();
            const blackUserId = game.players.black.userId?._id ? 
              game.players.black.userId._id.toString() : 
              game.players.black.userId?.toString();
              
            if (whiteUserId === socket.userId) {
              game.players.white.socketId = socket.id;
              playerJoined = true;
              console.log(`${socket.username} reconnected as white player in room ${roomId}`);
            } else if (blackUserId === socket.userId) {
              game.players.black.socketId = socket.id;
              playerJoined = true;
              console.log(`${socket.username} reconnected as black player in room ${roomId}`);
            }
          } else if (socket.guestId) {
            // For guest users, prioritize exact guestId match first
            if (game.players.white.guestId === socket.guestId) {
              game.players.white.socketId = socket.id;
              playerJoined = true;
              console.log(`${socket.username} reconnected as white player in room ${roomId} (exact guestId match)`);
            } else if (game.players.black.guestId === socket.guestId) {
              game.players.black.socketId = socket.id;
              playerJoined = true;
              console.log(`${socket.username} reconnected as black player in room ${roomId} (exact guestId match)`);
            }
            // If no exact guestId match, check for username match (guest reconnection with new ID)
            else if (game.players.white.isGuest && 
                     game.players.white.username === socket.username &&
                     game.players.white.guestId !== socket.guestId) {
              // Update the guestId for this reconnection
              game.players.white.socketId = socket.id;
              game.players.white.guestId = socket.guestId;
              playerJoined = true;
              console.log(`${socket.username} reconnected as white player in room ${roomId} (username match, updated guestId from ${game.players.white.guestId} to ${socket.guestId})`);
            } else if (game.players.black.isGuest && 
                       game.players.black.username === socket.username &&
                       game.players.black.guestId !== socket.guestId) {
              // Update the guestId for this reconnection
              game.players.black.socketId = socket.id;
              game.players.black.guestId = socket.guestId;
              playerJoined = true;
              console.log(`${socket.username} reconnected as black player in room ${roomId} (username match, updated guestId from ${game.players.black.guestId} to ${socket.guestId})`);
            }
          }

          // If not already a player, try to join as new player
          if (!playerJoined) {
            console.log(`${socket.username} attempting to join as new player. Current game state:`, {
              whitePlayer: game.players.white.username || 'empty',
              blackPlayer: game.players.black.username || 'empty',
              whiteUserId: game.players.white.userId?.toString(),
              blackUserId: game.players.black.userId?.toString(),
              whiteGuestId: game.players.white.guestId,
              blackGuestId: game.players.black.guestId,
              socketUserId: socket.userId,
              socketGuestId: socket.guestId,
              socketUsername: socket.username
            });
            
            // Prevent same user from playing against themselves
            let wouldBeSelfPlay = false;
            
            if (socket.userId) {
              // For authenticated users, check if they're already in the game
              // Handle both populated and non-populated userId fields
              const whiteUserId = game.players.white.userId?._id ? 
                game.players.white.userId._id.toString() : 
                game.players.white.userId?.toString();
              const blackUserId = game.players.black.userId?._id ? 
                game.players.black.userId._id.toString() : 
                game.players.black.userId?.toString();
              
              wouldBeSelfPlay = (whiteUserId === socket.userId) || (blackUserId === socket.userId);
              console.log(`Auth user ${socket.username} self-play check: wouldBeSelfPlay=${wouldBeSelfPlay}`);
              console.log(`Detailed check - whiteUserId: ${whiteUserId}, blackUserId: ${blackUserId}, socketUserId: ${socket.userId}`);
            } else if (socket.isGuest && socket.guestId) {
              // For guest users, only block if the same guestId is in both slots
              // OR if the same username is in both slots (very unlikely but possible)
              const sameGuestIdInWhite = game.players.white.guestId === socket.guestId;
              const sameGuestIdInBlack = game.players.black.guestId === socket.guestId;
              const sameUsernameInWhite = game.players.white.isGuest && game.players.white.username === socket.username;
              const sameUsernameInBlack = game.players.black.isGuest && game.players.black.username === socket.username;
              const sameUsernameInBothSlots = sameUsernameInWhite && sameUsernameInBlack;
              
              wouldBeSelfPlay = sameGuestIdInWhite || sameGuestIdInBlack || sameUsernameInBothSlots;
              console.log(`Guest user ${socket.username} self-play check: wouldBeSelfPlay=${wouldBeSelfPlay}`);
              console.log(`Detailed check - guestId in white: ${sameGuestIdInWhite}, guestId in black: ${sameGuestIdInBlack}, username in white: ${sameUsernameInWhite}, username in black: ${sameUsernameInBlack}, username in both: ${sameUsernameInBothSlots}`);
              console.log(`Game state - white: {userId: ${game.players.white.userId}, guestId: ${game.players.white.guestId}, username: ${game.players.white.username}, isGuest: ${game.players.white.isGuest}}, black: {userId: ${game.players.black.userId}, guestId: ${game.players.black.guestId}, username: ${game.players.black.username}, isGuest: ${game.players.black.isGuest}}`);
            }

            if (wouldBeSelfPlay) {
              console.log(`${socket.username} blocked from self-play in room ${roomId}`);
              socket.emit('error', { message: 'You cannot play against yourself' });
              return;
            }

            if (!game.players.white.userId && !game.players.white.guestId) {
              // Join as white
              game.players.white = {
                userId: socket.userId || null,
                username: socket.username,
                isGuest: socket.isGuest,
                guestId: socket.guestId || null,
                socketId: socket.id,
                isReady: false
              };
              playerJoined = true;
              console.log(`${socket.username} joined as white player in room ${roomId}`);
            } else if (!game.players.black.userId && !game.players.black.guestId) {
              // Join as black
              game.players.black = {
                userId: socket.userId || null,
                username: socket.username,
                isGuest: socket.isGuest,
                guestId: socket.guestId || null,
                socketId: socket.id,
                isReady: false
              };
              playerJoined = true;
              console.log(`${socket.username} joined as black player in room ${roomId}`);
            }
          }

          if (!playerJoined) {
            // Room is full, join as spectator if allowed
            if (game.settings.allowSpectators) {
              game.spectators.push({
                userId: socket.userId || null,
                username: socket.username,
                isGuest: socket.isGuest,
                guestId: socket.guestId || null,
                socketId: socket.id
              });
              spectate = true;
            } else {
              socket.emit('error', { message: 'Game room is full' });
              return;
            }
          }
        }

        await game.save();

        // Send game state to the user
        socket.emit('game_state', {
          game: game.getGameState(),
          playerColor: game.getPlayerColor(socket.userId, socket.guestId),
          isSpectator: spectate
        });

        // Notify others in the room
        socket.to(`game_${roomId}`).emit('player_joined', {
          username: socket.username,
          isGuest: socket.isGuest,
          isSpectator: spectate
        });

        console.log(`${socket.username} joined room ${roomId} as ${spectate ? 'spectator' : 'player'}`);

      } catch (error) {
        console.error('Join room error:', error);
        socket.emit('error', { message: 'Failed to join room: ' + error.message });
      }
    });

    // Handle player ready status
    socket.on('player_ready', async (data) => {
      try {
        const { roomId } = data;
        
        const game = await Game.findOne({ roomId });
        if (!game) {
          socket.emit('error', { message: 'Game not found' });
          return;
        }

        // Use the existing getPlayerColor method for consistency
        const playerColor = game.getPlayerColor(socket.userId, socket.guestId);
        
        if (!playerColor) {
          console.log(`Player identification failed for ${socket.username}:`, {
            socketUserId: socket.userId,
            socketGuestId: socket.guestId,
            whiteUserId: game.players.white.userId?.toString(),
            whiteGuestId: game.players.white.guestId,
            blackUserId: game.players.black.userId?.toString(),
            blackGuestId: game.players.black.guestId
          });
          socket.emit('error', { message: 'You are not a player in this game' });
          return;
        }

        // Update player ready status
        if (playerColor === 'white') {
          game.players.white.isReady = true;
        } else if (playerColor === 'black') {
          game.players.black.isReady = true;
        }

        console.log(`Player ${socket.username} (${playerColor}) is ready in room ${roomId}`);

        // Check if both players are ready and exist
        const whiteReady = game.players.white.isReady && 
                          (game.players.white.userId || game.players.white.guestId);
        const blackReady = game.players.black.isReady && 
                          (game.players.black.userId || game.players.black.guestId);

        if (whiteReady && blackReady && game.gameStatus === 'waiting') {
          game.gameStatus = 'active';
          game.startedAt = new Date();
          game.board = initializeBoard();
          game.currentPlayer = 'white';

          console.log(`Game ${roomId} started!`);
        }

        await game.save();

        // Track room activity
        roomManager.updateRoomActivity(roomId);

        // Broadcast to all players in the room
        io.to(`game_${roomId}`).emit('game_state', {
          game: game.getGameState()
        });

        if (game.gameStatus === 'active') {
          io.to(`game_${roomId}`).emit('game_started', {
            message: 'Game has started!',
            gameState: game.getGameState()
          });

          // Add game start message to chat
          game.chat.push({
            username: 'System',
            message: 'Game started! White to move.',
            isSystem: true
          });
          await game.save();

          io.to(`game_${roomId}`).emit('chat_message', {
            username: 'System',
            message: 'Game started! White to move.',
            isSystem: true,
            timestamp: new Date()
          });
        }

      } catch (error) {
        console.error('Player ready error:', error);
        socket.emit('error', { message: 'Failed to update ready status' });
      }
    });

    // Handle chess moves
    socket.on('make_move', async (data) => {
      try {
        const { roomId, from, to } = data;
        
        const game = await Game.findOne({ roomId });
        if (!game) {
          socket.emit('error', { message: 'Game not found' });
          return;
        }

        if (game.gameStatus !== 'active') {
          socket.emit('error', { message: 'Game is not active' });
          return;
        }

        // Verify it's the player's turn
        const playerColor = game.getPlayerColor(socket.userId, socket.guestId);
        console.log('Make move debug:', {
          socketUserId: socket.userId,
          socketGuestId: socket.guestId,
          socketUsername: socket.username,
          playerColor,
          currentPlayer: game.currentPlayer,
          whitePlayer: game.players.white,
          blackPlayer: game.players.black
        });
        
        if (!playerColor) {
          socket.emit('error', { message: 'You are not a player in this game' });
          return;
        }
        
        if (playerColor !== game.currentPlayer) {
          socket.emit('error', { message: 'Not your turn' });
          return;
        }

        // Validate and make the move
        const board = game.board;
        const piece = board[from.row][from.col];
        
        if (!piece) {
          socket.emit('error', { message: 'No piece at starting position' });
          return;
        }

        if (piece.color !== playerColor) {
          socket.emit('error', { message: 'Not your piece' });
          return;
        }

        // Check if move requires promotion
        if (requiresPromotion(board, from.row, from.col, to.row, to.col)) {
          // Send promotion request to client
          socket.emit('promotion_required', {
            from,
            to,
            roomId
          });
          return;
        }

        if (!isValidMove(board, from.row, from.col, to.row, to.col)) {
          socket.emit('error', { message: 'Invalid move' });
          return;
        }

        const capturedPiece = board[to.row][to.col];
        const newBoard = makeMove(board, from.row, from.col, to.row, to.col);

        // Check if move puts own king in check
        if (isInCheck(newBoard, playerColor)) {
          socket.emit('error', { message: 'Move would put your king in check' });
          return;
        }

        // Update game state
        game.board = newBoard;

        // Check for check/checkmate before switching turns
        const opponentColor = playerColor === COLORS.WHITE ? COLORS.BLACK : COLORS.WHITE;
        const isOpponentInCheck = isInCheck(newBoard, opponentColor);
        const isOpponentCheckmate = isCheckmate(newBoard, opponentColor);

        // Create move record
        const moveRecord = {
          from,
          to,
          piece,
          captured: capturedPiece,
          notation: algebraicNotation(from, to, piece, capturedPiece, isOpponentInCheck, isOpponentCheckmate),
          timestamp: new Date()
        };

        // Add move (this will switch the turn)
        game.addMove(moveRecord);

        // Handle game end
        if (isOpponentCheckmate) {
          game.gameStatus = 'finished';
          game.endedAt = new Date();
          game.result = {
            winner: playerColor,
            reason: 'checkmate'
          };

          // Update player stats and ratings
          await updatePlayerStats(game, playerColor, 'checkmate');
        }

        await game.save();

        // Track room activity
        roomManager.updateRoomActivity(roomId);

        // Broadcast move to all players
        io.to(`game_${roomId}`).emit('move_made', {
          move: moveRecord,
          board: newBoard,
          currentPlayer: game.currentPlayer,
          isCheck: isOpponentInCheck,
          isCheckmate: isOpponentCheckmate,
          gameStatus: game.gameStatus,
          result: game.result
        });

        // Add move to chat as system message
        if (game.gameStatus === 'finished') {
          const winnerName = playerColor === 'white' ? 
            (game.players.white.username) : 
            (game.players.black.username);
          
          game.chat.push({
            username: 'System',
            message: `${winnerName} wins by checkmate!`,
            isSystem: true
          });
          await game.save();
          
          io.to(`game_${roomId}`).emit('chat_message', {
            username: 'System',
            message: `${winnerName} wins by checkmate!`,
            isSystem: true,
            timestamp: new Date()
          });
        }

      } catch (error) {
        console.error('Make move error:', error);
        socket.emit('error', { message: 'Failed to make move' });
      }
    });

    // Handle pawn promotion
    socket.on('promote_pawn', async (data) => {
      try {
        const { roomId, from, to, promotion } = data;
        
        const game = await Game.findOne({ roomId });
        if (!game) {
          socket.emit('error', { message: 'Game not found' });
          return;
        }

        if (game.gameStatus !== 'active') {
          socket.emit('error', { message: 'Game is not active' });
          return;
        }

        // Verify it's the player's turn
        const playerColor = game.getPlayerColor(socket.userId, socket.guestId);
        if (!playerColor || playerColor !== game.currentPlayer) {
          socket.emit('error', { message: 'Not your turn' });
          return;
        }

        const board = game.board;
        const piece = board[from.row][from.col];
        
        if (!piece || piece.color !== playerColor) {
          socket.emit('error', { message: 'Invalid piece' });
          return;
        }

        // Validate promotion piece
        const validPromotions = ['queen', 'rook', 'bishop', 'knight'];
        if (!validPromotions.includes(promotion)) {
          socket.emit('error', { message: 'Invalid promotion piece' });
          return;
        }

        if (!requiresPromotion(board, from.row, from.col, to.row, to.col)) {
          socket.emit('error', { message: 'Move does not require promotion' });
          return;
        }

        if (!isValidMove(board, from.row, from.col, to.row, to.col)) {
          socket.emit('error', { message: 'Invalid move' });
          return;
        }

        const capturedPiece = board[to.row][to.col];
        const newBoard = makeMove(board, from.row, from.col, to.row, to.col, promotion);

        // Check if move puts own king in check
        if (isInCheck(newBoard, playerColor)) {
          socket.emit('error', { message: 'Move would put your king in check' });
          return;
        }

        // Update game state
        game.board = newBoard;

        // Check for check/checkmate before switching turns
        const opponentColor = playerColor === COLORS.WHITE ? COLORS.BLACK : COLORS.WHITE;
        const isOpponentInCheck = isInCheck(newBoard, opponentColor);
        const isOpponentCheckmate = isCheckmate(newBoard, opponentColor);

        // Create move record with promotion
        const moveRecord = {
          from,
          to,
          piece,
          captured: capturedPiece,
          promotion,
          notation: algebraicNotation(from, to, piece, capturedPiece, isOpponentInCheck, isOpponentCheckmate, promotion),
          timestamp: new Date()
        };

        // Add move (this will switch the turn)
        game.addMove(moveRecord);

        // Handle game end
        if (isOpponentCheckmate) {
          game.gameStatus = 'finished';
          game.endedAt = new Date();
          game.result = {
            winner: playerColor,
            reason: 'checkmate'
          };

          // Update player stats and ratings
          await updatePlayerStats(game, playerColor, 'checkmate');
        }

        await game.save();

        // Track room activity
        roomManager.updateRoomActivity(roomId);

        // Broadcast move to all players
        io.to(`game_${roomId}`).emit('move_made', {
          move: moveRecord,
          board: newBoard,
          currentPlayer: game.currentPlayer,
          isCheck: isOpponentInCheck,
          isCheckmate: isOpponentCheckmate,
          gameStatus: game.gameStatus,
          result: game.result
        });

        // Add promotion message to chat
        game.chat.push({
          username: 'System',
          message: `${socket.username} promoted pawn to ${promotion}`,
          isSystem: true
        });
        await game.save();
        
        io.to(`game_${roomId}`).emit('chat_message', {
          username: 'System',
          message: `${socket.username} promoted pawn to ${promotion}`,
          isSystem: true,
          timestamp: new Date()
        });

      } catch (error) {
        console.error('Promote pawn error:', error);
        socket.emit('error', { message: 'Failed to promote pawn' });
      }
    });

    // Handle chat messages
    socket.on('send_message', async (data) => {
      try {
        const { roomId, message } = data;
        
        if (!message || message.trim().length === 0) {
          return;
        }

        const game = await Game.findOne({ roomId });
        if (!game) {
          socket.emit('error', { message: 'Game not found' });
          return;
        }

        // Check if user is in the game
        const isPlayer = game.isPlayer(socket.userId, socket.guestId);
        const isSpectator = game.spectators.some(s => {
          const spectatorUserId = s.userId?._id ? s.userId._id.toString() : s.userId?.toString();
          return spectatorUserId === socket.userId || s.guestId === socket.guestId;
        });

        if (!isPlayer && !isSpectator) {
          socket.emit('error', { message: 'You are not in this game' });
          return;
        }

        const chatMessage = {
          userId: socket.userId || null,
          username: socket.username,
          message: message.trim(),
          timestamp: new Date(),
          isSystem: false
        };

        game.chat.push(chatMessage);
        await game.save();

        // Track room activity
        roomManager.updateRoomActivity(roomId);

        // Broadcast to all users in the room
        io.to(`game_${roomId}`).emit('chat_message', chatMessage);

      } catch (error) {
        console.error('Send message error:', error);
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    // Handle game resignation
    socket.on('resign', async (data) => {
      try {
        const { roomId } = data;
        
        const game = await Game.findOne({ roomId });
        if (!game) {
          socket.emit('error', { message: 'Game not found' });
          return;
        }

        const playerColor = game.getPlayerColor(socket.userId, socket.guestId);
        if (!playerColor) {
          socket.emit('error', { message: 'You are not a player in this game' });
          return;
        }

        if (game.gameStatus !== 'active') {
          socket.emit('error', { message: 'Game is not active' });
          return;
        }

        // End the game
        game.gameStatus = 'finished';
        game.endedAt = new Date();
        game.result = {
          winner: playerColor === 'white' ? 'black' : 'white',
          reason: 'resignation'
        };

        // Update player stats
        await updatePlayerStats(game, game.result.winner, 'resignation');

        await game.save();

        // Track room activity
        roomManager.updateRoomActivity(roomId);

        // Add resignation message to chat
        game.chat.push({
          username: 'System',
          message: `${socket.username} resigned. ${game.result.winner === 'white' ? 
            game.players.white.username : game.players.black.username} wins!`,
          isSystem: true
        });
        await game.save();

        // Broadcast to all players
        io.to(`game_${roomId}`).emit('game_ended', {
          result: game.result,
          gameStatus: game.gameStatus
        });

        io.to(`game_${roomId}`).emit('chat_message', {
          username: 'System',
          message: `${socket.username} resigned. ${game.result.winner === 'white' ? 
            game.players.white.username : game.players.black.username} wins!`,
          isSystem: true,
          timestamp: new Date()
        });

      } catch (error) {
        console.error('Resign error:', error);
        socket.emit('error', { message: 'Failed to resign' });
      }
    });

    // Handle explicit leave room
    socket.on('leave_room', async (data) => {
      try {
        const { roomId } = data;
        
        const game = await Game.findOne({ roomId });
        if (!game) {
          return;
        }

        let playerLeft = false;
        let playerColor = null;

        // Remove from spectators
        const initialSpectatorCount = game.spectators.length;
        game.spectators = game.spectators.filter(s => {
          const spectatorUserId = s.userId?._id ? s.userId._id.toString() : s.userId?.toString();
          return spectatorUserId !== socket.userId && s.guestId !== socket.guestId;
        });

        // Remove player
        const whiteUserId = game.players.white.userId?._id ? 
          game.players.white.userId._id.toString() : 
          game.players.white.userId?.toString();
        const blackUserId = game.players.black.userId?._id ? 
          game.players.black.userId._id.toString() : 
          game.players.black.userId?.toString();
          
        if (whiteUserId === socket.userId || game.players.white.guestId === socket.guestId) {
          game.players.white = {
            userId: null,
            username: null,
            isGuest: false,
            guestId: null,
            socketId: null,
            isReady: false
          };
          playerLeft = true;
          playerColor = 'white';
        } else if (blackUserId === socket.userId || game.players.black.guestId === socket.guestId) {
          game.players.black = {
            userId: null,
            username: null,
            isGuest: false,
            guestId: null,
            socketId: null,
            isReady: false
          };
          playerLeft = true;
          playerColor = 'black';
        }

        // Check if room should be closed
        const hasPlayers = (game.players.white.userId || game.players.white.guestId) ||
                          (game.players.black.userId || game.players.black.guestId);

        if (!hasPlayers && game.spectators.length === 0) {
          // Delete empty room
          await Game.deleteOne({ roomId });
          roomManager.removeRoom(roomId);
          console.log(`Deleted empty room ${roomId}`);
          return;
        }

        // If in active game and player left, end the game
        if (playerLeft && game.gameStatus === 'active') {
          game.gameStatus = 'finished';
          game.endedAt = new Date();
          game.result = {
            winner: playerColor === 'white' ? 'black' : 'white',
            reason: 'resignation'
          };

          // Add leave message to chat
          game.chat.push({
            username: 'System',
            message: `${socket.username} left the game. ${game.result.winner} wins!`,
            isSystem: true
          });
        }

        await game.save();

        // Leave the socket room
        socket.leave(`game_${roomId}`);
        socket.currentRoom = null;

        // Notify others
        socket.to(`game_${roomId}`).emit('player_left', {
          username: socket.username,
          isGuest: socket.isGuest,
          playerColor: playerColor,
          gameStatus: game.gameStatus,
          result: game.result
        });

        if (playerLeft && game.gameStatus === 'finished') {
          socket.to(`game_${roomId}`).emit('game_ended', {
            result: game.result,
            gameStatus: game.gameStatus
          });

          socket.to(`game_${roomId}`).emit('chat_message', {
            username: 'System',
            message: `${socket.username} left the game. ${game.result.winner} wins!`,
            isSystem: true,
            timestamp: new Date()
          });
        }

      } catch (error) {
        console.error('Leave room error:', error);
      }
    });

    // Handle disconnection
    socket.on('disconnect', async () => {
      console.log(`User disconnected: ${socket.username}`);
      
      try {
        // Update user offline status
        if (socket.userId) {
          const user = await User.findById(socket.userId);
          if (user) {
            user.isOnline = false;
            user.lastSeen = new Date();
            await user.save();
          }
        }

        // Handle game room disconnection
        if (socket.currentRoom) {
          const game = await Game.findOne({ roomId: socket.currentRoom });
          if (game) {
            let playerLeft = false;
            let playerColor = null;

            // Remove from spectators
            const initialSpectatorCount = game.spectators.length;
            game.spectators = game.spectators.filter(s => s.socketId !== socket.id);

            // Clear socket ID from players and check if player left
            if (game.players.white.socketId === socket.id) {
              game.players.white.socketId = null;
              playerLeft = true;
              playerColor = 'white';
            }
            if (game.players.black.socketId === socket.id) {
              game.players.black.socketId = null;
              playerLeft = true;
              playerColor = 'black';
            }

            // If both players have left, close the room
            const bothPlayersGone = (!game.players.white.socketId && 
                                   (game.players.white.userId || game.players.white.guestId)) &&
                                  (!game.players.black.socketId && 
                                   (game.players.black.userId || game.players.black.guestId));

            if (bothPlayersGone && game.spectators.length === 0) {
              // Close the room if no active connections
              console.log(`Closing room ${socket.currentRoom} - no active players`);
              
              if (game.gameStatus === 'active') {
                // Mark game as abandoned
                game.gameStatus = 'finished';
                game.endedAt = new Date();
                game.result = {
                  winner: 'draw',
                  reason: 'abandoned'
                };
              } else if (game.gameStatus === 'waiting') {
                // Delete waiting games with no players
                await Game.deleteOne({ roomId: socket.currentRoom });
                roomManager.removeRoom(socket.currentRoom);
                return;
              }
            }

            // Check if room is completely empty (no players or spectators)
            const hasAnyUsers = (game.players.white.userId || game.players.white.guestId) ||
                               (game.players.black.userId || game.players.black.guestId) ||
                               game.spectators.length > 0;

            if (!hasAnyUsers) {
              await Game.deleteOne({ roomId: socket.currentRoom });
              roomManager.removeRoom(socket.currentRoom);
              console.log(`Deleted completely empty room ${socket.currentRoom}`);
              return;
            }

            await game.save();

            // Notify others in the room about disconnection
            if (playerLeft || initialSpectatorCount !== game.spectators.length) {
              socket.to(`game_${socket.currentRoom}`).emit('player_disconnected', {
                username: socket.username,
                isGuest: socket.isGuest,
                playerColor: playerColor,
                isSpectator: !playerLeft
              });

              // If a player left during active game, notify about potential abandonment
              if (playerLeft && game.gameStatus === 'active') {
                socket.to(`game_${socket.currentRoom}`).emit('chat_message', {
                  username: 'System',
                  message: `${socket.username} disconnected.`,
                  isSystem: true,
                  timestamp: new Date()
                });
              }
            }
          }
        }
      } catch (error) {
        console.error('Disconnect error:', error);
      }
    });
  };
};

// Helper function to update player statistics
const updatePlayerStats = async (game, winnerColor, reason) => {
  try {
    const whitePlayer = game.players.white;
    const blackPlayer = game.players.black;

    // Only update stats for registered users
    if (whitePlayer.userId) {
      const user = await User.findById(whitePlayer.userId);
      if (user) {
        user.stats.gamesPlayed += 1;
        if (winnerColor === 'white') {
          user.stats.gamesWon += 1;
        } else if (winnerColor === 'black') {
          user.stats.gamesLost += 1;
        } else {
          user.stats.gamesDrawn += 1;
        }

        // Update rating if both players are registered
        if (blackPlayer.userId) {
          const blackUser = await User.findById(blackPlayer.userId);
          if (blackUser) {
            const result = winnerColor === 'white' ? 'win' : 
                          winnerColor === 'black' ? 'loss' : 'draw';
            user.stats.rating = calculateNewRating(
              user.stats.rating, 
              blackUser.stats.rating, 
              result
            );
          }
        }

        await user.save();
      }
    }

    if (blackPlayer.userId) {
      const user = await User.findById(blackPlayer.userId);
      if (user) {
        user.stats.gamesPlayed += 1;
        if (winnerColor === 'black') {
          user.stats.gamesWon += 1;
        } else if (winnerColor === 'white') {
          user.stats.gamesLost += 1;
        } else {
          user.stats.gamesDrawn += 1;
        }

        // Update rating if both players are registered
        if (whitePlayer.userId) {
          const whiteUser = await User.findById(whitePlayer.userId);
          if (whiteUser) {
            const result = winnerColor === 'black' ? 'win' : 
                          winnerColor === 'white' ? 'loss' : 'draw';
            user.stats.rating = calculateNewRating(
              user.stats.rating, 
              whiteUser.stats.rating, 
              result
            );
          }
        }

        await user.save();
      }
    }
  } catch (error) {
    console.error('Update stats error:', error);
  }
};

module.exports = { socketAuth, handleConnection };
