import React, { createContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

const ThemeProvider = ({ children }) => {
  const [isDark, setIsDark] = useState(() => {
    // Check for saved theme preference or default to light
    const savedTheme = localStorage.getItem('chess-theme');
    if (savedTheme) {
      return savedTheme === 'dark';
    }
    // Check system preference
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    // Save theme preference
    localStorage.setItem('chess-theme', isDark ? 'dark' : 'light');
    
    // Update document class for Tailwind dark mode
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  const toggleTheme = () => {
    setIsDark(!isDark);
  };

  const theme = {
    isDark,
    toggleTheme,
    colors: {
      // Background colors
      bg: {
        primary: isDark ? 'bg-gray-900' : 'bg-gradient-to-br from-blue-50 to-indigo-100',
        secondary: isDark ? 'bg-gray-800' : 'bg-white',
        tertiary: isDark ? 'bg-gray-700' : 'bg-gray-50',
        hover: isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-50',
      },
      // Text colors
      text: {
        primary: isDark ? 'text-white' : 'text-gray-900',
        secondary: isDark ? 'text-gray-300' : 'text-gray-600',
        muted: isDark ? 'text-gray-400' : 'text-gray-500',
        accent: isDark ? 'text-blue-400' : 'text-blue-600',
      },
      // Border colors
      border: {
        primary: isDark ? 'border-gray-600' : 'border-gray-200',
        secondary: isDark ? 'border-gray-700' : 'border-gray-300',
      },
      // Button colors
      button: {
        primary: isDark ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-600 hover:bg-blue-700',
        secondary: isDark ? 'bg-gray-600 hover:bg-gray-700' : 'bg-gray-600 hover:bg-gray-700',
        danger: isDark ? 'bg-red-600 hover:bg-red-700' : 'bg-red-600 hover:bg-red-700',
        success: isDark ? 'bg-green-600 hover:bg-green-700' : 'bg-green-600 hover:bg-green-700',
        ghost: isDark ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200',
      },
      // Chess board colors
      chess: {
        lightSquare: isDark ? 'bg-amber-200' : 'bg-amber-100',
        darkSquare: isDark ? 'bg-amber-800' : 'bg-amber-600',
        highlight: isDark ? 'bg-yellow-500 bg-opacity-60' : 'bg-yellow-400 bg-opacity-50',
        lastMove: isDark ? 'bg-green-500 bg-opacity-40' : 'bg-green-400 bg-opacity-30',
        check: isDark ? 'bg-red-500 bg-opacity-60' : 'bg-red-500 bg-opacity-50',
        possibleMove: isDark ? 'bg-blue-500 bg-opacity-40' : 'bg-blue-400 bg-opacity-30',
        capture: isDark ? 'bg-red-500 bg-opacity-50' : 'bg-red-400 bg-opacity-40',
      },
      // Card/Panel colors
      card: {
        background: isDark ? 'bg-gray-800' : 'bg-white',
        border: isDark ? 'border-gray-700' : 'border-gray-200',
        shadow: isDark ? 'shadow-gray-900/20' : 'shadow-gray-900/10',
      }
    }
  };

  return (
    <ThemeContext.Provider value={theme}>
      {children}
    </ThemeContext.Provider>
  );
};

export { ThemeContext, ThemeProvider };
