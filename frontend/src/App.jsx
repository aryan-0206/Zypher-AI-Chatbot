import React, { useState, useEffect, useRef } from 'react';
import ChatMessage from './components/ChatMessage';
import ChatInput from './components/ChatInput';
import './App.css';

function App() {
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentSessionId, setCurrentSessionId] = useState(() => `session_${Date.now()}`);
  const [conversations, setConversations] = useState([]);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  // Load conversations from localStorage on mount
  useEffect(() => {
    const savedConversations = localStorage.getItem('zypher_conversations');
    if (savedConversations) {
      const parsed = JSON.parse(savedConversations);
      setConversations(parsed);

      // Load the most recent conversation
      if (parsed.length > 0) {
        const mostRecent = parsed[0];
        setCurrentSessionId(mostRecent.id);
        setMessages(mostRecent.messages || []);
      }
    }
  }, []);

  // Save conversations to localStorage whenever they change
  useEffect(() => {
    if (conversations.length > 0) {
      localStorage.setItem('zypher_conversations', JSON.stringify(conversations));
    }
  }, [conversations]);

  // Generate a title from the first message
  const generateTitle = (firstMessage) => {
    if (!firstMessage) return 'New Chat';
    const text = firstMessage.substring(0, 30);
    return text.length < firstMessage.length ? text + '...' : text;
  };

  // Update current conversation in the list
  const updateConversation = (sessionId, newMessages) => {
    setConversations(prev => {
      const existing = prev.find(c => c.id === sessionId);
      const title = newMessages.length > 0 ? generateTitle(newMessages[0].text) : 'New Chat';

      if (existing) {
        // Update existing conversation
        return prev.map(c =>
          c.id === sessionId
            ? { ...c, messages: newMessages, title, updatedAt: new Date().toISOString() }
            : c
        ).sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
      } else {
        // Add new conversation
        return [{
          id: sessionId,
          title,
          messages: newMessages,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }, ...prev];
      }
    });
  };

  const sendMessage = async (messageText) => {
    if (!messageText.trim()) return;

    const userMsgId = Date.now();
    const userMessage = {
      id: userMsgId,
      text: messageText,
      sender: 'user',
      timestamp: new Date().toISOString()
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    updateConversation(currentSessionId, newMessages);
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: messageText,
          session_id: currentSessionId
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Server responded with ${response.status}`);
      }

      const data = await response.json();

      const botMessage = {
        id: Date.now() + 1,
        text: data.response,
        sender: 'bot',
        timestamp: data.timestamp,
        meta: { processingTime: data.processing_time }
      };

      const updatedMessages = [...newMessages, botMessage];
      setMessages(updatedMessages);
      updateConversation(currentSessionId, updatedMessages);
    } catch (error) {
      console.error('Chat Error:', error);
      const errorMessage = {
        id: Date.now() + 1,
        text: `**System Alert**: ${error.message}. Please check your connection and API keys.`,
        sender: 'bot',
        timestamp: new Date().toISOString(),
        isError: true
      };
      const updatedMessages = [...newMessages, errorMessage];
      setMessages(updatedMessages);
      updateConversation(currentSessionId, updatedMessages);
    } finally {
      setIsLoading(false);
    }
  };

  const startNewChat = () => {
    const newSessionId = `session_${Date.now()}`;
    setCurrentSessionId(newSessionId);
    setMessages([]);
  };

  const loadConversation = (sessionId) => {
    const conversation = conversations.find(c => c.id === sessionId);
    if (conversation) {
      setCurrentSessionId(sessionId);
      setMessages(conversation.messages || []);
    }
  };

  const deleteConversation = (sessionId, e) => {
    e.stopPropagation();
    if (window.confirm('Delete this conversation?')) {
      setConversations(prev => prev.filter(c => c.id !== sessionId));

      // If deleting current conversation, start a new one
      if (sessionId === currentSessionId) {
        startNewChat();
      }

      // Clear from backend
      fetch(`/api/clear/${sessionId}`, { method: 'DELETE' }).catch(console.error);
    }
  };

  const clearAllHistory = () => {
    if (window.confirm('Delete all conversation history? This cannot be undone.')) {
      setConversations([]);
      localStorage.removeItem('zypher_conversations');
      startNewChat();
    }
  };

  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="logo">
            <img src="/zypher-user-logo.jpg" alt="Zypher AI" className="logo-icon" />
          </div>
          <button className="new-chat-btn" onClick={startNewChat}>
            <span>+</span> New Chat
          </button>
        </div>

        <div className="session-list">
          <div className="section-label">Recent Chats</div>
          {conversations.length === 0 ? (
            <div className="empty-history">
              <p>No conversations yet</p>
            </div>
          ) : (
            conversations.map(conv => (
              <div
                key={conv.id}
                className={`session-item ${conv.id === currentSessionId ? 'active' : ''}`}
                onClick={() => loadConversation(conv.id)}
              >
                <span className="session-icon">💬</span>
                <span className="session-title">{conv.title}</span>
                <button
                  className="delete-btn"
                  onClick={(e) => deleteConversation(conv.id, e)}
                  title="Delete conversation"
                >
                  🗑️
                </button>
              </div>
            ))
          )}
        </div>

        <div className="sidebar-footer">
          {conversations.length > 0 && (
            <button className="clear-all-btn" onClick={clearAllHistory}>
              Clear All History
            </button>
          )}
          <div className="user-profile">
            <div className="avatar">U</div>
            <div className="user-info">
              <div className="user-name">Guest User</div>
              <div className="user-status">● Online</div>
            </div>
          </div>
        </div>
      </aside>

      <main className="app">
        {messages.length > 0 && (
          <header className="app-header">
            <div className="header-info">
              <h2>Current Session</h2>
              <p>{messages.length} messages exchanged</p>
            </div>
            <div className="header-actions">
              <button className="action-btn" onClick={startNewChat} title="New Chat">
                ➕
              </button>
              <button className="action-btn" title="Settings">
                ⚙️
              </button>
            </div>
          </header>
        )}

        <div className="chat-container">
          <div className="messages-container">
            {messages.length === 0 && (
              <div className="welcome-screen">
                <div className="welcome-hero">
                  <img src="/zypher-user-logo.jpg" alt="Zypher AI" className="hero-logo" />
                  <h1>How can I help you today?</h1>
                  <p>Experience the next generation of conversational AI.</p>
                </div>
                <div className="suggestion-grid">
                  <div className="suggestion-card" onClick={() => sendMessage("Generate a creative story about Mars")}>
                    <h3>Creative Writing</h3>
                    <p>"Write a story about a futuristic city on Mars..."</p>
                  </div>
                  <div className="suggestion-card" onClick={() => sendMessage("How do I fix a bug in React?")}>
                    <h3>Code Assistant</h3>
                    <p>"Explain how to handle errors in React async calls..."</p>
                  </div>
                  <div className="suggestion-card" onClick={() => sendMessage("Tell me a random scientific fact")}>
                    <h3>Knowledge Base</h3>
                    <p>"Did you know that a teaspoon of neutron star..."</p>
                  </div>
                </div>
              </div>
            )}

            {messages.map(message => (
              <ChatMessage key={message.id} message={message} />
            ))}

            {isLoading && (
              <div className="message-wrapper bot">
                <div className="bot-typing">
                  <div className="typing-dot"></div>
                  <div className="typing-dot"></div>
                  <div className="typing-dot"></div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          <div className="input-area">
            <ChatInput onSendMessage={sendMessage} isLoading={isLoading} />
            <p className="input-footer">Zypher AI can make mistakes. Check important info.</p>
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
