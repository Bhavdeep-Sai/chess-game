import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { gamesApi } from '../services/api';

const GameLobby = ({ onJoinGame, onCreateGame, onPlayPractice, isGuest, guestData }) => {
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedTimeControl, setSelectedTimeControl] = useState('10+0');
  const [roomPassword, setRoomPassword] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [joinRoomId, setJoinRoomId] = useState('');

  const { user } = useAuth();

  useEffect(() => {
    loadGames();
    const interval = setInterval(loadGames, 5000); // Refresh every 5 seconds
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
          allowSpectators: gameSettings.allowSpectators,
          autoStart: gameSettings.autoStart
        }
      };

      if (isGuest) {
        gameData.isGuest = true;
        gameData.guestUsername = guestData.username;
      }

      const response = await gamesApi.createGame(gameData);
      const { roomId } = response.data;
      
      onCreateGame?.(roomId);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create game');
    }
  };

  const handleJoinGame = async (roomId, password = '', asSpectator = false) => {
    try {
      const joinData = { password };
      
      if (asSpectator) {
        joinData.spectate = true;
      }
      
      if (isGuest) {
        joinData.isGuest = true;
        joinData.guestUsername = guestData.username;
      }

      const response = await gamesApi.joinGame(roomId, joinData);
      onJoinGame?.(roomId, response.data.playerColor);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to join game');
    }
  };

  const handleJoinRandom = async () => {
    const currentUsername = isGuest ? guestData.username : user?.username;
    
    const availableGames = games.filter(game => {
      // Don't join if room is full
      if (game.players.black) return false;
      
      // Don't join if has password
      if (game.settings.hasPassword) return false;
      
      // Don't join if current user is already in the game
      if (game.players.white && game.players.white.username === currentUsername) return false;
      
      return true;
    });

    if (availableGames.length > 0) {
      const randomGame = availableGames[Math.floor(Math.random() * availableGames.length)];
      await handleJoinGame(randomGame.roomId);
    } else {
      // Create a new game if no available games
      await handleCreateGame({
        isPrivate: false,
        password: '',
        allowSpectators: true,
        autoStart: true
      });
    }
  };

  const formatTimeControl = (timeControl) => {
    const minutes = Math.floor(timeControl.initialTime / 60000);
    const increment = Math.floor(timeControl.increment / 1000);
    return increment > 0 ? `${minutes}+${increment}` : `${minutes} min`;
  };

  const formatPlayerRating = (player) => {
    if (!player) return null;
    return (
      <span>
        {player.username} ({player.rating})
        {player.isGuest && (
          <svg className="w-4 h-4 inline-block ml-1 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        )}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-gray-800 mb-2">Chess Lobby</h1>
        <p className="text-gray-600">
          Welcome {isGuest ? guestData.username : user?.username}! 
          {isGuest && ' (Playing as Guest)'}
        </p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
          {error}
          <button 
            onClick={() => setError(null)}
            className="ml-2 text-red-800 hover:text-red-900"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <button
          onClick={handleJoinRandom}
          className="bg-green-600 text-white py-4 px-6 rounded-lg hover:bg-green-700 transition-colors duration-200 font-semibold text-lg"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          Play Random Opponent
        </button>
        
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="bg-blue-600 text-white py-4 px-6 rounded-lg hover:bg-blue-700 transition-colors duration-200 font-semibold text-lg"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
          </svg>
          Create Game Room
        </button>

        <button
          onClick={onPlayPractice}
          className="bg-purple-600 text-white py-4 px-6 rounded-lg hover:bg-purple-700 transition-colors duration-200 font-semibold text-lg"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
          Practice Mode
        </button>

        <div className="bg-gray-100 p-4 rounded-lg">
          <h3 className="font-semibold text-gray-700 mb-2">Join by Room ID</h3>
          <div className="flex">
            <input
              type="text"
              value={joinRoomId}
              onChange={(e) => setJoinRoomId(e.target.value.toUpperCase())}
              placeholder="Room ID"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              maxLength={8}
            />
            <button
              onClick={() => handleJoinGame(joinRoomId)}
              disabled={!joinRoomId}
              className="bg-gray-600 text-white px-4 py-2 rounded-r-md hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Join
            </button>
          </div>
        </div>
      </div>

      {/* Create Game Form */}
      {showCreateForm && (
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">Create New Game</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Time Control
              </label>
              <select
                value={selectedTimeControl}
                onChange={(e) => setSelectedTimeControl(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="1+0">1 minute</option>
                <option value="3+0">3 minutes</option>
                <option value="5+0">5 minutes</option>
                <option value="10+0">10 minutes</option>
                <option value="15+10">15+10 seconds</option>
                <option value="30+0">30 minutes</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Room Password (Optional)
              </label>
              <input
                type="password"
                value={roomPassword}
                onChange={(e) => setRoomPassword(e.target.value)}
                placeholder="Leave empty for public room"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="flex gap-4 mt-6">
            <button
              onClick={() => handleCreateGame({
                isPrivate: !!roomPassword,
                password: roomPassword,
                allowSpectators: true,
                autoStart: false
              })}
              className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors duration-200"
            >
              Create Room
            </button>
            <button
              onClick={() => setShowCreateForm(false)}
              className="bg-gray-300 text-gray-700 px-6 py-2 rounded-md hover:bg-gray-400 transition-colors duration-200"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Available Games */}
      <div className="bg-white rounded-lg shadow-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-xl font-semibold text-gray-800">Available Games</h3>
          <p className="text-gray-600">Click on a game to join or spectate</p>
        </div>

        {games.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <svg className="w-16 h-16 mx-auto mb-4 text-gray-400" viewBox="0 0 45 45" fill="currentColor">
              <path d="M22.5,9c-2.21,0-4,1.79-4,4,0,0.89,0.29,1.71,0.78,2.38C17.33,16.5,16,18.59,16,21c0,2.03,0.94,3.84,2.41,5.03-3,1.06-7.41,5.55-7.41,13.47h23c0-7.92-4.41-12.41-7.41-13.47C27.06,24.84,28,23.03,28,21c0-2.41-1.33-4.5-3.28-5.62C25.21,14.71,25.5,13.89,25.5,13c0-2.21-1.79-4-4-4z" stroke="#000" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            <p>No games available. Create one to start playing!</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {games.map((game) => {
              const currentUsername = isGuest ? guestData.username : user?.username;
              const isCurrentUserInGame = (game.players.white && game.players.white.username === currentUsername) ||
                                         (game.players.black && game.players.black.username === currentUsername);
              
              return (
                <div key={game.roomId} className={`p-4 transition-colors duration-150 ${isCurrentUserInGame ? 'bg-blue-50 border-l-4 border-l-blue-500' : 'hover:bg-gray-50'}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-4">
                        <div className="font-mono text-lg font-semibold text-blue-600">
                          {game.roomId}
                        </div>
                        {game.settings.hasPassword && (
                          <svg className="w-4 h-4 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                          </svg>
                        )}
                        {isCurrentUserInGame && (
                          <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                            Your Game
                          </span>
                        )}
                      <span className="text-sm text-gray-500">
                        {formatTimeControl(game.timeControl)}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-6 mt-2">
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 bg-white border-2 border-gray-400 rounded"></div>
                        <span className="text-sm">
                          {formatPlayerRating(game.players.white) || 'Waiting...'}
                        </span>
                      </div>
                      <div className="text-gray-400">vs</div>
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 bg-gray-800 rounded"></div>
                        <span className="text-sm">
                          {formatPlayerRating(game.players.black) || 'Waiting...'}
                        </span>
                      </div>
                    </div>

                    {game.spectatorCount > 0 && (
                      <div className="text-xs text-gray-500 mt-1">
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                        {game.spectatorCount} spectator{game.spectatorCount !== 1 ? 's' : ''}
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2">
                    {!game.players.black && !isCurrentUserInGame && (
                      <button
                        onClick={() => handleJoinGame(game.roomId)}
                        className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors duration-200"
                      >
                        Join as Player
                      </button>
                    )}
                    
                    {isCurrentUserInGame && (
                      <button
                        onClick={() => handleJoinGame(game.roomId)}
                        className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors duration-200"
                      >
                        Rejoin Game
                      </button>
                    )}
                    
                    {game.settings.allowSpectators && !isCurrentUserInGame && (
                      <button
                        onClick={() => handleJoinGame(game.roomId, '', true)}
                        className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 transition-colors duration-200"
                      >
                        Spectate
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default GameLobby;
