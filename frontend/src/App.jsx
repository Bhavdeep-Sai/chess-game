import React, { useState } from 'react';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { useAuth } from './hooks/useAuth';
import { useTheme } from './hooks/useTheme';
import LoginForm from './components/auth/LoginForm';
import RegisterForm from './components/auth/RegisterForm';
import GameLobby from './components/GameLobby';
import MultiplayerChessBoard from './components/MultiplayerChessBoard';
import ChessBoard from './components/ChessBoard';
import ThemeToggle from './components/ThemeToggle';

// Generate guest ID
const generateGuestId = () => 'guest_' + Math.random().toString(36).substr(2, 9);

// Logout Button Component
const LogoutButton = ({ onLogout }) => {
  const { logout } = useAuth();
  const { colors } = useTheme();
  
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
      className={`
        text-sm px-3 py-2 rounded-lg transition-all duration-200
        ${colors.button.danger} text-white font-medium
        hover:shadow-md active:scale-95
        focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-offset-2
      `}
    >
      Logout
    </button>
  );
};

// App content component (needs to be inside AuthProvider and ThemeProvider)
const AppContent = () => {
  const [currentView, setCurrentView] = useState('login'); // 'login', 'register', 'lobby', 'game', 'practice'
  const [gameData, setGameData] = useState(null);
  const [guestData, setGuestData] = useState(null);
  
  const { isAuthenticated, user } = useAuth();
  const { colors } = useTheme();

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
    <div className={`min-h-screen transition-colors duration-300 ${colors.bg.primary}`}>
      {/* Theme Toggle - Always visible */}
      <div className="fixed top-4 left-4 z-50">
        <ThemeToggle />
      </div>

      {currentView === 'login' && !showLobby && (
        <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 lg:p-8">
          <div className="w-full max-w-md">
            <LoginForm
              onSuccess={handleLoginSuccess}
              onSwitchToRegister={handleSwitchToRegister}
              onPlayAsGuest={handlePlayAsGuest}
            />
          </div>
        </div>
      )}

      {currentView === 'register' && !showLobby && (
        <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 lg:p-8">
          <div className="w-full max-w-md">
            <RegisterForm
              onSuccess={handleRegisterSuccess}
              onSwitchToLogin={handleSwitchToLogin}
            />
          </div>
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

      {/* Navigation Bar - Responsive */}
      {showLobby && (
        <div className="fixed top-4 right-4 z-50">
          <div className={`
            ${colors.card.background} rounded-xl shadow-xl p-3 sm:p-4
            border ${colors.card.border}
            backdrop-blur-sm bg-opacity-95
          `}>
            <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
              {/* User Info */}
              <div className={`text-xs sm:text-sm ${colors.text.secondary} flex items-center gap-1`}>
                <span className="text-lg">👤</span>
                <span className="hidden sm:inline">
                  {isAuthenticated ? user?.username : `${guestData?.username} (Guest)`}
                </span>
                <span className="sm:hidden">
                  {isAuthenticated ? user?.username?.substring(0, 8) : guestData?.username?.substring(0, 8)}
                </span>
              </div>
              
              {/* Navigation Buttons */}
              {currentView === 'game' && (
                <button
                  onClick={handleLeaveGame}
                  className={`
                    text-xs sm:text-sm px-2 sm:px-3 py-1 sm:py-2 rounded-lg 
                    transition-all duration-200 font-medium
                    ${colors.button.ghost} ${colors.text.primary}
                    hover:shadow-md active:scale-95
                    focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2
                  `}
                >
                  <span className="hidden sm:inline">← Lobby</span>
                  <span className="sm:hidden">←</span>
                </button>
              )}

              {currentView === 'practice' && (
                <button
                  onClick={handleLeavePractice}
                  className={`
                    text-xs sm:text-sm px-2 sm:px-3 py-1 sm:py-2 rounded-lg 
                    transition-all duration-200 font-medium
                    ${colors.button.ghost} ${colors.text.primary}
                    hover:shadow-md active:scale-95
                    focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2
                  `}
                >
                  <span className="hidden sm:inline">← Lobby</span>
                  <span className="sm:hidden">←</span>
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
    <ThemeProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;
