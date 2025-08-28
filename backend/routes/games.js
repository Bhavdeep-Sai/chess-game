const express = require('express');
const router = express.Router();
const Game = require('../models/Game');
const User = require('../models/User');
const { auth, optionalAuth } = require('../middleware/auth');
const { generateRoomId } = require('../utils/helpers');

// Get active games (lobby)
router.get('/lobby', optionalAuth, async (req, res) => {
  try {
    const games = await Game.find({
      gameStatus: 'waiting'
      // Removed the private filter to show all waiting games
    })
    .populate('players.white.userId', 'username stats.rating')
    .populate('players.black.userId', 'username stats.rating')
    .populate('createdBy', 'username')
    .sort({ createdAt: -1 })
    .limit(20);

    const gameList = games.map(game => ({
      roomId: game.roomId,
      players: {
        white: game.players.white.userId ? {
          username: game.players.white.userId.username,
          rating: game.players.white.userId.stats.rating
        } : game.players.white.username ? {
          username: game.players.white.username,
          rating: 1200,
          isGuest: true
        } : null,
        black: game.players.black.userId ? {
          username: game.players.black.userId.username,
          rating: game.players.black.userId.stats.rating
        } : game.players.black.username ? {
          username: game.players.black.username,
          rating: 1200,
          isGuest: true
        } : null
      },
      timeControl: game.timeControl,
      settings: {
        allowSpectators: game.settings.allowSpectators,
        hasPassword: !!game.settings.password,
        isPrivate: game.settings.isPrivate
      },
      spectatorCount: game.spectators.length,
      createdBy: game.createdBy?.username,
      createdAt: game.createdAt,
      status: game.gameStatus
    }));

    res.json({ games: gameList });
  } catch (error) {
    console.error('Get lobby error:', error);
    res.status(500).json({ error: 'Server error fetching lobby' });
  }
});

