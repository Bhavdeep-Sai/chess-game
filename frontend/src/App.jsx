import React, { useState } from 'react';
import { AuthProvider } from './contexts/AuthContext';
import { useAuth } from './hooks/useAuth';
import LoginForm from './components/auth/LoginForm';
import RegisterForm from './components/auth/RegisterForm';
import GameLobby from './components/GameLobby';
import MultiplayerChessBoard from './components/MultiplayerChessBoard';
import ChessBoard from './components/ChessBoard';

// Generate guest ID
const generateGuestId = () => 'guest_' + Math.random().toString(36).substr(2, 9);

// Logout Button Component
const LogoutButton = ({ onLogout }) => {
  const { logout } = useAuth();
  
  const handleLogout = async () => {
    try {
      await logout();
      onLogout();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <button
      onClick={handleLogout}
      className="text-sm text-red-600 hover:text-red-700 px-3 py-1 rounded transition-colors duration-200"
    >
      Logout
    </button>
  );
};

// App content component (needs to be inside AuthProvider)
const AppContent = () => {
  const [currentView, setCurrentView] = useState('login'); // 'login', 'register', 'lobby', 'game', 'practice'
  const [gameData, setGameData] = useState(null);
  const [guestData, setGuestData] = useState(null);
  
  const { isAuthenticated, user } = useAuth();

  // Check for existing guest data on mount
  React.useEffect(() => {
    const existingGuestData = sessionStorage.getItem('guestData');
    if (existingGuestData) {
      const parsed = JSON.parse(existingGuestData);
      setGuestData(parsed);
      // If user is not authenticated but has guest data, go to lobby
      if (!isAuthenticated) {
        setCurrentView('lobby');
      }
    }
  }, [isAuthenticated]);

  const handleLoginSuccess = () => {
    // Clear guest data when logging in as real user
    sessionStorage.removeItem('guestData');
    setGuestData(null);
    setCurrentView('lobby');
  };

  const handleRegisterSuccess = () => {
    // Clear guest data when registering as real user
    sessionStorage.removeItem('guestData');
    setGuestData(null);
    setCurrentView('lobby');
  };

  const handlePlayAsGuest = () => {
    // Check localStorage first (persistent), then sessionStorage
    const existingGuestData = localStorage.getItem('guestData') || sessionStorage.getItem('guestData');
    
    if (existingGuestData) {
      try {
        // Use existing guest data
        const parsed = JSON.parse(existingGuestData);
        console.log('Using existing guest data:', parsed);
        setGuestData(parsed);
      } catch (error) {
        console.error('Error parsing existing guest data:', error);
        // Create new guest data if parsing fails
        createNewGuestData();
      }
    } else {
      createNewGuestData();
    }
    
    setCurrentView('lobby');
  };

  const createNewGuestData = () => {
    const guestUsername = `Guest${Math.floor(Math.random() * 10000)}`;
    const guestId = generateGuestId();
    
    const newGuestData = { 
      id: guestId, 
      username: guestUsername 
    };
    
    console.log('Creating new guest data:', newGuestData);
    
    // Store in both localStorage (persistent) and sessionStorage (current session)
    localStorage.setItem('guestData', JSON.stringify(newGuestData));
    sessionStorage.setItem('guestData', JSON.stringify(newGuestData));
    setGuestData(newGuestData);
  };

  const handleCreateGame = (roomId) => {
    setGameData({ 
      roomId, 
      playerColor: 'white',
      isGuest: !isAuthenticated,
      guestData: guestData
    });
    setCurrentView('game');
  };

  const handleJoinGame = (roomId, playerColor) => {
    setGameData({ 
      roomId, 
      playerColor,
      isGuest: !isAuthenticated,
      guestData: guestData
    });
    setCurrentView('game');
  };

  const handleLeaveGame = () => {
    setGameData(null);
    setCurrentView('lobby');
  };

  const handlePlayPractice = () => {
    setCurrentView('practice');
  };

  const handleLeavePractice = () => {
    setCurrentView('lobby');
  };

  const handleSwitchToRegister = () => {
    setCurrentView('register');
  };

  const handleSwitchToLogin = () => {
    setCurrentView('login');
  };

  // Show lobby if authenticated user or guest
  const showLobby = isAuthenticated || guestData;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {currentView === 'login' && !showLobby && (
        <div className="min-h-screen flex items-center justify-center p-4">
          <LoginForm
            onSuccess={handleLoginSuccess}
            onSwitchToRegister={handleSwitchToRegister}
            onPlayAsGuest={handlePlayAsGuest}
          />
        </div>
      )}

      {currentView === 'register' && !showLobby && (
        <div className="min-h-screen flex items-center justify-center p-4">
          <RegisterForm
            onSuccess={handleRegisterSuccess}
            onSwitchToLogin={handleSwitchToLogin}
          />
        </div>
      )}

      {currentView === 'lobby' && showLobby && (
        <GameLobby
          onJoinGame={handleJoinGame}
          onCreateGame={handleCreateGame}
          onPlayPractice={handlePlayPractice}
          isGuest={!isAuthenticated}
          guestData={guestData}
        />
      )}

      {currentView === 'practice' && showLobby && (
        <ChessBoard onLeaveGame={handleLeavePractice} />
      )}

      {currentView === 'game' && gameData && (
        <MultiplayerChessBoard
          roomId={gameData.roomId}
          playerColor={gameData.playerColor}
          isGuest={gameData.isGuest}
          guestData={gameData.guestData}
          onLeaveGame={handleLeaveGame}
        />
      )}

      {/* Navigation Bar */}
      {showLobby && (
        <div className="fixed top-4 right-4 z-50">
          <div className="bg-white rounded-lg shadow-lg p-3">
            <div className="flex items-center gap-3">
              <div className="text-sm text-gray-600">
                {isAuthenticated ? (
                  <span>👤 {user?.username}</span>
                ) : (
                  <span>👤 {guestData?.username} (Guest)</span>
                )}
              </div>
              
              {currentView === 'game' && (
                <button
                  onClick={handleLeaveGame}
                  className="text-sm bg-gray-100 hover:bg-gray-200 px-3 py-1 rounded transition-colors duration-200"
                >
                  ← Lobby
                </button>
              )}

              {currentView === 'practice' && (
                <button
                  onClick={handleLeavePractice}
                  className="text-sm bg-gray-100 hover:bg-gray-200 px-3 py-1 rounded transition-colors duration-200"
                >
                  ← Lobby
                </button>
              )}

              {isAuthenticated && (
                <LogoutButton 
                  onLogout={() => {
                    setCurrentView('login');
                    setGuestData(null);
                    setGameData(null);
                  }}
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const App = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

export default App;
