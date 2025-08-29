import React, { useState, useEffect, useCallback } from 'react';
import Square from './Square';
import GameInfo from './GameInfo';
import ChatBox from './ChatBox';
import MoveHistory from './MoveHistory';
import PromotionModal from './PromotionModal';
import CapturedPieces from './CapturedPieces';
import ThemeToggle from './ThemeToggle';
import socketService from '../services/socket';
import { gamesApi } from '../services/api';
import { getLegalMovesWithTypes } from '../utils/chess';
import { useTheme } from '../hooks/useTheme';

const MultiplayerChessBoard = ({ roomId, playerColor: initialPlayerColor, isGuest, guestData, onLeaveGame }) => {
  const theme = useTheme();
  const [gameState, setGameState] = useState(null);
  const [playerColor, setPlayerColor] = useState(initialPlayerColor);
  const [selectedSquare, setSelectedSquare] = useState(null);
  const [possibleMoves, setPossibleMoves] = useState([]);
  const [captureMoves, setCaptureMoves] = useState([]);
  const [isMyTurn, setIsMyTurn] = useState(false);
  const [gameStatus, setGameStatus] = useState('waiting');
  const [timeLeft, setTimeLeft] = useState({ white: 0, black: 0 });
  const [isReady, setIsReady] = useState(false);
  const [messages, setMessages] = useState([]);
  const [isSpectator, setIsSpectator] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('connecting');
  const [isInCheck, setIsInCheck] = useState(false);
  const [promotionData, setPromotionData] = useState(null);
  const [bothPlayersReady, setBothPlayersReady] = useState(false);
  const [capturedPieces, setCapturedPieces] = useState({ white: [], black: [] });
  const [moveStartTime, setMoveStartTime] = useState(null);
  const [lastMoveTime, setLastMoveTime] = useState(null);
  const [lastMove, setLastMove] = useState(null);

  // Initialize socket connection
  useEffect(() => {
    const connectSocket = () => {
      console.log('Initializing socket connection...');
      if (isGuest && guestData) {
        console.log('Connecting as guest with data:', guestData);
        socketService.connectAsGuest(guestData.id, guestData.username);
      } else {
        console.log('Connecting as authenticated user');
        socketService.connect();
      }
    };

    connectSocket();

    // Handle socket connection status
    const handleConnect = () => {
      console.log('Socket connected in chess board');
      setConnectionStatus('connected');
      // Join room once connected
      if (roomId) {
        console.log('Joining room:', roomId);
        // Always join as player unless explicitly spectating
        socketService.joinRoom(roomId, false);
      }
    };

    const handleDisconnect = () => {
      console.log('Socket disconnected in chess board');
      setConnectionStatus('connecting');
    };

    socketService.on('connect', handleConnect);
    socketService.on('disconnect', handleDisconnect);

    return () => {
      console.log('Cleaning up socket listeners');
      socketService.off('connect', handleConnect);
      socketService.off('disconnect', handleDisconnect);
      socketService.removeAllListeners();
    };
  }, [isGuest, guestData, roomId, isSpectator]);

  // Calculate captured pieces from moves
  const calculateCapturedPieces = useCallback((moves) => {
    const captured = { white: [], black: [] };

    if (!moves || !Array.isArray(moves)) return captured;

    moves.forEach(move => {
      if (move.captured) {
        // The piece was captured by the player who made the move
        // So if white moved and captured a piece, white gets the captured piece
        const capturedBy = move.piece?.color || 'white'; // Default to white if not specified
        captured[capturedBy].push(move.captured);
      }
    });

    return captured;
  }, []);

  // Update captured pieces when game state changes
  useEffect(() => {
    if (gameState?.moves) {
      const newCapturedPieces = calculateCapturedPieces(gameState.moves);
      setCapturedPieces(newCapturedPieces);
    }
  }, [gameState?.moves, calculateCapturedPieces]);

  // Update isMyTurn when gameState or playerColor changes
  useEffect(() => {
    if (gameState && playerColor && !isSpectator) {
      const myTurn = gameState.currentPlayer === playerColor;
      console.log('Turn calculation:', {
        currentPlayer: gameState.currentPlayer,
        playerColor,
        isSpectator,
        myTurn
      });
      setIsMyTurn(myTurn);
    } else {
      console.log('Turn calculation failed:', {
        hasGameState: !!gameState,
        playerColor,
        isSpectator,
        currentPlayer: gameState?.currentPlayer
      });
      setIsMyTurn(false);
    }
  }, [gameState, playerColor, isSpectator]);

  // Debug effect to track playerColor changes
  useEffect(() => {
    console.log('PlayerColor changed:', {
      newPlayerColor: playerColor,
      gameState: !!gameState,
      currentPlayer: gameState?.currentPlayer,
      isSpectator
    });
  }, [playerColor, gameState, isSpectator]);
  const loadGameState = useCallback(async () => {
    try {
      const response = await gamesApi.getGame(roomId, isGuest ? guestData.id : null);
      const gameData = response.data.game;
      setGameState(gameData);
      setPlayerColor(response.data.playerColor); // Update player color from API
      setIsSpectator(!response.data.playerColor);

      console.log('API response playerColor:', response.data.playerColor);

      // Check if both players are ready AND exist (check all identification methods)
      const hasWhitePlayer = gameData.players?.white?.userId || gameData.players?.white?.guestId || gameData.players?.white?.username;
      const hasBlackPlayer = gameData.players?.black?.userId || gameData.players?.black?.guestId || gameData.players?.black?.username;
      const whiteReady = gameData.players?.white?.isReady || false;
      const blackReady = gameData.players?.black?.isReady || false;
      setBothPlayersReady(hasWhitePlayer && hasBlackPlayer && whiteReady && blackReady);

      console.log('Game state loaded:', {
        hasWhitePlayer,
        hasBlackPlayer,
        whiteReady,
        blackReady,
        bothReady: hasWhitePlayer && hasBlackPlayer && whiteReady && blackReady,
        gameStatus: gameData.gameStatus,
        whitePlayer: gameData.players?.white,
        blackPlayer: gameData.players?.black
      });

    } catch (error) {
      console.error('Failed to load game state:', error);
    }
  }, [roomId, isGuest, guestData]);

  // Set up socket event listeners
  useEffect(() => {
    const handleGameState = (data) => {
      console.log('Received game_state event - RAW DATA:', data);
      console.log('Current state before update:', {
        currentPlayerColor: playerColor,
        currentIsSpectator: isSpectator,
        currentGameStatus: gameStatus
      });
      
      console.log('Received game_state:', {
        playerColor: data.playerColor,
        isSpectator: data.isSpectator,
        gameStatus: data.game?.gameStatus,
        roomId: data.game?.roomId,
        currentPlayer: data.game?.currentPlayer
      });
      
      setGameState(data.game);
      console.log('Setting playerColor to:', data.playerColor);
      setPlayerColor(data.playerColor); // Update player color from backend
      setIsSpectator(data.isSpectator || false);
      setGameStatus(data.game.gameStatus);

      // Set ready state based on backend data
      if (data.playerColor && data.game?.players) {
        const isPlayerReady = data.playerColor === 'white' 
          ? data.game.players.white?.isReady 
          : data.game.players.black?.isReady;
        setIsReady(!!isPlayerReady);
        console.log('Updated ready state:', { playerColor: data.playerColor, isReady: !!isPlayerReady });
      }

      if (data.game.timeControl) {
        setTimeLeft({
          white: data.game.timeControl.whiteTime,
          black: data.game.timeControl.blackTime
        });
      }

      // Check if both players are ready AND exist (check all identification methods)
      const hasWhitePlayer = data.game.players?.white?.userId || data.game.players?.white?.guestId || data.game.players?.white?.username;
      const hasBlackPlayer = data.game.players?.black?.userId || data.game.players?.black?.guestId || data.game.players?.black?.username;
      const whiteReady = data.game.players?.white?.isReady || false;
      const blackReady = data.game.players?.black?.isReady || false;
      setBothPlayersReady(hasWhitePlayer && hasBlackPlayer && whiteReady && blackReady);

      console.log('Socket game state updated:', {
        hasWhitePlayer,
        hasBlackPlayer,
        whiteReady,
        blackReady,
        bothReady: hasWhitePlayer && hasBlackPlayer && whiteReady && blackReady,
        gameStatus: data.game.gameStatus,
        whitePlayer: data.game.players?.white,
        blackPlayer: data.game.players?.black,
        currentPlayer: data.game.currentPlayer,
        myTurn: data.game.currentPlayer === data.playerColor && !data.isSpectator
      });

      setIsMyTurn(data.game.currentPlayer === data.playerColor && !data.isSpectator);
      setConnectionStatus('connected');
    };

    const handleMoveMade = (data) => {
      console.log('Move made received:', {
        currentPlayer: data.currentPlayer,
        playerColor: playerColor,
        isSpectator: isSpectator,
        shouldBeMyTurn: data.currentPlayer === playerColor && !isSpectator
      });
      
      setGameState(prev => ({
        ...prev,
        board: data.board,
        currentPlayer: data.currentPlayer,
        moves: [...(prev?.moves || []), data.move],
        gameStatus: data.gameStatus,
        result: data.result
      }));

      setSelectedSquare(null);
      setPossibleMoves([]);
      setCaptureMoves([]);
      setIsMyTurn(data.currentPlayer === playerColor && !isSpectator);
      setIsInCheck(data.isCheck && data.currentPlayer === playerColor);
      
      // Track last move for highlighting
      if (data.move) {
        setLastMove(data.move);
      }

      // Store move time if we calculated it
      if (data.move && lastMoveTime) {
        data.move.moveTime = lastMoveTime;
        setLastMoveTime(null); // Reset for next move
      }

      if (data.gameStatus === 'finished') {
        setGameStatus('finished');
      }
    };

    const handlePromotionRequired = (data) => {
      console.log('Promotion required:', data);
      setPromotionData(data);
    };

    const handleChatMessage = (message) => {
      setMessages(prev => [...prev, message]);
    };

    const handlePlayerJoined = (data) => {
      console.log('Player joined:', data);
      // Refresh game state when a player joins
      loadGameState();
    };

    const handlePlayerDisconnected = (data) => {
      console.log('Player disconnected:', data);

      // Add a system message about disconnection
      setMessages(prev => [...prev, {
        username: 'System',
        message: `${data.username} disconnected`,
        isSystem: true,
        timestamp: new Date()
      }]);
    };

    const handlePlayerLeft = (data) => {
      console.log('Player left:', data);

      // Update game state if game ended
      if (data.gameStatus === 'finished') {
        setGameState(prev => ({
          ...prev,
          gameStatus: 'finished',
          result: data.result
        }));
        setGameStatus('finished');
      }

      // Add a system message about player leaving
      setMessages(prev => [...prev, {
        username: 'System',
        message: `${data.username} left the game`,
        isSystem: true,
        timestamp: new Date()
      }]);
    };

    const handleGameStarted = () => {
      setGameStatus('active');
    };

    const handleGameEnded = (data) => {
      setGameStatus('finished');
      setGameState(prev => ({
        ...prev,
        gameStatus: 'finished',
        result: data.result
      }));
    };

    const handleError = (error) => {
      console.error('Socket error:', error);
      
      // Only show alerts for certain types of errors, and only when it's the user's turn
      const currentIsMyTurn = gameState?.currentPlayer === playerColor && !isSpectator;
      const shouldShowAlert = currentIsMyTurn && (
        error.message?.includes('Invalid move') ||
        error.message?.includes('Not your turn') ||
        error.message?.includes('Game not found') ||
        error.message?.includes('Game is not active') ||
        error.message?.includes('You are not a player') ||
        error.message?.includes('Authentication') ||
        error.message?.includes('Failed to')
      );
      
      // For "Move would put your king in check" only show if it's actually the user's turn
      const isCheckError = error.message?.includes('Move would put your king in check');
      
      if (shouldShowAlert || (isCheckError && currentIsMyTurn)) {
        alert(error.message || 'An error occurred');
      } else if (isCheckError && !currentIsMyTurn) {
        // Log but don't show alert for check errors when it's not user's turn
        console.warn('Received check error during opponent turn (ignoring):', error.message);
      } else {
        // Show generic system errors that don't relate to moves
        if (!error.message?.includes('Move would put your king in check') && 
            !error.message?.includes('Invalid move') &&
            !error.message?.includes('Not your turn')) {
          alert(error.message || 'An error occurred');
        }
      }
    };

    // Register event listeners
    socketService.on('game_state', handleGameState);
    socketService.on('move_made', handleMoveMade);
    socketService.on('promotion_required', handlePromotionRequired);
    socketService.on('chat_message', handleChatMessage);
    socketService.on('player_joined', handlePlayerJoined);
    socketService.on('player_disconnected', handlePlayerDisconnected);
    socketService.on('player_left', handlePlayerLeft);
    socketService.on('game_started', handleGameStarted);
    socketService.on('game_ended', handleGameEnded);
    socketService.on('error', handleError);

    return () => {
      socketService.off('game_state', handleGameState);
      socketService.off('move_made', handleMoveMade);
      socketService.off('promotion_required', handlePromotionRequired);
      socketService.off('chat_message', handleChatMessage);
      socketService.off('player_joined', handlePlayerJoined);
      socketService.off('player_disconnected', handlePlayerDisconnected);
      socketService.off('player_left', handlePlayerLeft);
      socketService.off('game_started', handleGameStarted);
      socketService.off('game_ended', handleGameEnded);
      socketService.off('error', handleError);
    };
  }, [playerColor, isSpectator, roomId, loadGameState, gameState, gameStatus, lastMoveTime]);

  // Join the game room - removed as it's now handled in connection effect
  // useEffect(() => {
  //   if (socketService.isSocketConnected() && roomId) {
  //     socketService.joinRoom(roomId, isSpectator);
  //   }
  // }, [roomId, isSpectator]);

  useEffect(() => {
    loadGameState();
  }, [loadGameState]);

  // Removed auto-ready logic - users must manually click Ready
  // useEffect(() => {
  //   // Emit 'player_ready' if player is not ready and not a spectator
  //   console.log('Auto-ready useEffect triggered:', { 
  //     isSpectator, 
  //     roomId, 
  //     playerColor, 
  //     condition: !isSpectator && roomId && playerColor,
  //     socketConnected: socketService.socket?.connected 
  //   });
    
  //   if (!isSpectator && roomId && playerColor && socketService.socket?.connected) {
  //     console.log('Auto-emitting player_ready:', { roomId, playerColor, isSpectator });
  //     socketService.emit('player_ready', { roomId });
  //     setIsReady(true);
  //   } else if (!isSpectator && roomId && playerColor && !socketService.socket?.connected) {
  //     console.log('Socket not connected, delaying player_ready');
  //     // Retry after a short delay
  //     setTimeout(() => {
  //       if (socketService.socket?.connected) {
  //         console.log('Retrying auto-emit player_ready:', { roomId, playerColor });
  //         socketService.emit('player_ready', { roomId });
  //         setIsReady(true);
  //       }
  //     }, 1000);
  //   }
  // }, [isSpectator, roomId, playerColor]);

  // Timer effect
  useEffect(() => {
    if (gameStatus !== 'active' || !gameState) return;

    const interval = setInterval(() => {
      setTimeLeft(prev => {
        const newTime = { ...prev };
        if (gameState.currentPlayer === 'white') {
          newTime.white = Math.max(0, newTime.white - 1000);
        } else {
          newTime.black = Math.max(0, newTime.black - 1000);
        }
        return newTime;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [gameStatus, gameState]);

  // Track turn start time for move timing
  useEffect(() => {
    if (isMyTurn && gameStatus === 'active') {
      setMoveStartTime(Date.now());
    }
  }, [isMyTurn, gameStatus]);

  // Emergency fallback to set playerColor if it's undefined but we have gameState
  useEffect(() => {
    if (!playerColor && gameState && (isGuest && guestData)) {
      console.log('Emergency playerColor detection:', {
        guestId: guestData.id,
        username: guestData.username,
        whitePlayer: gameState.players?.white,
        blackPlayer: gameState.players?.black
      });

      // Try to match by guestId or username
      if (gameState.players?.white?.guestId === guestData.id || 
          gameState.players?.white?.username === guestData.username) {
        console.log('Emergency setting playerColor to white');
        setPlayerColor('white');
      } else if (gameState.players?.black?.guestId === guestData.id || 
                gameState.players?.black?.username === guestData.username) {
        console.log('Emergency setting playerColor to black');
        setPlayerColor('black');
      }
    }
  }, [playerColor, gameState, isGuest, guestData]);

  const handleSquareClick = useCallback((row, col) => {
    console.log('Square clicked:', {
      row, col, 
      isMyTurn, 
      gameStatus, 
      playerColor, 
      currentPlayer: gameState?.currentPlayer,
      piece: gameState?.board?.[row]?.[col]
    });
    
    if (!isMyTurn || gameStatus !== 'active') {
      console.log('Move blocked:', { isMyTurn, gameStatus });
      return;
    }

    const piece = gameState?.board?.[row]?.[col];

    // If no square is selected
    if (!selectedSquare) {
      if (piece && piece.color === playerColor) {
        setSelectedSquare({ row, col });
        // Calculate legal moves that don't leave king in check
        const movesWithTypes = getLegalMovesWithTypes(gameState.board, row, col, piece);
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
    if (piece && piece.color === playerColor) {
      setSelectedSquare({ row, col });
      const movesWithTypes = getLegalMovesWithTypes(gameState.board, row, col, piece);
      const regularMoves = movesWithTypes.filter(move => !move.isCapture).map(move => [move.row, move.col]);
      const captures = movesWithTypes.filter(move => move.isCapture).map(move => [move.row, move.col]);
      setPossibleMoves(regularMoves);
      setCaptureMoves(captures);
      return;
    }

    // Calculate move time
    const moveTime = moveStartTime ? Date.now() - moveStartTime : 0;
    setLastMoveTime(moveTime);

    // Try to make a move
    socketService.makeMove(roomId, { row: fromRow, col: fromCol }, { row, col }, moveStartTime);
  }, [isMyTurn, gameStatus, gameState, selectedSquare, playerColor, roomId, moveStartTime]);

  const handleLeaveGame = () => {
    // Leave the room through socket
    if (socketService.isSocketConnected() && roomId) {
      socketService.leaveRoom(roomId);
    }

    // Disconnect socket
    socketService.disconnect();

    // Call the parent handler
    onLeaveGame();
  };

  // Get current user's username
  const getCurrentUsername = useCallback(() => {
    if (isGuest && guestData) {
      return guestData.username;
    }
    
    if (gameState && playerColor && !isSpectator) {
      // Get the username of the current player based on their color
      return gameState.players?.[playerColor]?.username;
    }
    
    return null;
  }, [isGuest, guestData, gameState, playerColor, isSpectator]);

  const handlePlayerReady = () => {
    console.log('Manual player ready clicked:', { roomId, playerColor, isSpectator });
    socketService.playerReady(roomId);
    setIsReady(true);
  };

  const handleResign = () => {
    if (window.confirm('Are you sure you want to resign?')) {
      socketService.resign(roomId);
    }
  };

  const handleSendMessage = (message) => {
    socketService.sendMessage(roomId, message);
  };

  const handlePromotionSelect = (promotion) => {
    if (promotionData) {
      socketService.promotePawn(roomId, promotionData.from, promotionData.to, promotion);
      setPromotionData(null);
    }
  };

  const handlePromotionCancel = () => {
    setPromotionData(null);
  };

  // Helper function to check if the king at given position is in check
  const isKingInCheck = (row, col) => {
    if (!gameState?.board) return false;
    const piece = gameState.board[row][col];
    return piece && piece.type === 'king' && isInCheck && piece.color === playerColor;
  };

  const isSquareSelected = useCallback((row, col) => {
    return selectedSquare && selectedSquare.row === row && selectedSquare.col === col;
  }, [selectedSquare]);

  const isValidMoveSquare = useCallback((row, col) => {
    return possibleMoves.some(([moveRow, moveCol]) => moveRow === row && moveCol === col);
  }, [possibleMoves]);

  const isCaptureSquare = useCallback((row, col) => {
    return captureMoves.some(([moveRow, moveCol]) => moveRow === row && moveCol === col);
  }, [captureMoves]);

  const isLastMoveSquare = useCallback((row, col) => {
    if (!lastMove) return false;
    return (lastMove.from.row === row && lastMove.from.col === col) ||
           (lastMove.to.row === row && lastMove.to.col === col);
  }, [lastMove]);

  const formatTime = (milliseconds) => {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const getGameStatusMessage = () => {
    if (connectionStatus !== 'connected') {
      return 'Connecting...';
    }

    switch (gameStatus) {
      case 'waiting': {
        // Check if both player slots are filled (check all identification methods)
        const hasWhitePlayer = gameState?.players?.white?.userId || gameState?.players?.white?.guestId || gameState?.players?.white?.username;
        const hasBlackPlayer = gameState?.players?.black?.userId || gameState?.players?.black?.guestId || gameState?.players?.black?.username;
        
        if (!hasWhitePlayer && !hasBlackPlayer) {
          return 'Waiting for players to join...';
        } else if (!hasBlackPlayer) {
          return 'Waiting for second player to join...';
        } else if (!hasWhitePlayer) {
          return 'Waiting for second player to join...';
        } else {
          // Both players exist, check ready status
          const whiteReady = gameState?.players?.white?.isReady || false;
          const blackReady = gameState?.players?.black?.isReady || false;
          
          if (!whiteReady && !blackReady) {
            return 'Waiting for both players to be ready...';
          } else if (!whiteReady) {
            return 'Waiting for White player to be ready...';
          } else if (!blackReady) {
            return 'Waiting for Black player to be ready...';
          } else {
            return 'Starting game...';
          }
        }
      }
      case 'active':
        if (isSpectator) {
          return `${gameState?.currentPlayer === 'white' ? 'White' : 'Black'} to move`;
        }
        return isMyTurn ? 'Your turn' : 'Opponent\'s turn';
      case 'finished':
        if (gameState?.result?.winner === 'draw') {
          return 'Game ended in a draw';
        } else {
          const winner = gameState?.result?.winner;
          const winnerName = winner === 'white' ?
            gameState?.players?.white?.username :
            gameState?.players?.black?.username;
          return `${winnerName} wins!`;
        }
      default:
        return 'Game status unknown';
    }
  };

  if (!gameState) {
    return (
      <div className={`flex justify-center items-center min-h-screen ${theme.colors.bg.primary}`}>
        <div className="text-center">
          <div className={`animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4`}></div>
          <p className={theme.colors.text.secondary}>Loading game...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${theme.colors.bg.primary} transition-colors duration-300`}>
      {/* Theme Toggle - Fixed positioned for easy access */}
      <div className="fixed top-4 right-4 z-50">
        <ThemeToggle />
      </div>
      
      <div className="flex flex-col lg:flex-row items-center justify-center gap-4 lg:gap-6 py-4 px-5 lg:p-8 min-h-screen w-full mx-auto">
        {/* Game Header - Mobile */}
        <div className="lg:hidden w-full text-center mb-4">
          <h1 className={`text-2xl lg:text-3xl font-bold ${theme.colors.text.primary} mb-2 flex items-center justify-center`}>
            <svg className={`w-6 h-6 mr-2 ${theme.colors.text.accent}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                d="M17 14v6m-3-3h6M6 10h2a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v2a2 2 0 002 2zm10 0h2a2 2 0 002-2V6a2 2 0 00-2-2h-2a2 2 0 00-2 2v2a2 2 0 002 2zM6 20h2a2 2 0 002-2v-2a2 2 0 00-2-2H6a2 2 0 00-2 2v2a2 2 0 002 2z" />
            </svg>
            Room: {roomId}
          </h1>
          <div className={`text-lg font-semibold ${theme.colors.text.secondary} mb-2`}>
            {getGameStatusMessage()}
          </div>
          {isSpectator && (
            <div className={`text-sm font-medium ${theme.colors.text.accent} bg-blue-50 dark:bg-blue-900/30 px-3 py-1 rounded-full inline-block`}>
              <svg className="w-4 h-4 mr-1 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                  d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              Spectating
            </div>
          )}
        </div>

        {/* Left Panel - Game Info and Controls */}
        <div className="order-2 lg:order-1 w-full lg:w-80 flex-shrink-0">
          {/* Captured Pieces Display */}
          {(bothPlayersReady || gameStatus === 'active' || gameStatus === 'finished') && (
            <div className="mb-4">
              <CapturedPieces capturedPieces={capturedPieces} />
            </div>
          )}

          <div className={`${theme.colors.card.background} rounded-lg shadow-lg ${theme.colors.card.shadow} p-4 lg:p-6 mb-4 transition-colors duration-300`}>
            <div className="text-center mb-4">
              <h3 className={`text-lg lg:text-xl font-semibold ${theme.colors.text.primary} flex items-center justify-center`}>
                <svg className={`w-6 h-6 mr-2 ${theme.colors.text.accent}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                    d="M17 14v6m-3-3h6M6 10h2a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v2a2 2 0 002 2zm10 0h2a2 2 0 002-2V6a2 2 0 00-2-2h-2a2 2 0 00-2 2v2a2 2 0 002 2zM6 20h2a2 2 0 002-2v-2a2 2 0 00-2-2H6a2 2 0 00-2 2v2a2 2 0 002 2z" />
                </svg>
                Room {roomId}
                {connectionStatus !== 'connected' && (
                  <div className="ml-2 flex items-center text-yellow-600">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-yellow-600 mr-1"></div>
                    Connecting...
                  </div>
                )}
              </h3>
              {isSpectator && (
                <div className={`text-sm font-medium mt-1 ${theme.colors.text.accent} bg-blue-50 dark:bg-blue-900/30 px-3 py-1 rounded-full inline-block`}>
                  <svg className="w-4 h-4 mr-1 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  Spectating Mode
                </div>
              )}
              {!isSpectator && playerColor && (
                <div className={`text-sm font-medium mt-1 px-3 py-1 rounded-full inline-block transition-colors duration-300 ${playerColor === 'white'
                  ? `${theme.colors.text.primary} ${theme.colors.bg.tertiary} border ${theme.colors.border.secondary}`
                  : 'text-white bg-gray-800 border border-gray-600'
                  }`}>
                  Playing as {playerColor === 'white' ? (
                    <>
                      White
                    </>
                  ) : (
                    <>
                      Black
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Players */}
            <div className="space-y-3 mb-6">
              <div className={`flex items-center justify-between p-3 rounded-lg transition-all duration-200 ${
                gameState.currentPlayer === 'white' 
                  ? `${theme.colors.text.accent} bg-blue-50 dark:bg-blue-900/30 border-2 border-blue-200 dark:border-blue-700 shadow-md` 
                  : theme.colors.bg.tertiary
              }`}>
                <div className="flex items-center gap-2">
                  <div className={`w-4 h-4 bg-white border-2 border-gray-400 rounded ${
                    gameState.currentPlayer === 'white' ? 'animate-pulse shadow-lg' : ''
                  }`}></div>
                  <span className={`font-medium ${
                    gameState.currentPlayer === 'white' ? theme.colors.text.accent : theme.colors.text.primary
                  }`}>
                    {gameState.players?.white?.username || 'Waiting for player...'}
                  </span>
                </div>
                <div className={`font-mono ${
                  timeLeft.white < 30000 ? 'text-red-600 animate-pulse' : theme.colors.text.secondary
                }`}>
                  {formatTime(timeLeft.white)}
                </div>
              </div>

              <div className={`flex items-center justify-between p-3 rounded-lg transition-all duration-200 ${
                gameState.currentPlayer === 'black' 
                  ? `${theme.colors.text.accent} bg-blue-50 dark:bg-blue-900/30 border-2 border-blue-200 dark:border-blue-700 shadow-md` 
                  : theme.colors.bg.tertiary
              }`}>
                <div className="flex items-center gap-2">
                  <div className={`w-4 h-4 bg-gray-800 rounded ${
                    gameState.currentPlayer === 'black' ? 'animate-pulse shadow-lg' : ''
                  }`}></div>
                  <span className={`font-medium ${
                    gameState.currentPlayer === 'black' ? theme.colors.text.accent : theme.colors.text.primary
                  }`}>
                    {gameState.players?.black?.username || 'Waiting for player...'}
                  </span>
                </div>
                <div className={`font-mono ${
                  timeLeft.black < 30000 ? 'text-red-600 animate-pulse' : theme.colors.text.secondary
                }`}>
                  {formatTime(timeLeft.black)}
                </div>
              </div>
            </div>

            {/* Game Controls */}
            <div className="space-y-2">
              {gameStatus === 'waiting' && !isSpectator && !isReady && (
                <button
                  onClick={handlePlayerReady}
                  className={`w-full ${theme.colors.button.success} text-white py-2 rounded-md transition-colors duration-200`}
                >
                  Ready to Play
                </button>
              )}

              {gameStatus === 'waiting' && isReady && (
                <div className={`text-center text-green-600 font-medium flex items-center justify-center`}>
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                      d="M5 13l4 4L19 7" />
                  </svg>
                  Ready - Waiting for opponent
                </div>
              )}

              {gameStatus === 'active' && !isSpectator && (
                <button
                  onClick={handleResign}
                  className={`w-full ${theme.colors.button.danger} text-white py-2 rounded-md transition-colors duration-200`}
                >
                  Resign
                </button>
              )}

              <button
                onClick={handleLeaveGame}
                className={`w-full ${theme.colors.button.secondary} text-white py-2 rounded-md transition-colors duration-200`}
              >
                Leave Game
              </button>
            </div>
          </div>
        </div>

        {/* Center Panel - Main Game Area */}
        <div className="order-1 lg:order-2 flex-1 flex flex-col justify-center items-center min-w-0 max-w-2xl">
          {/* Game Header - Desktop */}
          <div className="hidden lg:block text-center mb-3">
            <h1 className={`text-3xl lg:text-4xl font-bold ${theme.colors.text.primary} mb-2 flex items-center justify-center`}>
              <svg className={`w-8 h-8 mr-3 ${theme.colors.text.accent}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                  d="M17 14v6m-3-3h6M6 10h2a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v2a2 2 0 002 2zm10 0h2a2 2 0 002-2V6a2 2 0 00-2-2h-2a2 2 0 00-2 2v2a2 2 0 002 2zM6 20h2a2 2 0 002-2v-2a2 2 0 00-2-2H6a2 2 0 00-2 2v2a2 2 0 002 2z" />
              </svg>
              Multiplayer Chess
            </h1>
            <div className={`text-lg ${theme.colors.text.accent} font-medium mb-2`}>
              Room: {roomId}
            </div>
            <div className={`text-xl font-semibold ${theme.colors.text.secondary}`}>
              {getGameStatusMessage()}
            </div>
          </div>

          {/* Waiting for players message */}
          {!bothPlayersReady && gameStatus === 'waiting' && (
            <div className="text-center py-8 lg:py-16">
              <svg className={`w-16 lg:w-24 h-16 lg:h-24 mx-auto mb-4 ${theme.colors.text.muted}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} 
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h2 className={`text-xl lg:text-2xl font-bold ${theme.colors.text.primary} mb-2`}>Waiting for Players</h2>
              <p className={`${theme.colors.text.secondary} mb-4`}>
                {(() => {
                  const hasWhitePlayer = gameState?.players?.white?.userId || gameState?.players?.white?.guestId || gameState?.players?.white?.username;
                  const hasBlackPlayer = gameState?.players?.black?.userId || gameState?.players?.black?.guestId || gameState?.players?.black?.username;
                  const whiteReady = gameState?.players?.white?.isReady || false;
                  const blackReady = gameState?.players?.black?.isReady || false;
                  
                  if (!hasWhitePlayer && !hasBlackPlayer) {
                    return 'Waiting for players to join this room...';
                  } else if (!hasBlackPlayer) {
                    return 'Waiting for a second player to join...';
                  } else if (!hasWhitePlayer) {
                    return 'Waiting for a second player to join...';
                  } else if (!whiteReady && !blackReady) {
                    return 'Both players need to click "Ready to Play"';
                  } else if (!blackReady) {
                    return 'Waiting for Black player to be ready';
                  } else if (!whiteReady) {
                    return 'Waiting for White player to be ready';
                  } else {
                    return 'Starting game...';
                  }
                })()}
              </p>
            </div>
          )}

          {/* Chess Board - Only show when both players are ready or game is active */}
          {(bothPlayersReady || gameStatus === 'active' || gameStatus === 'finished') && (
            <div className="relative w-full mb-5 max-w-md lg:max-w-lg xl:max-w-xl mx-auto">
              {/* Board Labels */}
              <div className={`absolute -left-3 sm:-left-5 lg:-left-5 top-0 h-full flex flex-col justify-around ${theme.colors.text.secondary} font-semibold text-sm lg:text-base`}>
                {(playerColor === 'black' ? [1, 2, 3, 4, 5, 6, 7, 8] : [8, 7, 6, 5, 4, 3, 2, 1]).map(num => (
                  <div key={num} className="h-10 sm:h-12 md:h-14 lg:h-16 flex items-center">
                    {num}
                  </div>
                ))}
              </div>

              <div className={`absolute -bottom-6 lg:-bottom-6 -left-1 w-full flex gap-0.5 ${theme.colors.text.secondary} font-semibold text-sm lg:text-base`}>
                {(playerColor === 'black' ? ['h', 'g', 'f', 'e', 'd', 'c', 'b', 'a'] : ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h']).map(letter => (
                  <div key={letter} className="w-14 sm:w-12 md:w-14 lg:w-16 text-center ">
                    {letter}
                  </div>
                ))}
              </div>

              {/* Main Board */}
              <div className={`border-2 md:border-10 border-gray-800 bg-gray-800 rounded-lg shadow-2xl transition-colors duration-300 overflow-hidden inline-block`}>
                <div className="grid grid-cols-8 gap-0 leading-none" style={{ lineHeight: 0 }}>
                  {Array.from({ length: 8 }, (_, rowIndex) =>
                    Array.from({ length: 8 }, (_, colIndex) => {
                      // Calculate the actual board coordinates based on player color
                      const actualRow = playerColor === 'black' ? 7 - rowIndex : rowIndex;
                      const actualCol = playerColor === 'black' ? 7 - colIndex : colIndex;
                      const actualPiece = gameState.board?.[actualRow]?.[actualCol];

                      // Calculate square color (alternating pattern)
                      const isLight = (actualRow + actualCol) % 2 === 0;

                      return (
                        <Square
                          key={`${rowIndex}-${colIndex}`}
                          piece={actualPiece}
                          isLight={isLight}
                          isSelected={isSquareSelected(actualRow, actualCol)}
                          isValidMove={isValidMoveSquare(actualRow, actualCol)}
                          isCapture={isCaptureSquare(actualRow, actualCol)}
                          isInCheck={isKingInCheck(actualRow, actualCol)}
                          isLastMove={isLastMoveSquare(actualRow, actualCol)}
                          onClick={() => handleSquareClick(actualRow, actualCol)}
                          row={rowIndex}
                          col={colIndex}
                        />
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Panel - Move History and Chat Box */}
        <div className="order-3 lg:order-3 w-full my-auto lg:w-80 flex-shrink-0">
          {/* Move History - Shows above chat */}
          <MoveHistory 
            moves={gameState?.moves || []}
            currentPlayer={gameState?.currentPlayer}
          />
          
          {/* Chat Box - Always visible on desktop, below board on mobile */}
          <div className="lg:block">
            <ChatBox
              messages={messages}
              onSendMessage={handleSendMessage}
              disabled={gameStatus === 'finished'}
              currentUsername={getCurrentUsername()}
            />
          </div>
        </div>

        {/* Promotion Modal */}
        <PromotionModal
          isOpen={promotionData !== null}
          playerColor={playerColor}
          onSelect={handlePromotionSelect}
          onCancel={handlePromotionCancel}
        />
      </div>
    </div>
  );
};

export default MultiplayerChessBoard;
