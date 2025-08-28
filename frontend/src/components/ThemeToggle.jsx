import React from 'react';
import { useTheme } from '../hooks/useTheme';
import { FaMoon, FaSun } from 'react-icons/fa';

const ThemeToggle = ({ className = '' }) => {
  const { isDark, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className={`
        relative inline-flex items-center justify-center w-10 h-10 rounded-full
        transition-all duration-300 ease-in-out
        ${isDark 
          ? 'bg-gray-700 hover:bg-gray-600 text-yellow-400' 
          : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
        }
        focus:outline-none focus:ring-2 focus:ring-offset-2 
        ${isDark ? 'focus:ring-yellow-400' : 'focus:ring-blue-400'}
        shadow-lg hover:shadow-xl
        ${className}
      `}
      title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
      aria-label={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
    >
      <div className="relative">
        {isDark ? (
          <FaSun className="w-5 h-5 transform transition-transform duration-300 hover:rotate-12" />
        ) : (
          <FaMoon className="w-4 h-4 transform transition-transform duration-300 hover:-rotate-12" />
        )}
      </div>
    </button>
  );
};

export default ThemeToggle;
