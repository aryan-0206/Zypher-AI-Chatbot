/**
 * Zypher AI — App v2.0
 * Features: dark-AI history, search, pin, rename, theme toggle,
 *           image support, companion chat, keyboard shortcuts, export
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import ChatMessage from './components/ChatMessage';
import ChatInput from './components/ChatInput';
import { ToastContainer, useToast } from './components/Toast';
import './App.css';

// ─── Helpers ────────────────────────────────────────────
const uid = () => `${Date.now()}_${Math.random().toString(36).slice(2)}`;

const generateTitle = (text = '') => {
  const cleaned = text.trim().substring(0, 40);
  return cleaned.length < text.trim().length ? cleaned + '…' : cleaned || 'New Chat';
};

const groupConversations = (convs) => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1);
  const lastWeek  = new Date(today); lastWeek.setDate(today.getDate() - 7);

  const pinned = convs.filter(c => c.is_pinned);
  const unpinned = convs.filter(c => !c.is_pinned);

  const groups = { Pinned: pinned, Today: [], Yesterday: [], 'Last 7 Days': [], Older: [] };

  for (const c of unpinned) {
    const d = new Date(c.updatedAt || c.createdAt);
    if (d >= today)     groups['Today'].push(c);
    else if (d >= yesterday) groups['Yesterday'].push(c);
    else if (d >= lastWeek)  groups['Last 7 Days'].push(c);
    else                     groups['Older'].push(c);
  }

  return groups;
};

// ─── Suggestions ────────────────────────────────────────
const SUGGESTIONS = [
  { emoji: '🎨', title: 'Creative Writing', prompt: 'Write a short poem about the moon in Hinglish style', desc: '"Write a Hinglish poem about the moon..."' },
  { emoji: '💻', title: 'Code Assistant', prompt: 'How do I build a REST API in Python Flask?', desc: '"Build a REST API in Python Flask..."' },
  { emoji: '🌟', title: 'Knowledge', prompt: 'Tell me an amazing space fact I probably don\'t know', desc: '"An amazing space fact I don\'t know..."' },
  { emoji: '🖼️', title: 'Image Generation', prompt: 'Show me an image of a beautiful sunset over mountains', desc: '"Show me a sunset over mountains..."' },
  { emoji: '🤝', title: 'Companion Chat', prompt: 'Yaar, kuch interesting baat karo mere saath!', desc: '"Yaar, kuch interesting baat karo!"' },
  { emoji: '🧠', title: 'Deep Thinking', prompt: 'Explain quantum entanglement in simple words', desc: '"Explain quantum entanglement simply..."' },
];

// ─── API Layer ───────────────────────────────────────────
const API = {
  chat: async (message, session_id) => {
    const r = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, session_id })
    });
    if (!r.ok) { const e = await r.json().catch(() => ({})); throw new Error(e.error || `HTTP ${r.status}`); }
    return r.json();
  },
  regenerate: async (last_user_message, session_id) => {
    const r = await fetch('/api/regenerate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ last_user_message, session_id })
    });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return r.json();
  },
  saveConv: async (conv) => {
    await fetch('/api/conversations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(conv)
    }).catch(() => {});
  },
  deleteConv: async (id) => {
    await fetch(`/api/conversations/${id}`, { method: 'DELETE' }).catch(() => {});
  },
  pinConv: async (id) => {
    await fetch(`/api/conversations/${id}/pin`, { method: 'PATCH' }).catch(() => {});
  },
  renameConv: async (id, title) => {
    await fetch(`/api/conversations/${id}/rename`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title })
    }).catch(() => {});
  },
  clearAll: async () => {
    await fetch('/api/conversations/clear-all', { method: 'DELETE' }).catch(() => {});
  },
};

// ─── Main App ────────────────────────────────────────────
export default function App() {
  const [messages, setMessages]             = useState([]);
  const [isLoading, setIsLoading]           = useState(false);
  const [currentSessionId, setCurrentSession] = useState(() => uid());
  const [conversations, setConversations]   = useState([]);
  const [isSidebarOpen, setIsSidebarOpen]   = useState(false);
  const [searchQuery, setSearchQuery]       = useState('');
  const [renamingId, setRenamingId]         = useState(null);
  const [renameValue, setRenameValue]       = useState('');
  const [modelInfo, setModelInfo]           = useState('');
  const { toasts, toast, removeToast }      = useToast();

  const layoutRef     = useRef(null);
  const historyBtnRef = useRef(null);
  const messagesEndRef= useRef(null);
  const renameInputRef= useRef(null);

  // Scroll to bottom
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => { scrollToBottom(); }, [messages, isLoading]);

  // Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('zypher_v2_conversations');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setConversations(parsed);
        if (parsed.length > 0) {
          const latest = parsed[0];
          setCurrentSession(latest.id);
          setMessages(latest.messages || []);
        }
      } catch { /* ignore */ }
    }
    // Fetch model info
    fetch('/api/health').then(r => r.json()).then(d => setModelInfo(d.model || '')).catch(() => {});
  }, []);

  // Persist conversations
  useEffect(() => {
    if (conversations.length > 0) {
      localStorage.setItem('zypher_v2_conversations', JSON.stringify(conversations));
    }
  }, [conversations]);

  // Close sidebar on outside click / Escape
  useEffect(() => {
    if (!isSidebarOpen) return;
    const onPointer = (e) => {
      const sidebar = layoutRef.current?.querySelector('.sidebar');
      const btn = historyBtnRef.current;
      if (!sidebar?.contains(e.target) && !btn?.contains(e.target)) setIsSidebarOpen(false);
    };
    const onKey = (e) => { if (e.key === 'Escape') setIsSidebarOpen(false); };
    document.addEventListener('pointerdown', onPointer, true);
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('pointerdown', onPointer, true); document.removeEventListener('keydown', onKey); };
  }, [isSidebarOpen]);

  // Keyboard shortcuts: Ctrl+K = new chat
  useEffect(() => {
    const onKey = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        startNewChat();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  // Focus rename input when editing
  useEffect(() => {
    if (renamingId) renameInputRef.current?.focus();
  }, [renamingId]);

  // ─── Conversation Management ─────────────────────────
  const updateConversation = useCallback((sessionId, newMessages) => {
    setConversations(prev => {
      const title = newMessages.length > 0 ? generateTitle(newMessages[0].text) : 'New Chat';
      const now = new Date().toISOString();
      const existing = prev.find(c => c.id === sessionId);
      let updated;
      if (existing) {
        updated = prev.map(c =>
          c.id === sessionId ? { ...c, messages: newMessages, title, updatedAt: now } : c
        );
      } else {
        updated = [{ id: sessionId, title, messages: newMessages, createdAt: now, updatedAt: now, is_pinned: false }, ...prev];
      }
      return updated.sort((a, b) => {
        if (a.is_pinned && !b.is_pinned) return -1;
        if (!a.is_pinned && b.is_pinned) return 1;
        return new Date(b.updatedAt) - new Date(a.updatedAt);
      });
    });
  }, []);

  const startNewChat = useCallback(() => {
    const id = uid();
    setCurrentSession(id);
    setMessages([]);
    setIsSidebarOpen(false);
  }, []);

  const loadConversation = useCallback((id) => {
    const conv = conversations.find(c => c.id === id);
    if (conv) {
      setCurrentSession(id);
      setMessages(conv.messages || []);
      setIsSidebarOpen(false);
    }
  }, [conversations]);

  const deleteConversation = useCallback((id, e) => {
    e?.stopPropagation();
    setConversations(prev => prev.filter(c => c.id !== id));
    if (id === currentSessionId) startNewChat();
    API.deleteConv(id);
    toast.info('Conversation deleted');
  }, [currentSessionId, startNewChat, toast]);

  const pinConversation = useCallback((id, e) => {
    e?.stopPropagation();
    setConversations(prev => prev.map(c =>
      c.id === id ? { ...c, is_pinned: !c.is_pinned } : c
    ).sort((a, b) => {
      if (a.is_pinned && !b.is_pinned) return -1;
      if (!a.is_pinned && b.is_pinned) return 1;
      return new Date(b.updatedAt) - new Date(a.updatedAt);
    }));
    API.pinConv(id);
    toast.info('Pin toggled');
  }, [toast]);

  const startRename = useCallback((id, currentTitle, e) => {
    e?.stopPropagation();
    setRenamingId(id);
    setRenameValue(currentTitle);
  }, []);

  const submitRename = useCallback((id) => {
    if (renameValue.trim()) {
      setConversations(prev => prev.map(c =>
        c.id === id ? { ...c, title: renameValue.trim() } : c
      ));
      API.renameConv(id, renameValue.trim());
      toast.success('Renamed!');
    }
    setRenamingId(null);
  }, [renameValue, toast]);

  const clearAllHistory = useCallback(() => {
    if (!window.confirm('Delete ALL conversations? This cannot be undone.')) return;
    setConversations([]);
    localStorage.removeItem('zypher_v2_conversations');
    startNewChat();
    API.clearAll();
    toast.info('All history cleared');
  }, [startNewChat, toast]);

  const exportChat = useCallback(() => {
    if (messages.length === 0) return;
    const text = messages.map(m => `[${m.sender === 'bot' ? 'Zypher' : 'You'}]\n${m.text}\n`).join('\n---\n\n');
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `zypher-chat-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Chat exported!');
  }, [messages, toast]);

  // ─── Send Message ─────────────────────────────────────
  const sendMessage = useCallback(async (messageText) => {
    if (!messageText.trim() || isLoading) return;

    const userMsg = {
      id: uid(), text: messageText, sender: 'user',
      timestamp: new Date().toISOString()
    };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    updateConversation(currentSessionId, newMessages);
    setIsLoading(true);

    try {
      const data = await API.chat(messageText, currentSessionId);
      const botMsg = {
        id: uid(),
        text: data.response,
        sender: 'bot',
        timestamp: data.timestamp,
        image_url: data.image_url || null,
        image_subject: data.image_subject || null,
        meta: { processingTime: data.processing_time }
      };
      if (data.model) setModelInfo(data.model);
      const updated = [...newMessages, botMsg];
      setMessages(updated);
      updateConversation(currentSessionId, updated);
      // Save to backend
      const conv = conversations.find(c => c.id === currentSessionId) || { id: currentSessionId, is_pinned: false };
      API.saveConv({ ...conv, id: currentSessionId, session_id: currentSessionId, messages: updated, title: generateTitle(messageText) });
    } catch (err) {
      const errMsg = {
        id: uid(),
        text: `**Oops!** ${err.message}. Thodi der baad try karo! 🙏`,
        sender: 'bot',
        timestamp: new Date().toISOString(),
        isError: true
      };
      const updated = [...newMessages, errMsg];
      setMessages(updated);
      updateConversation(currentSessionId, updated);
      toast.error(err.message || 'Request failed');
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, messages, currentSessionId, conversations, updateConversation, toast]);

  // ─── Regenerate ───────────────────────────────────────
  const handleRegenerate = useCallback(async () => {
    if (isLoading || messages.length < 2) return;
    // Find last user message
    const lastUserMsg = [...messages].reverse().find(m => m.sender === 'user');
    if (!lastUserMsg) return;

    // Remove last bot message
    const withoutLast = messages.slice(0, -1);
    setMessages(withoutLast);
    setIsLoading(true);

    try {
      const data = await API.regenerate(lastUserMsg.text, currentSessionId);
      const botMsg = {
        id: uid(), text: data.response, sender: 'bot',
        timestamp: data.timestamp, meta: { processingTime: data.processing_time }
      };
      const updated = [...withoutLast, botMsg];
      setMessages(updated);
      updateConversation(currentSessionId, updated);
    } catch (err) {
      toast.error('Regeneration failed');
      setMessages(messages);
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, messages, currentSessionId, updateConversation, toast]);

  // ─── Filtered Conversations ───────────────────────────
  const filteredConvs = searchQuery.trim()
    ? conversations.filter(c => c.title?.toLowerCase().includes(searchQuery.toLowerCase()))
    : conversations;

  const grouped = groupConversations(filteredConvs);

  // ─── Render ───────────────────────────────────────────
  return (
    <div className="layout" ref={layoutRef}>
      {/* Animated Background */}
      <div className="bg-canvas">
        <div className="orb orb-1" />
        <div className="orb orb-2" />
        <div className="orb orb-3" />
      </div>

      {/* Sidebar Overlay */}
      {isSidebarOpen && <div className="sidebar-overlay" onClick={() => setIsSidebarOpen(false)} />}

      {/* ── Sidebar ── */}
      <aside className={`sidebar ${isSidebarOpen ? 'open' : ''}`}>
        {/* Header */}
        <div className="sidebar-header">
          <div className="sidebar-brand">
            <img src="/zypher-logo.png" alt="Zypher AI" className="sidebar-logo" />
            <div className="sidebar-brand-text">
              <span className="sidebar-brand-name">Zypher AI</span>
              <span className="sidebar-brand-tag">Your AI Companion</span>
            </div>
            <button className="sidebar-close-btn" onClick={() => setIsSidebarOpen(false)} title="Close History">
              ✕
            </button>
          </div>
          <button className="new-chat-btn" onClick={startNewChat} title="New Chat (Ctrl+K)">
            <span>✦</span> New Chat
            <kbd style={{ fontSize: '0.6rem', opacity: 0.6, marginLeft: 'auto', background: 'rgba(255,255,255,0.08)', padding: '0.1rem 0.3rem', borderRadius: '3px', fontFamily: 'monospace' }}>⌘K</kbd>
          </button>
        </div>

        {/* Search */}
        <div className="sidebar-search-wrap">
          <div className="search-icon-wrap">
            <span className="search-icon">🔍</span>
            <input
              className="sidebar-search"
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Conversation List */}
        <div className="session-list">
          {filteredConvs.length === 0 ? (
            <div className="empty-history">
              <div className="empty-history-icon">💬</div>
              <div>{searchQuery ? 'No results found' : 'No conversations yet'}</div>
              <div style={{ fontSize: '0.72rem', marginTop: '0.25rem', color: 'var(--text-dim)' }}>
                Start a new chat above!
              </div>
            </div>
          ) : (
            Object.entries(grouped).map(([group, items]) =>
              items.length === 0 ? null : (
                <div key={group}>
                  <div className="session-group-label">{group}</div>
                  {items.map(conv => (
                    <div
                      key={conv.id}
                      className={`session-item ${conv.id === currentSessionId ? 'active' : ''} ${conv.is_pinned ? 'pinned' : ''}`}
                      onClick={() => renamingId !== conv.id && loadConversation(conv.id)}
                    >
                      <span className="session-icon">{conv.is_pinned ? '📌' : '💬'}</span>

                      {renamingId === conv.id ? (
                        <input
                          ref={renameInputRef}
                          className="session-rename-input"
                          value={renameValue}
                          onChange={e => setRenameValue(e.target.value)}
                          onKeyDown={e => {
                            if (e.key === 'Enter') submitRename(conv.id);
                            if (e.key === 'Escape') setRenamingId(null);
                          }}
                          onBlur={() => submitRename(conv.id)}
                          onClick={e => e.stopPropagation()}
                        />
                      ) : (
                        <span className="session-title">{conv.title || 'New Chat'}</span>
                      )}

                      <div className="session-actions">
                        <button className="session-action-btn" onClick={e => pinConversation(conv.id, e)} title={conv.is_pinned ? 'Unpin' : 'Pin'}>
                          {conv.is_pinned ? '📍' : '📌'}
                        </button>
                        <button className="session-action-btn" onClick={e => startRename(conv.id, conv.title || '', e)} title="Rename">
                          ✏️
                        </button>
                        <button className="session-action-btn" onClick={e => deleteConversation(conv.id, e)} title="Delete" style={{ color: '#f87171' }}>
                          🗑️
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )
            )
          )}
        </div>

        {/* Footer */}
        <div className="sidebar-footer">
          {messages.length > 0 && (
            <button className="new-chat-btn" style={{ marginBottom: '0.5rem', borderColor: 'rgba(16,185,129,0.3)', color: 'var(--emerald)' }} onClick={exportChat}>
              📄 Export Chat
            </button>
          )}
          {conversations.length > 0 && (
            <button className="clear-all-btn" onClick={clearAllHistory}>
              🗑️ Clear All History
            </button>
          )}
          <div className="user-profile">
            <div className="avatar">Z</div>
            <div className="user-info">
              <div className="user-name">Zypher User</div>
              <div className="user-status">● Online</div>
            </div>
          </div>
        </div>
      </aside>

      {/* ── Main Content ── */}
      <main className="app">
        {/* History Toggle */}
        {!isSidebarOpen && (
          <div ref={historyBtnRef} className="history-toggle-wrap">
            <button
              className="history-toggle"
              onClick={e => { e.stopPropagation(); setIsSidebarOpen(v => !v); }}
              aria-label="Toggle history"
            >
              <span className="history-toggle-icon">☰</span>
              <span>History</span>
              {conversations.length > 0 && (
                <span style={{
                  background: 'var(--cyan)', color: '#000', borderRadius: '999px',
                  fontSize: '0.6rem', fontWeight: 800, padding: '0.1rem 0.4rem', marginLeft: '0.25rem'
                }}>
                  {conversations.length}
                </span>
              )}
            </button>
          </div>
        )}

        <div className="chat-container">
          <div className="messages-container">
            {/* Welcome Screen */}
            {messages.length === 0 && (
              <div className="welcome-screen">
                <div className="welcome-hero">
                  <div className="hero-logo-wrap">
                    <img src="/zypher-logo.png" alt="Zypher AI" className="hero-logo" />
                    <div className="hero-logo-ring" />
                    <div className="hero-logo-ring-2" />
                  </div>
                  <h1>Hey! Main Zypher Hoon 👋</h1>
                  <p>Your intelligent companion — ask me anything in English, <strong>हिंदी</strong>, or Hinglish!</p>
                  <span className="welcome-lang-badge">🌐 Speaks EN · HI · Hinglish · and more</span>
                </div>

                <div className="suggestion-grid">
                  {SUGGESTIONS.map((s, i) => (
                    <div key={i} className="suggestion-card" onClick={() => sendMessage(s.prompt)}>
                      <span className="suggestion-card-emoji">{s.emoji}</span>
                      <h3>{s.title}</h3>
                      <p>{s.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Messages */}
            {messages.map((msg, idx) => (
              <ChatMessage
                key={msg.id}
                message={msg}
                onRegenerate={
                  msg.sender === 'bot' && idx === messages.length - 1
                    ? handleRegenerate
                    : null
                }
              />
            ))}

            {/* Typing Indicator */}
            {isLoading && (
              <div className="message-wrapper bot typing-row">
                <div className="avatar-small" style={{
                  background: 'linear-gradient(135deg, rgba(0,212,255,0.15), rgba(168,85,247,0.15))',
                  border: '1px solid rgba(0,212,255,0.2)', borderRadius: '10px',
                  width: 34, height: 34, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem'
                }}>⚡</div>
                <div className="bot-typing">
                  <div className="typing-dot" />
                  <div className="typing-dot" />
                  <div className="typing-dot" />
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="input-area">
            <ChatInput onSendMessage={sendMessage} isLoading={isLoading} />
            <p className="input-footer">Zypher AI can make mistakes. Always verify important information.</p>
          </div>
        </div>
      </main>

      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </div>
  );
}
