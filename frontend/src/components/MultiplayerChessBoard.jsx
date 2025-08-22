import React, { useState, useEffect, useCallback } from 'react';
import Square from './Square';
import GameInfo from './GameInfo';
import ChatBox from './ChatBox';
import PromotionModal from './PromotionModal';
import CapturedPieces from './CapturedPieces';
import socketService from '../services/socket';
import { gamesApi } from '../services/api';
import { getLegalMovesWithTypes } from '../utils/chess';

const MultiplayerChessBoard = ({ roomId, playerColor, isGuest, guestData, onLeaveGame }) => {
  const [gameState, setGameState] = useState(null);
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
        socketService.joinRoom(roomId, isSpectator);
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
  const loadGameState = useCallback(async () => {
    try {
      const response = await gamesApi.getGame(roomId, isGuest ? guestData.id : null);
      const gameData = response.data.game;
      setGameState(gameData);
      setIsSpectator(!response.data.playerColor);

      // Check if both players are ready
      const whiteReady = gameData.players?.white?.isReady || false;
      const blackReady = gameData.players?.black?.isReady || false;
      setBothPlayersReady(whiteReady && blackReady);

    } catch (error) {
      console.error('Failed to load game state:', error);
    }
  }, [roomId, isGuest, guestData]);

  // Set up socket event listeners
  useEffect(() => {
    const handleGameState = (data) => {
      setGameState(data.game);
      setIsSpectator(data.isSpectator || false);
      setGameStatus(data.game.gameStatus);

      if (data.game.timeControl) {
        setTimeLeft({
          white: data.game.timeControl.whiteTime,
          black: data.game.timeControl.blackTime
        });
      }

      setIsMyTurn(data.game.currentPlayer === playerColor && !data.isSpectator);
      setConnectionStatus('connected');
    };

    const handleMoveMade = (data) => {
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
      console.log('Game started!');
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
      alert(error.message || 'An error occurred');
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
  }, [playerColor, isSpectator, roomId, loadGameState]);

  // Join the game room - removed as it's now handled in connection effect
  // useEffect(() => {
  //   if (socketService.isSocketConnected() && roomId) {
  //     socketService.joinRoom(roomId, isSpectator);
  //   }
  // }, [roomId, isSpectator]);

  useEffect(() => {
    loadGameState();
  }, [loadGameState]);

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

  const handleSquareClick = useCallback((row, col) => {
    if (!isMyTurn || gameStatus !== 'active') return;

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

    // Try to make a move
    socketService.makeMove(roomId, { row: fromRow, col: fromCol }, { row, col });
  }, [isMyTurn, gameStatus, gameState, selectedSquare, playerColor, roomId]);

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
      case 'waiting':
        return 'Waiting for opponent...';
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
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading game...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row items-start justify-center gap-8 p-8 bg-gradient-to-br from-gray-100 to-gray-200 min-h-screen">
      {/* Game Header - Mobile */}
      <div className="lg:hidden w-full text-center mb-4">
        <h1 className="text-3xl font-bold text-gray-800 mb-2 flex items-center justify-center">
          <svg className="w-6 h-6 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
              d="M17 14v6m-3-3h6M6 10h2a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v2a2 2 0 002 2zm10 0h2a2 2 0 002-2V6a2 2 0 00-2-2h-2a2 2 0 00-2 2v2a2 2 0 002 2zM6 20h2a2 2 0 002-2v-2a2 2 0 00-2-2H6a2 2 0 00-2 2v2a2 2 0 002 2z" />
          </svg>
          Room: {roomId}
        </h1>
        <div className="text-lg font-semibold text-gray-700 mb-2">
          {getGameStatusMessage()}
        </div>
        {isSpectator && (
          <div className="text-sm text-blue-600 font-medium bg-blue-50 px-3 py-1 rounded-full inline-block">
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

      {/* Game Info Panel */}
      <div className="order-2 lg:order-1 w-full lg:w-100">
        {/* Captured Pieces Display */}
        {(bothPlayersReady || gameStatus === 'active' || gameStatus === 'finished') && (<div className="mb-4">
          <CapturedPieces capturedPieces={capturedPieces} />
        </div>)}

        <div className="bg-white rounded-lg shadow-lg p-6 mb-4">
          <div className="text-center mb-4">
            <h3 className="text-xl font-semibold text-gray-800 flex items-center justify-center">
              <svg className="w-6 h-6 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
              <div className="text-sm text-blue-600 font-medium mt-1 bg-blue-50 px-3 py-1 rounded-full inline-block">
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
              <div className={`text-sm font-medium mt-1 px-3 py-1 rounded-full inline-block ${playerColor === 'white'
                ? 'text-gray-800 bg-gray-100 border border-gray-300'
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
            <div className={`flex items-center justify-between p-3 rounded-lg transition-all duration-200 ${gameState.currentPlayer === 'white' ? 'bg-blue-50 border-2 border-blue-200 shadow-md' : 'bg-gray-50'
              }`}>
              <div className="flex items-center gap-2">
                <div className={`w-4 h-4 bg-white border-2 border-gray-400 rounded ${gameState.currentPlayer === 'white' ? 'animate-pulse shadow-lg' : ''
                  }`}></div>
                <span className={`font-medium ${gameState.currentPlayer === 'white' ? 'text-blue-700' : 'text-gray-700'}`}>
                  {gameState.players?.white?.username || 'Waiting for player...'}
                </span>
              </div>
              <div className={`font-mono ${timeLeft.white < 30000 ? 'text-red-600 animate-pulse' : 'text-gray-600'}`}>
                {formatTime(timeLeft.white)}
              </div>
            </div>

            <div className={`flex items-center justify-between p-3 rounded-lg transition-all duration-200 ${gameState.currentPlayer === 'black' ? 'bg-blue-50 border-2 border-blue-200 shadow-md' : 'bg-gray-50'
              }`}>
              <div className="flex items-center gap-2">
                <div className={`w-4 h-4 bg-gray-800 rounded ${gameState.currentPlayer === 'black' ? 'animate-pulse shadow-lg' : ''
                  }`}></div>
                <span className={`font-medium ${gameState.currentPlayer === 'black' ? 'text-blue-700' : 'text-gray-700'}`}>
                  {gameState.players?.black?.username || 'Waiting for player...'}
                </span>
              </div>
              <div className={`font-mono ${timeLeft.black < 30000 ? 'text-red-600 animate-pulse' : 'text-gray-600'}`}>
                {formatTime(timeLeft.black)}
              </div>
            </div>
          </div>

          {/* Game Controls */}
          <div className="space-y-2">
            {gameStatus === 'waiting' && !isSpectator && !isReady && (
              <button
                onClick={handlePlayerReady}
                className="w-full bg-green-600 text-white py-2 rounded-md hover:bg-green-700 transition-colors duration-200"
              >
                Ready to Play
              </button>
            )}

            {gameStatus === 'waiting' && isReady && (
              <div className="text-center text-green-600 font-medium flex items-center justify-center">
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
                className="w-full bg-red-600 text-white py-2 rounded-md hover:bg-red-700 transition-colors duration-200"
              >
                Resign
              </button>
            )}

            <button
              onClick={handleLeaveGame}
              className="w-full bg-gray-600 text-white py-2 rounded-md hover:bg-gray-700 transition-colors duration-200"
            >
              Leave Game
            </button>
          </div>
        </div>


        {/* Chat Box */}
        <ChatBox
          messages={messages}
          onSendMessage={handleSendMessage}
          disabled={gameStatus === 'finished'}
          currentUsername={getCurrentUsername()}
        />
      </div>

      {/* Main Game Area */}
      <div className="order-1 lg:order-2 pb-10 lg:pb-0 flex flex-col justify-center m-auto lg:m-10 lg:mx-auto items-center lg:justify-start">
        {/* Game Header - Desktop */}
        <div className="hidden lg:block text-center mb-6">
          <h1 className="text-4xl font-bold text-gray-800 mb-2 flex items-center justify-center">
            <svg className="w-8 h-8 mr-3 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                d="M17 14v6m-3-3h6M6 10h2a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v2a2 2 0 002 2zm10 0h2a2 2 0 002-2V6a2 2 0 00-2-2h-2a2 2 0 00-2 2v2a2 2 0 002 2zM6 20h2a2 2 0 002-2v-2a2 2 0 00-2-2H6a2 2 0 00-2 2v2a2 2 0 002 2z" />
            </svg>
            Multiplayer Chess
          </h1>
          <div className="text-lg text-blue-600 font-medium mb-2">
            Room: {roomId}
          </div>
          <div className="text-xl font-semibold text-gray-700">
            {getGameStatusMessage()}
          </div>
        </div>

        {/* Waiting for players message */}
        {!bothPlayersReady && gameStatus === 'waiting' && (
          <div className="text-center py-16">
            <svg className="w-24 h-24 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} 
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h2 className="text-2xl font-bold text-gray-700 mb-2">Waiting for Players</h2>
            <p className="text-gray-600 mb-4">
              {!gameState?.players?.white?.isReady && !gameState?.players?.black?.isReady
                ? 'Both players need to click "Ready to Play"'
                : gameState?.players?.white?.isReady && !gameState?.players?.black?.isReady
                  ? 'Waiting for Black player to be ready'
                  : 'Waiting for White player to be ready'
              }
            </p>
          </div>
        )}

        {/* Chess Board - Only show when both players are ready or game is active */}
        {(bothPlayersReady || gameStatus === 'active' || gameStatus === 'finished') && (
          <div className="relative">
            {/* Board Labels */}
            <div className="absolute -left-8 top-0 h-full flex flex-col justify-around text-gray-600 font-semibold">
              {(playerColor === 'black' ? [1, 2, 3, 4, 5, 6, 7, 8] : [8, 7, 6, 5, 4, 3, 2, 1]).map(num => (
                <div key={num} className="h-16 flex items-center">
                  {num}
                </div>
              ))}
            </div>

            <div className="absolute -bottom-8 left-0 w-full flex justify-around text-gray-600 font-semibold">
              {(playerColor === 'black' ? ['h', 'g', 'f', 'e', 'd', 'c', 'b', 'a'] : ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h']).map(letter => (
                <div key={letter} className="w-16 text-center">
                  {letter}
                </div>
              ))}
            </div>

            {/* Main Board */}
            <div className="border-3 md:border-4  border-gray-800 bg-gray-800 p-3 rounded-lg shadow-2xl">
              <div className="grid grid-cols-8 gap-0 bg-white p-1">
                {(gameState.board || []).map((row, rowIndex) =>
                  row.map((piece, colIndex) => {
                    const actualRow = playerColor === 'black' ? 7 - rowIndex : rowIndex;
                    const actualCol = playerColor === 'black' ? 7 - colIndex : colIndex;
                    const actualPiece = gameState.board[actualRow][actualCol];

                    const isLight = (rowIndex + colIndex) % 2 === 0;

                    return (
                      <Square
                        key={`${rowIndex}-${colIndex}`}
                        piece={actualPiece}
                        isLight={isLight}
                        isSelected={isSquareSelected(actualRow, actualCol)}
                        isValidMove={isValidMoveSquare(actualRow, actualCol)}
                        isCapture={isCaptureSquare(actualRow, actualCol)}
                        isInCheck={isKingInCheck(actualRow, actualCol)}
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

      {/* Promotion Modal */}
      <PromotionModal
        isOpen={promotionData !== null}
        playerColor={playerColor}
        onSelect={handlePromotionSelect}
        onCancel={handlePromotionCancel}
      />
    </div>
  );
};

export default MultiplayerChessBoard;
