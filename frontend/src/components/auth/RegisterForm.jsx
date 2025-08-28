import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../hooks/useTheme';
import { FaEye, FaEyeSlash, FaChessKnight, FaUser, FaEnvelope, FaLock, FaGlobe } from 'react-icons/fa';

const RegisterForm = ({ onSuccess, onSwitchToLogin }) => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    country: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const { register, isLoading, error, clearError } = useAuth();
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
    
    if (formData.password !== formData.confirmPassword) {
      return;
    }

    const userData = {
      username: formData.username,
      email: formData.email,
      password: formData.password,
      profile: {
        firstName: formData.firstName,
        lastName: formData.lastName,
        country: formData.country,
      }
    };

    const result = await register(userData);
    if (result.success) {
      onSuccess?.();
    }
  };

  const passwordsMatch = formData.password === formData.confirmPassword;
  const isFormValid = formData.username.trim() && 
                     formData.email.trim() && 
                     formData.password && 
                     formData.confirmPassword && 
                     passwordsMatch;

  return (
    <div className={`
      w-full max-w-lg mx-auto rounded-2xl shadow-2xl p-6 sm:p-8 
      transition-all duration-300 fade-in
      ${colors.card.background} ${colors.card.border} border
      backdrop-blur-sm bg-opacity-95
    `}>
      {/* Header with Chess Icon */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-r from-green-500 to-blue-600 mb-4">
          <FaChessKnight className="w-8 h-8 text-white" />
        </div>
        <h2 className={`text-3xl sm:text-4xl font-bold ${colors.text.primary} mb-2`}>
          Join Chess
        </h2>
        <p className={`${colors.text.secondary} text-base sm:text-lg`}>
          Create your account to start playing
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
        {/* Name Fields */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="firstName" className={`block text-sm font-semibold ${colors.text.primary} mb-2`}>
              <FaUser className="inline mr-2" />
              First Name
            </label>
            <input
              type="text"
              id="firstName"
              name="firstName"
              value={formData.firstName}
              onChange={handleChange}
              placeholder="John"
              className={`
                w-full px-4 py-3 rounded-lg border transition-all duration-200
                ${colors.card.background} ${colors.border.primary} ${colors.text.primary}
                focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                placeholder-gray-400 dark:placeholder-gray-500
                text-base sm:text-sm
              `}
            />
          </div>
          <div>
            <label htmlFor="lastName" className={`block text-sm font-semibold ${colors.text.primary} mb-2`}>
              <FaUser className="inline mr-2" />
              Last Name
            </label>
            <input
              type="text"
              id="lastName"
              name="lastName"
              value={formData.lastName}
              onChange={handleChange}
              placeholder="Doe"
              className={`
                w-full px-4 py-3 rounded-lg border transition-all duration-200
                ${colors.card.background} ${colors.border.primary} ${colors.text.primary}
                focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                placeholder-gray-400 dark:placeholder-gray-500
                text-base sm:text-sm
              `}
            />
          </div>
        </div>

        {/* Username */}
        <div>
          <label htmlFor="username" className={`block text-sm font-semibold ${colors.text.primary} mb-2`}>
            <FaUser className="inline mr-2" />
            Username *
          </label>
          <input
            type="text"
            id="username"
            name="username"
            value={formData.username}
            onChange={handleChange}
            placeholder="Choose a unique username"
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

        {/* Email */}
        <div>
          <label htmlFor="email" className={`block text-sm font-semibold ${colors.text.primary} mb-2`}>
            <FaEnvelope className="inline mr-2" />
            Email *
          </label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="Enter your email"
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

        {/* Country */}
        <div>
          <label htmlFor="country" className={`block text-sm font-semibold ${colors.text.primary} mb-2`}>
            <FaGlobe className="inline mr-2" />
            Country
          </label>
          <input
            type="text"
            id="country"
            name="country"
            value={formData.country}
            onChange={handleChange}
            placeholder="Your country"
            className={`
              w-full px-4 py-3 rounded-lg border transition-all duration-200
              ${colors.card.background} ${colors.border.primary} ${colors.text.primary}
              focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
              placeholder-gray-400 dark:placeholder-gray-500
              text-base sm:text-sm
            `}
          />
        </div>

        {/* Password Fields */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="password" className={`block text-sm font-semibold ${colors.text.primary} mb-2`}>
              <FaLock className="inline mr-2" />
              Password *
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Create password"
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

          <div>
            <label htmlFor="confirmPassword" className={`block text-sm font-semibold ${colors.text.primary} mb-2`}>
              <FaLock className="inline mr-2" />
              Confirm Password *
            </label>
            <div className="relative">
              <input
                type={showConfirmPassword ? "text" : "password"}
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="Confirm password"
                className={`
                  w-full px-4 py-3 pr-12 rounded-lg border transition-all duration-200
                  ${colors.card.background} ${colors.border.primary} ${colors.text.primary}
                  ${formData.confirmPassword && !passwordsMatch ? 'border-red-500' : ''}
                  focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                  placeholder-gray-400 dark:placeholder-gray-500
                  text-base sm:text-sm
                `}
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className={`
                  absolute inset-y-0 right-0 pr-4 flex items-center
                  ${colors.text.muted} hover:${colors.text.secondary}
                  transition-colors duration-200
                `}
              >
                {showConfirmPassword ? (
                  <FaEyeSlash className="h-5 w-5" />
                ) : (
                  <FaEye className="h-5 w-5" />
                )}
              </button>
            </div>
            {formData.confirmPassword && !passwordsMatch && (
              <p className="text-red-500 text-xs mt-1">Passwords do not match</p>
            )}
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading || !isFormValid}
          className={`
            w-full py-3 px-4 rounded-lg font-semibold text-white
            transition-all duration-200 transform
            ${colors.button.success}
            hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]
            disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none
            focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2
            text-base sm:text-sm
          `}
        >
          {isLoading ? (
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
              Creating account...
            </div>
          ) : (
            '🎯 Create Account'
          )}
        </button>
      </form>

      <div className="mt-8 text-center">
        <p className={`text-sm ${colors.text.secondary}`}>
          Already have an account?{' '}
          <button
            onClick={onSwitchToLogin}
            className={`${colors.text.accent} hover:underline font-semibold transition-colors duration-200`}
          >
            Sign in here
          </button>
        </p>
      </div>
    </div>
  );
};

export default RegisterForm;
