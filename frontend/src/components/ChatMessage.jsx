import React, { useState, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import './ChatMessage.css';

const ImageLightbox = ({ src, subject, onClose }) => (
  <div className="lightbox-overlay" onClick={onClose}>
    <button className="lightbox-close" onClick={onClose} title="Close">✕</button>
    <img
      src={src}
      alt={subject || 'Generated image'}
      className="lightbox-img"
      onClick={e => e.stopPropagation()}
    />
  </div>
);

const REACTIONS = ['👍', '❤️', '😂', '🔥', '👎'];

const ChatMessage = ({ message, onRegenerate }) => {
  const [copied, setCopied] = useState(false);
  const [reaction, setReaction] = useState(null);
  const [showReactions, setShowReactions] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [imgError, setImgError] = useState(false);

  const formatTime = (ts) => {
    try {
      return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch { return ''; }
  };

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(message.text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
      const el = document.createElement('textarea');
      el.value = message.text;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [message.text]);

  const handleDownloadImage = useCallback(() => {
    if (!message.image_url) return;
    const link = document.createElement('a');
    link.href = message.image_url;
    link.download = `zypher-${message.image_subject || 'image'}.jpg`;
    link.click();
  }, [message.image_url, message.image_subject]);

  const isBot = message.sender === 'bot';
  const hasImage = isBot && message.image_url && !imgError;

  return (
    <>
      <div className={`message-wrapper ${message.sender}`}>
        {/* Avatar */}
        <div className="avatar-small">
          {isBot ? '⚡' : '👤'}
        </div>

        {/* Bubble + footer */}
        <div className={`message-bubble ${message.sender} ${message.isError ? 'error' : ''}`}>
          {/* Message text */}
          <div className="message-content">
            {isBot ? (
              <ReactMarkdown>{message.text}</ReactMarkdown>
            ) : (
              <div className="text">{message.text}</div>
            )}

            {/* Inline image */}
            {hasImage && (
              <div className="message-image-card" onClick={() => setLightboxOpen(true)}>
                <img
                  src={message.image_url}
                  alt={message.image_subject || 'AI generated image'}
                  className="message-image"
                  onError={() => setImgError(true)}
                />
                <div className="image-overlay">
                  <button
                    className="image-action-btn"
                    onClick={e => { e.stopPropagation(); setLightboxOpen(true); }}
                  >
                    🔍 Fullscreen
                  </button>
                  <button
                    className="image-action-btn"
                    onClick={e => { e.stopPropagation(); handleDownloadImage(); }}
                  >
                    ⬇️ Download
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Footer: time + processing time */}
          <div className="message-footer">
            {message.meta?.processingTime && (
              <span className="proc-time">⚡ {message.meta.processingTime}</span>
            )}
            <span className="timestamp">{formatTime(message.timestamp)}</span>
          </div>

          {/* Action bar */}
          <div className="message-actions">
            {/* Copy */}
            <button className={`msg-action-btn ${copied ? 'active' : ''}`} onClick={handleCopy} title="Copy">
              {copied ? '✅ Copied' : '📋 Copy'}
            </button>

            {/* Reaction picker */}
            <button
              className="msg-action-btn"
              onClick={() => setShowReactions(v => !v)}
              title="React"
            >
              {reaction || '😊'} React
            </button>

            {/* Regenerate (bot only) */}
            {isBot && onRegenerate && (
              <button className="msg-action-btn" onClick={onRegenerate} title="Regenerate">
                🔄 Retry
              </button>
            )}
          </div>

          {/* Reaction picker */}
          {showReactions && (
            <div className="message-reactions">
              {REACTIONS.map(r => (
                <button
                  key={r}
                  className={`reaction-chip ${reaction === r ? 'active' : ''}`}
                  onClick={() => { setReaction(r === reaction ? null : r); setShowReactions(false); }}
                >
                  {r}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Lightbox */}
      {lightboxOpen && hasImage && (
        <ImageLightbox
          src={message.image_url}
          subject={message.image_subject}
          onClose={() => setLightboxOpen(false)}
        />
      )}
    </>
  );
};

export default ChatMessage;