// Create new game room
router.post('/create', optionalAuth, async (req, res) => {
  try {
    const { timeControl, settings, isGuest, guestUsername } = req.body;
    
    let roomId;
    let attempts = 0;
    do {
      roomId = generateRoomId();
      const existingGame = await Game.findOne({ roomId });
      if (!existingGame) break;
      attempts++;
    } while (attempts < 10);

    if (attempts >= 10) {
      return res.status(500).json({ error: 'Unable to generate unique room ID' });
    }

    const gameData = {
      roomId,
      timeControl: {
        initialTime: timeControl?.initialTime || 600000, // 10 minutes default
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

    if (req.user) {
      // Authenticated user
      gameData.players = {
        white: {
          userId: req.user._id,
          username: req.user.username,
          isGuest: false
        },
        black: {
          userId: null,
          username: null,
          isGuest: false
        }
      };
      gameData.createdBy = req.user._id;
    } else if (isGuest && guestUsername) {
      // Guest user
      const guestId = require('../utils/helpers').generateGuestId();
      gameData.players = {
        white: {
          userId: null,
          username: guestUsername,
          isGuest: true,
          guestId: guestId
        },
        black: {
          userId: null,
          username: null,
          isGuest: false
        }
      };
    } else {
      return res.status(400).json({ error: 'Authentication required or guest username needed' });
    }

    const game = new Game(gameData);
    await game.save();

    res.status(201).json({
      message: 'Game room created successfully',
      roomId: game.roomId,
      game: game.getGameState()
    });
  } catch (error) {
    console.error('Create game error:', error);
    res.status(500).json({ error: 'Server error creating game' });
  }
});

// Join game room
router.post('/join/:roomId', optionalAuth, async (req, res) => {
  try {
    const { roomId } = req.params;
    const { password, isGuest, guestUsername, spectate } = req.body;

    const game = await Game.findOne({ roomId });
    if (!game) {
      return res.status(404).json({ error: 'Game room not found' });
    }

    // Check password if required
    if (game.settings.password && game.settings.password !== password) {
      return res.status(401).json({ error: 'Incorrect room password' });
    }

    // Check if joining as spectator
    if (spectate) {
      if (!game.settings.allowSpectators) {
        return res.status(403).json({ error: 'Spectating not allowed in this room' });
      }

      const spectatorData = req.user ? {
        userId: req.user._id,
        username: req.user.username,
        isGuest: false
      } : {
        username: guestUsername,
        isGuest: true,
        guestId: require('../utils/helpers').generateGuestId()
      };

      game.spectators.push(spectatorData);
      await game.save();

      return res.json({
        message: 'Joined as spectator',
        game: game.getGameState(),
        playerColor: null
      });
    }

    // Check if user is already in the game to prevent self-play (but allow rejoining)
    const currentUserId = req.user?._id;
    
    // First check if they're already in the game (for rejoining)
    let isRejoining = false;
    if (currentUserId) {
      // Handle both populated and non-populated userId fields
      const whiteUserId = game.players.white.userId?._id ? 
        game.players.white.userId._id.toString() : 
        game.players.white.userId?.toString();
      const blackUserId = game.players.black.userId?._id ? 
        game.players.black.userId._id.toString() : 
        game.players.black.userId?.toString();
        
      isRejoining = (whiteUserId === currentUserId.toString()) || (blackUserId === currentUserId.toString());
    } else if (isGuest && guestUsername) {
      isRejoining = (game.players.white.isGuest && game.players.white.username === guestUsername) ||
                   (game.players.black.isGuest && game.players.black.username === guestUsername);
    }

    if (isRejoining) {
      // They're rejoining an existing game - this is allowed
      let playerColor = null;
      
      if (currentUserId) {
        playerColor = game.getPlayerColor(currentUserId, null);
      } else if (isGuest && guestUsername) {
        // For guest users, check by username since guestId might not match
        if (game.players.white.isGuest && game.players.white.username === guestUsername) {
          playerColor = 'white';
        } else if (game.players.black.isGuest && game.players.black.username === guestUsername) {
          playerColor = 'black';
        }
      }
      
      return res.json({
        message: 'Rejoined game successfully',
        game: game.getGameState(),
        playerColor
      });
    }

    // For new players, check if they would be playing against themselves
    let wouldBeSelfPlay = false;
    if (currentUserId) {
      // Check if authenticated user is already in one slot and trying to join the other
      // Handle both populated and non-populated userId fields
      const whiteUserId = game.players.white.userId?._id ? 
        game.players.white.userId._id.toString() : 
        game.players.white.userId?.toString();
      const blackUserId = game.players.black.userId?._id ? 
        game.players.black.userId._id.toString() : 
        game.players.black.userId?.toString();
        
      wouldBeSelfPlay = (whiteUserId === currentUserId.toString()) || (blackUserId === currentUserId.toString());
    } else if (isGuest && guestUsername) {
      // Check if guest user is already in one slot and trying to join the other
      wouldBeSelfPlay = (game.players.white.isGuest && game.players.white.username === guestUsername) ||
                       (game.players.black.isGuest && game.players.black.username === guestUsername);
    }

    if (wouldBeSelfPlay) {
      return res.status(400).json({ error: 'You cannot play against yourself' });
    }

    // Check if there's space for players (use all identification methods)
    const hasWhitePlayer = game.players.white.userId || game.players.white.guestId || game.players.white.username;
    const hasBlackPlayer = game.players.black.userId || game.players.black.guestId || game.players.black.username;
    
    if (hasWhitePlayer) {
      if (hasBlackPlayer) {
        return res.status(400).json({ error: 'Game room is full' });
      }
      // Join as black
      if (req.user) {
        game.players.black = {
          userId: req.user._id,
          username: req.user.username,
          isGuest: false,
          isReady: false
        };
      } else if (isGuest && guestUsername) {
        const guestId = require('../utils/helpers').generateGuestId();
        game.players.black = {
          userId: null,
          username: guestUsername,
          isGuest: true,
          guestId: guestId,
          isReady: false
        };
      }
    } else {
      // Join as white
      if (req.user) {
        game.players.white = {
          userId: req.user._id,
          username: req.user.username,
          isGuest: false,
          isReady: false
        };
      } else if (isGuest && guestUsername) {
        const guestId = require('../utils/helpers').generateGuestId();
        game.players.white = {
          userId: null,
          username: guestUsername,
          isGuest: true,
          guestId: guestId,
          isReady: false
        };
      }
    }

    await game.save();

    // Calculate player color for the response
    let playerColor = null;
    if (req.user) {
      playerColor = game.getPlayerColor(req.user._id, null);
    } else if (isGuest && guestUsername) {
      // For guest users, determine color based on which slot they just joined
      if (game.players.white.isGuest && game.players.white.username === guestUsername) {
        playerColor = 'white';
      } else if (game.players.black.isGuest && game.players.black.username === guestUsername) {
        playerColor = 'black';
      }
    }

    res.json({
      message: 'Joined game successfully',
      game: game.getGameState(),
      playerColor
    });
  } catch (error) {
    console.error('Join game error:', error);
    res.status(500).json({ error: 'Server error joining game' });
  }
});

// Get game state
router.get('/:roomId', optionalAuth, async (req, res) => {
  try {
    const { roomId } = req.params;

    const game = await Game.findOne({ roomId })
      .populate('players.white.userId', 'username stats.rating')
      .populate('players.black.userId', 'username stats.rating');

    if (!game) {
      return res.status(404).json({ error: 'Game not found' });
    }

    const playerColor = game.getPlayerColor(req.user?._id, req.query.guestId);

    res.json({
      game: game.getGameState(),
      playerColor,
      canJoin: !game.players.white.userId && !game.players.white.guestId || 
               !game.players.black.userId && !game.players.black.guestId
    });
  } catch (error) {
    console.error('Get game error:', error);
    res.status(500).json({ error: 'Server error fetching game' });
  }
});

// Get user's game history
router.get('/user/history', auth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const games = await Game.find({
      $or: [
        { 'players.white.userId': req.user._id },
        { 'players.black.userId': req.user._id }
      ],
      gameStatus: 'finished'
    })
    .populate('players.white.userId', 'username')
    .populate('players.black.userId', 'username')
    .sort({ endedAt: -1 })
    .skip(skip)
    .limit(limit);

    const total = await Game.countDocuments({
      $or: [
        { 'players.white.userId': req.user._id },
        { 'players.black.userId': req.user._id }
      ],
      gameStatus: 'finished'
    });

    res.json({
      games,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get game history error:', error);
    res.status(500).json({ error: 'Server error fetching game history' });
  }
});

module.exports = router;
