import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../hooks/useTheme';
import { gamesApi } from '../services/api';

const GameLobby = ({ onJoinGame, onCreateGame, onPlayPractice, isGuest, guestData }) => {
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedTimeControl, setSelectedTimeControl] = useState('10+0');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showPrivateForm, setShowPrivateForm] = useState(false);
  const [joinRoomId, setJoinRoomId] = useState('');
  const [privateRoomPassword, setPrivateRoomPassword] = useState('');

  const { user } = useAuth();
  const { colors } = useTheme();

  useEffect(() => {
    loadGames();
    const interval = setInterval(loadGames, 5000);
    return () => clearInterval(interval);
  }, []);

  const loadGames = async () => {
    try {
      const response = await gamesApi.getLobby();
      setGames(response.data.games);
      setError(null);
    } catch (err) {
      setError('Failed to load games');
      console.error('Load games error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateGame = async (gameSettings) => {
    try {
      const timeControls = {
        '1+0': { initialTime: 60000, increment: 0 },
        '3+0': { initialTime: 180000, increment: 0 },
        '5+0': { initialTime: 300000, increment: 0 },
        '10+0': { initialTime: 600000, increment: 0 },
        '15+10': { initialTime: 900000, increment: 10000 },
        '30+0': { initialTime: 1800000, increment: 0 },
      };

      const gameData = {
        timeControl: timeControls[selectedTimeControl],
        settings: {
          isPrivate: gameSettings.isPrivate,
          password: gameSettings.password,
          allowSpectators: gameSettings.allowSpectators || true,
        }
      };

      // Add guest data if playing as guest
      if (isGuest && guestData) {
        gameData.isGuest = true;
        gameData.guestUsername = guestData.username;
        console.log('Creating game as guest:', guestData);
      } else {
        console.log('Creating game as authenticated user');
      }

      console.log('Game data being sent:', gameData);
      const response = await gamesApi.createGame(gameData);
      console.log('Create game response:', response.data);
      onCreateGame(response.data.roomId);
    } catch (err) {
      setError('Failed to create game');
      console.error('Create game error:', err.response?.data || err.message);
    }
  };

  const handleCreatePrivateGame = async () => {
    try {
      const timeControls = {
        '1+0': { initialTime: 60000, increment: 0 },
        '3+0': { initialTime: 180000, increment: 0 },
        '5+0': { initialTime: 300000, increment: 0 },
        '10+0': { initialTime: 600000, increment: 0 },
        '15+10': { initialTime: 900000, increment: 10000 },
        '30+0': { initialTime: 1800000, increment: 0 },
      };

      const gameData = {
        timeControl: timeControls[selectedTimeControl],
        settings: {
          isPrivate: true,
          password: privateRoomPassword || null,
          allowSpectators: true,
        }
      };

      // Add guest data if playing as guest
      if (isGuest && guestData) {
        gameData.isGuest = true;
        gameData.guestUsername = guestData.username;
        console.log('Creating private game as guest:', guestData);
      } else {
        console.log('Creating private game as authenticated user');
      }

      console.log('Private game data being sent:', gameData);
      const response = await gamesApi.createGame(gameData);
      console.log('Create private game response:', response.data);
      
      // Show the room ID to user and close form
      alert(`Private room created! Room ID: ${response.data.roomId}${privateRoomPassword ? `\nPassword: ${privateRoomPassword}` : ''}\n\nShare this room ID with your friend to join.`);
      
      setShowPrivateForm(false);
      setPrivateRoomPassword('');
      onCreateGame(response.data.roomId);
    } catch (err) {
      setError('Failed to create private room');
      console.error('Create private game error:', err.response?.data || err.message);
    }
  };

  const handleJoinGame = async (roomId, password = null) => {
    try {
      const joinData = {};
      
      // Add password if provided
      if (password) {
        joinData.password = password;
      }
      
      // Add guest data if playing as guest
      if (isGuest && guestData) {
        joinData.isGuest = true;
        joinData.guestUsername = guestData.username;
        console.log('Joining game as guest:', guestData);
      } else {
        console.log('Joining game as authenticated user');
      }

      console.log('Join data being sent:', joinData);
      const response = await gamesApi.joinGame(roomId, joinData);
      console.log('Join game response:', response.data);
      onJoinGame(roomId, response.data.playerColor);
    } catch (err) {
      // If error is due to incorrect password, prompt for password
      if (err.response?.status === 401 && err.response?.data?.error === 'Incorrect room password') {
        const password = prompt('This room requires a password:');
        if (password) {
          return handleJoinGame(roomId, password);
        }
      } else {
        setError('Failed to join game');
        console.error('Join game error:', err.response?.data || err.message);
      }
    }
  };

  const handleJoinRandom = async () => {
    const currentUsername = isGuest ? guestData.username : user?.username;
    const availableGames = games.filter(game => {
      if (game.status !== 'waiting') return false;
      if (game.settings?.isPrivate) return false; // Skip private rooms for random join
      if (game.settings?.hasPassword) return false;
      if (game.players.white && game.players.white.username === currentUsername) return false;
      return true;
    });

    if (availableGames.length > 0) {
      const randomGame = availableGames[Math.floor(Math.random() * availableGames.length)];
      await handleJoinGame(randomGame.roomId);
    } else {
      await handleCreateGame({
        isPrivate: false,
        password: '',
        allowSpectators: true,
        autoStart: true
      });
    }
  };

  // Helper function to check if current user is in the game
  const isCurrentUserInGame = (game) => {
    const currentUsername = isGuest ? guestData?.username : user?.username;
    if (!currentUsername) return false;
    
    return (
      (game.players?.white?.username === currentUsername) ||
      (game.players?.black?.username === currentUsername)
    );
  };

  // Helper function to get current user's color in the game
  const getCurrentUserColor = (game) => {
    const currentUsername = isGuest ? guestData?.username : user?.username;
    if (!currentUsername) return null;
    
    if (game.players?.white?.username === currentUsername) return 'white';
    if (game.players?.black?.username === currentUsername) return 'black';
    return null;
  };

  if (loading) {
    return (
      <div className={`flex justify-center items-center min-h-screen ${colors.bg.primary}`}>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${colors.bg.primary} transition-colors duration-300`}>
      <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
        {/* Header */}
        <div className="text-center mb-8 sm:mb-12">
          <h1 className={`text-3xl sm:text-4xl lg:text-5xl font-bold ${colors.text.primary} mb-4`}>
            🏆 Chess Lobby
          </h1>
          <p className={`${colors.text.secondary} text-base sm:text-lg lg:text-xl`}>
            Welcome {isGuest ? guestData.username : user?.username}! 
            {isGuest && ' (Playing as Guest)'}
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-100 dark:bg-red-900 border border-red-400 dark:border-red-600 text-red-700 dark:text-red-300 rounded-lg slide-in-right">
            <div className="flex items-center justify-between">
              <span>{error}</span>
              <button 
                onClick={() => setError(null)}
                className="ml-2 text-red-800 dark:text-red-200 hover:text-red-900 dark:hover:text-red-100 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 sm:gap-6 mb-8 sm:mb-12">
          <button
            onClick={handleJoinRandom}
            className={`
              ${colors.button.success} text-white py-4 px-6 rounded-xl 
              transition-all duration-200 font-semibold text-base sm:text-lg
              hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]
              focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-offset-2
              flex items-center justify-center gap-2
            `}
          >
            <span>⚡</span>
            <span className="hidden sm:inline">Play Random</span>
            <span className="sm:hidden">Random</span>
          </button>
          
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className={`
              ${colors.button.primary} text-white py-4 px-6 rounded-xl 
              transition-all duration-200 font-semibold text-base sm:text-lg
              hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]
              focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2
              flex items-center justify-center gap-2
            `}
          >
            <span>🏠</span>
            <span className="hidden sm:inline">Public Room</span>
            <span className="sm:hidden">Public</span>
          </button>

          <button
            onClick={() => setShowPrivateForm(!showPrivateForm)}
            className={`
              bg-orange-600 hover:bg-orange-700 text-white py-4 px-6 rounded-xl 
              transition-all duration-200 font-semibold text-base sm:text-lg
              hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]
              focus:outline-none focus:ring-2 focus:ring-orange-400 focus:ring-offset-2
              flex items-center justify-center gap-2
            `}
          >
            <span>🔒</span>
            <span className="hidden sm:inline">Private Room</span>
            <span className="sm:hidden">Private</span>
          </button>

          <button
            onClick={onPlayPractice}
            className={`
              bg-purple-600 hover:bg-purple-700 text-white py-4 px-6 rounded-xl 
              transition-all duration-200 font-semibold text-base sm:text-lg
              hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]
              focus:outline-none focus:ring-2 focus:ring-purple-400 focus:ring-offset-2
              flex items-center justify-center gap-2
            `}
          >
            <span>🎯</span>
            <span className="hidden sm:inline">Practice Mode</span>
            <span className="sm:hidden">Practice</span>
          </button>

          <div className="relative">
            <input
              type="text"
              value={joinRoomId}
              onChange={(e) => setJoinRoomId(e.target.value.toUpperCase())}
              placeholder="Room ID"
              maxLength={8}
              className={`
                w-full px-4 py-3 pr-16 rounded-xl border transition-all duration-200
                ${colors.card.background} ${colors.border.primary} ${colors.text.primary}
                focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                placeholder-gray-400 dark:placeholder-gray-500
                text-sm sm:text-base font-mono
              `}
            />
            <button
              onClick={() => {
                if (joinRoomId) {
                  handleJoinGame(joinRoomId);
                }
              }}
              disabled={!joinRoomId.trim()}
              className={`
                absolute right-2 top-1/2 transform -translate-y-1/2
                px-3 py-2 rounded-lg transition-all duration-200
                ${colors.button.primary} text-white text-sm font-medium
                disabled:opacity-50 disabled:cursor-not-allowed
                hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-400
              `}
            >
              Join
            </button>
          </div>
        </div>

        {/* Create Game Form */}
        {showCreateForm && (
          <div className={`${colors.card.background} rounded-2xl shadow-xl p-6 sm:p-8 mb-8 sm:mb-12 border ${colors.card.border} fade-in`}>
            <h3 className={`text-xl sm:text-2xl font-bold ${colors.text.primary} mb-6`}>🎮 Create New Game</h3>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <label className={`block text-sm font-semibold ${colors.text.primary} mb-2`}>
                  ⏱️ Time Control
                </label>
                <select
                  value={selectedTimeControl}
                  onChange={(e) => setSelectedTimeControl(e.target.value)}
                  className={`
                    w-full px-4 py-3 rounded-lg border transition-all duration-200
                    ${colors.card.background} ${colors.border.primary} ${colors.text.primary}
                    focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                  `}
                >
                  <option value="1+0">1 minute</option>
                  <option value="3+0">3 minutes</option>
                  <option value="5+0">5 minutes</option>
                  <option value="10+0">10 minutes</option>
                  <option value="15+10">15+10</option>
                  <option value="30+0">30 minutes</option>
                </select>
              </div>

              <div className="flex gap-4">
                <button
                  onClick={() => {
                    handleCreateGame({ isPrivate: false, password: '' });
                    setShowCreateForm(false);
                  }}
                  className={`
                    flex-1 py-3 px-6 rounded-lg font-semibold text-white
                    transition-all duration-200 transform
                    ${colors.button.success}
                    hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]
                    focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2
                  `}
                >
                  🌍 Public Game
                </button>
                <button
                  onClick={() => setShowCreateForm(false)}
                  className={`
                    px-6 py-3 rounded-lg font-semibold
                    transition-all duration-200 transform
                    ${colors.button.ghost} ${colors.text.primary}
                    hover:shadow-md active:scale-[0.98]
                    focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2
                  `}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Create Private Game Form */}
        {showPrivateForm && (
          <div className={`${colors.card.background} rounded-2xl shadow-xl p-6 sm:p-8 mb-8 sm:mb-12 border ${colors.card.border} fade-in`}>
            <h3 className={`text-xl sm:text-2xl font-bold ${colors.text.primary} mb-6`}>🔒 Create Private Room</h3>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <label className={`block text-sm font-semibold ${colors.text.primary} mb-2`}>
                  ⏱️ Time Control
                </label>
                <select
                  value={selectedTimeControl}
                  onChange={(e) => setSelectedTimeControl(e.target.value)}
                  className={`
                    w-full px-4 py-3 rounded-lg border transition-all duration-200
                    ${colors.card.background} ${colors.border.primary} ${colors.text.primary}
                    focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                  `}
                >
                  <option value="1+0">1 minute</option>
                  <option value="3+0">3 minutes</option>
                  <option value="5+0">5 minutes</option>
                  <option value="10+0">10 minutes</option>
                  <option value="15+10">15+10</option>
                  <option value="30+0">30 minutes</option>
                </select>
              </div>

              <div>
                <label className={`block text-sm font-semibold ${colors.text.primary} mb-2`}>
                  🔐 Room Password (Optional)
                </label>
                <input
                  type="password"
                  value={privateRoomPassword}
                  onChange={(e) => setPrivateRoomPassword(e.target.value)}
                  placeholder="Leave empty for no password"
                  className={`
                    w-full px-4 py-3 rounded-lg border transition-all duration-200
                    ${colors.card.background} ${colors.border.primary} ${colors.text.primary}
                    focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                    placeholder-gray-400 dark:placeholder-gray-500
                  `}
                />
              </div>
            </div>

            <div className="flex gap-4 mt-6">
              <button
                onClick={() => {
                  handleCreatePrivateGame();
                }}
                className={`
                  flex-1 py-3 px-6 rounded-lg font-semibold text-white
                  transition-all duration-200 transform
                  bg-orange-600 hover:bg-orange-700
                  hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]
                  focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2
                `}
              >
                🔒 Create Private Room
              </button>
              <button
                onClick={() => {
                  setShowPrivateForm(false);
                  setPrivateRoomPassword('');
                }}
                className={`
                  px-6 py-3 rounded-lg font-semibold
                  transition-all duration-200 transform
                  ${colors.button.ghost} ${colors.text.primary}
                  hover:shadow-md active:scale-[0.98]
                  focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2
                `}
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Active Games */}
        <div className={`${colors.card.background} rounded-2xl shadow-xl p-6 sm:p-8 border ${colors.card.border}`}>
          <h3 className={`text-xl sm:text-2xl font-bold ${colors.text.primary} mb-6 flex items-center gap-2`}>
            <span>🎲</span>
            <span>Active Games ({games.length})</span>
          </h3>
          
          {games.length === 0 ? (
            <div className={`text-center py-12 ${colors.text.secondary}`}>
              <div className="text-6xl mb-4">♟️</div>
              <p className="text-lg">No active games at the moment</p>
              <p className="text-sm mt-2">Create a game or play practice mode!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
              {games.map((game) => (
                <div
                  key={game.roomId}
                  className={`
                    p-4 sm:p-6 rounded-xl border transition-all duration-200
                    ${colors.card.background} ${colors.border.primary}
                    hover:shadow-lg hover:scale-[1.02] card-hover
                  `}
                >
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className={`font-mono text-sm ${colors.text.muted}`}>
                          Room: {game.roomId}
                        </p>
                        {game.settings?.isPrivate && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200">
                            🔒 Private
                          </span>
                        )}
                        {game.settings?.hasPassword && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                            🔐 Password
                          </span>
                        )}
                      </div>
                      <p className={`text-lg font-semibold ${colors.text.primary}`}>
                        {game.timeControl ? `${Math.floor(game.timeControl.initialTime / 60000)}+${Math.floor(game.timeControl.increment / 1000)}` : 'Custom'}
                      </p>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                      game.status === 'waiting' 
                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                        : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                    }`}>
                      {game.status === 'waiting' ? '🟢 Waiting' : '🟡 Playing'}
                    </div>
                  </div>

                  <div className="space-y-2 mb-4">
                    <div className={`flex items-center justify-between ${colors.text.secondary}`}>
                      <span>White:</span>
                      <span className="font-medium">
                        {game.players?.white?.username || 'Waiting...'}
                      </span>
                    </div>
                    <div className={`flex items-center justify-between ${colors.text.secondary}`}>
                      <span>Black:</span>
                      <span className="font-medium">
                        {game.players?.black?.username || 'Waiting...'}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    {/* Debug info - temporary */}
                    {console.log('Game:', game.roomId, 'Status:', game.status, 'Current user in game:', isCurrentUserInGame(game), 'Current username:', isGuest ? guestData?.username : user?.username, 'Game players:', game.players)}
                    
                    {/* Always show appropriate buttons based on game state */}
                    {!game.players?.black?.username && !isCurrentUserInGame(game) && (
                      <button
                        onClick={() => handleJoinGame(game.roomId)}
                        className={`
                          w-full py-2 px-4 rounded-lg font-semibold text-white
                          transition-all duration-200 transform
                          ${colors.button.primary}
                          hover:shadow-md hover:scale-[1.02] active:scale-[0.98]
                          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                        `}
                      >
                        🚀 Join Game
                      </button>
                    )}
                    
                    {isCurrentUserInGame(game) && (
                      <button
                        onClick={() => onJoinGame(game.roomId, getCurrentUserColor(game))}
                        className={`
                          w-full py-2 px-4 rounded-lg font-semibold text-white
                          transition-all duration-200 transform
                          ${colors.button.success}
                          hover:shadow-md hover:scale-[1.02] active:scale-[0.98]
                          focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2
                        `}
                      >
                        {game.players?.black?.username ? '🎮 Resume Game' : '🎮 Continue Game'}
                      </button>
                    )}
                    
                    {game.players?.black?.username && !isCurrentUserInGame(game) && (
                      <button
                        onClick={() => onJoinGame(game.roomId, 'spectator')}
                        className={`
                          w-full py-2 px-4 rounded-lg font-semibold text-white
                          transition-all duration-200 transform
                          bg-purple-600 hover:bg-purple-700
                          hover:shadow-md hover:scale-[1.02] active:scale-[0.98]
                          focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2
                        `}
                      >
                        👁️ Spectate Game
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GameLobby;
