import React, { useState, useRef, useEffect } from 'react';

const ChatBox = ({ messages, onSendMessage, disabled = false, currentUsername }) => {
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef(null);
  const chatContainerRef = useRef(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (newMessage.trim() && !disabled) {
      onSendMessage(newMessage.trim());
      setNewMessage('');
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { 
      hour12: false, 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <div className="bg-white rounded-lg shadow-lg h-80 flex flex-col overflow-hidden card-hover">
      {/* Chat Header */}
      <div className="px-4 py-3 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-blue-100 rounded-t-lg">
        <h3 className="font-semibold text-gray-800 flex items-center">
          <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          Chat
          <span className="ml-2 text-xs bg-blue-200 text-blue-700 px-2 py-1 rounded-full">
            {messages.filter(m => !m.isSystem).length}
          </span>
        </h3>
      </div>

      {/* Messages Container */}
      <div 
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto p-3 space-y-2 bg-gradient-to-b from-gray-50 to-white"
      >
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 text-sm py-8">
            <svg className="w-12 h-12 mx-auto mb-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} 
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <p>No messages yet.</p>
            <p className="text-xs">Say hello to your opponent!</p>
          </div>
        ) : (
          messages.map((message, index) => {
            const isCurrentUser = message.username === currentUsername;
            const displayName = message.isSystem ? 'System' : 
                              isCurrentUser ? 'You' : 'Opponent';
            
            return (
              <div
                key={index}
                className={`${
                  message.isSystem 
                    ? 'text-center text-sm text-gray-500 italic py-1' 
                    : ''
                }`}
              >
                {message.isSystem ? (
                  <div className="flex items-center justify-center bg-yellow-50 rounded-md px-2">
                    <svg className="w-5 h-5 inline-block mr-1 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {message.message}
                  </div>
                ) : (
                  <div className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'} mb-2`}>
                    <div className={`max-w-[75%] rounded-lg p-3 shadow-sm ${
                      isCurrentUser 
                        ? 'bg-blue-600 text-white rounded-br-sm' 
                        : 'bg-white border border-gray-100 text-gray-700 rounded-bl-sm'
                    }`}>
                      <div className="flex items-center justify-between mb-1">
                        <span className={`font-medium text-xs ${
                          isCurrentUser ? 'text-blue-100' : 'text-blue-700'
                        }`}>
                          {displayName}
                        </span>
                        <span className={`text-xs ml-2 ${
                          isCurrentUser ? 'text-blue-200' : 'text-gray-500'
                        }`}>
                          {formatTime(message.timestamp)}
                        </span>
                      </div>
                      <div className="text-sm break-words">
                        {message.message}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="p-3 border-t border-gray-200 bg-gray-50 rounded-b-lg">
        <form onSubmit={handleSubmit} className="flex space-x-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={disabled ? "Chat disabled" : "Type your message..."}
            disabled={disabled}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed text-sm bg-white"
            maxLength={200}
          />
          <button
            type="submit"
            disabled={disabled || !newMessage.trim()}
            className="px-4 py-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 flex items-center justify-center"
          >
            <svg 
              className="w-4 h-4 rotate-45" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" 
              />
            </svg>
          </button>
        </form>

        {/* Character count */}
        <div className="text-xs text-gray-400 mt-1 text-right">
          <span className={newMessage.length > 180 ? 'text-red-500' : ''}>
            {newMessage.length}/200
          </span>
        </div>
      </div>
    </div>
  );
};

export default ChatBox;
