import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../hooks/useTheme';
import { FaEye, FaEyeSlash, FaChessKnight } from 'react-icons/fa';

const LoginForm = ({ onSuccess, onSwitchToRegister, onPlayAsGuest }) => {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);

  const { login, isLoading, error, clearError } = useAuth();
  const { colors } = useTheme();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (error) clearError();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.username.trim() || !formData.password) {
      return;
    }

    const result = await login(formData);
    if (result.success) {
      onSuccess?.();
    }
  };

  return (
    <div className={`
      w-full max-w-md mx-auto rounded-2xl shadow-2xl p-6 sm:p-8 
      transition-all duration-300 fade-in
      ${colors.card.background} ${colors.card.border} border
      backdrop-blur-sm bg-opacity-95
    `}>
      {/* Header with Chess Icon */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 mb-4">
          <FaChessKnight className="w-8 h-8 text-white" />
        </div>
        <h2 className={`text-3xl sm:text-4xl font-bold ${colors.text.primary} mb-2`}>
          Welcome Back
        </h2>
        <p className={`${colors.text.secondary} text-base sm:text-lg`}>
          Sign in to your chess account
        </p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-100 dark:bg-red-900 border border-red-400 dark:border-red-600 text-red-700 dark:text-red-300 rounded-lg animate-pulse">
          <div className="flex items-center">
            <span className="text-red-500 mr-2">⚠️</span>
            {error}
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="username" className={`block text-sm font-semibold ${colors.text.primary} mb-2`}>
            Username or Email
          </label>
          <input
            type="text"
            id="username"
            name="username"
            value={formData.username}
            onChange={handleChange}
            placeholder="Enter your username or email"
            className={`
              w-full px-4 py-3 rounded-lg border transition-all duration-200
              ${colors.card.background} ${colors.border.primary} ${colors.text.primary}
              focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
              placeholder-gray-400 dark:placeholder-gray-500
              text-base sm:text-sm
            `}
            required
          />
        </div>

        <div>
          <label htmlFor="password" className={`block text-sm font-semibold ${colors.text.primary} mb-2`}>
            Password
          </label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Enter your password"
              className={`
                w-full px-4 py-3 pr-12 rounded-lg border transition-all duration-200
                ${colors.card.background} ${colors.border.primary} ${colors.text.primary}
                focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                placeholder-gray-400 dark:placeholder-gray-500
                text-base sm:text-sm
              `}
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className={`
                absolute inset-y-0 right-0 pr-4 flex items-center
                ${colors.text.muted} hover:${colors.text.secondary}
                transition-colors duration-200
              `}
            >
              {showPassword ? (
                <FaEyeSlash className="h-5 w-5" />
              ) : (
                <FaEye className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading || !formData.username.trim() || !formData.password}
          className={`
            w-full py-3 px-4 rounded-lg font-semibold text-white
            transition-all duration-200 transform
            ${colors.button.primary}
            hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]
            disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none
            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
            text-base sm:text-sm
          `}
        >
          {isLoading ? (
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
              Signing in...
            </div>
          ) : (
            'Sign In'
          )}
        </button>
      </form>

      <div className="mt-8 text-center space-y-6">
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className={`w-full border-t ${colors.border.primary}`} />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className={`px-4 ${colors.card.background} ${colors.text.muted}`}>Or</span>
          </div>
        </div>

        <button
          onClick={onPlayAsGuest}
          className={`
            w-full py-3 px-4 rounded-lg font-semibold text-white
            transition-all duration-200 transform
            ${colors.button.secondary}
            hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]
            focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2
            text-base sm:text-sm
          `}
        >
          🎮 Play as Guest
        </button>

        <p className={`text-sm ${colors.text.secondary}`}>
          Don't have an account?{' '}
          <button
            onClick={onSwitchToRegister}
            className={`${colors.text.accent} hover:underline font-semibold transition-colors duration-200`}
          >
            Sign up here
          </button>
        </p>
      </div>
    </div>
  );
};

export default LoginForm;
