import React from 'react';
import ReactMarkdown from 'react-markdown';
import './ChatMessage.css';

const ChatMessage = ({ message }) => {
  const formatTime = (timestamp) => {
    try {
      const date = new Date(timestamp);
      return date.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (e) {
      return '';
    }
  };

  return (
    <div className={`message-wrapper ${message.sender}`}>
      <div className="avatar-small">
        {message.sender === 'bot' ? '🤖' : '👤'}
      </div>
      <div className={`message-bubble ${message.sender} ${message.isError ? 'error' : ''}`}>
        <div className="message-content">
          {message.sender === 'bot' ? (
            <ReactMarkdown>{message.text}</ReactMarkdown>
          ) : (
            <div className="text">{message.text}</div>
          )}
        </div>
        <div className="message-footer">
          {message.meta?.processingTime && (
            <span className="proc-time">⚡ {message.meta.processingTime}</span>
          )}
          <span className="timestamp">{formatTime(message.timestamp)}</span>
        </div>
      </div>
    </div>
  );
};

export default ChatMessage;
