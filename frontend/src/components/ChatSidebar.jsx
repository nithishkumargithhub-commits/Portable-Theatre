import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, Trash2, Smile, Send } from 'lucide-react';
import { useParty } from '../context/PartyContext';
import { useAuth } from '../context/AuthContext';
import { UserAvatar } from './ui/UserAvatar';

const REACTION_EMOJIS = ['❤️', '😂', '😭', '🔥', '👏', '😱', '💀', '🍿', '🚀'];

const REACTION_COUNTERS = [
  { emoji: '😭', count: 3 },
  { emoji: '❤️', count: 5 },
  { emoji: '🔥', count: 2 },
  { emoji: '👏', count: 1 }
];

export function ChatSidebar() {
  const { chatMessages, sendChatMessage, sendReaction } = useParty();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('chat');
  const [inputText, setInputText] = useState('');
  const chatEndRef = useRef(null);

  const defaultMessages = [
    {
      id: 'm1',
      username: 'Alex',
      user_id: 'alex_user',
      message: 'This scene gives me chills every time 😭',
      created_at: '9:41 PM'
    },
    {
      id: 'm2',
      username: 'You',
      user_id: user?.id || 'you_user',
      message: 'Same here... absolutely incredible 🔥',
      created_at: '9:42 PM'
    },
    {
      id: 'm3',
      username: 'Alex',
      user_id: 'alex_user',
      message: 'The soundtrack + this view = perfection ❤️',
      created_at: '9:42 PM'
    }
  ];

  const displayMessages = chatMessages.length > 0 ? chatMessages : defaultMessages;

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [displayMessages]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    sendChatMessage(inputText.trim());
    setInputText('');
  };

  return (
    <div className="w-full bg-[#0b0c14]/90 backdrop-blur-md rounded-2xl border border-slate-800/80 shadow-cinema overflow-hidden flex flex-col">

      {/* ── TOP HEADER BAR ───────────────────────────────────── */}
      <div className="px-5 py-3 border-b border-slate-800/80 flex items-center justify-between gap-4">
        {/* Left Tabs: Chat & Reactions */}
        <div className="flex items-center gap-6">
          <button
            onClick={() => setActiveTab('chat')}
            className={`flex items-center gap-2 pb-1 text-xs font-bold transition-all relative ${
              activeTab === 'chat' ? 'text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            <MessageSquare className="w-4 h-4 text-purple-400" />
            <span>Chat</span>
            {activeTab === 'chat' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-500 rounded-full" />
            )}
          </button>

          <button
            onClick={() => setActiveTab('reactions')}
            className={`flex items-center gap-2 pb-1 text-xs font-bold transition-all relative ${
              activeTab === 'reactions' ? 'text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            <span className="text-sm">✨</span>
            <span>Reactions</span>
            {activeTab === 'reactions' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-500 rounded-full" />
            )}
          </button>
        </div>

        {/* Right: Clear Chat Button */}
        <button
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-400 hover:text-white bg-slate-900/80 hover:bg-slate-800 border border-slate-800 rounded-lg transition-all"
        >
          <Trash2 className="w-3.5 h-3.5" /> Clear Chat
        </button>
      </div>

      {/* ── REACTION EMOJIS BAR ──────────────────────────────── */}
      <div className="px-4 py-2 border-b border-slate-800/40 bg-slate-950/40 flex items-center gap-2 overflow-x-auto shrink-0">
        {REACTION_EMOJIS.map((emoji, idx) => (
          <button
            key={idx}
            onClick={() => sendReaction(emoji)}
            title={`React with ${emoji}`}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-base hover:bg-purple-600/30 hover:scale-125 transition-all shrink-0"
          >
            {emoji}
          </button>
        ))}
      </div>

      {/* ── CHAT MESSAGES + REACTION COUNTERS ───────────────── */}
      <div className="relative p-5 min-h-[220px] max-h-[280px] overflow-y-auto flex items-start justify-between gap-4 custom-scrollbar">
        
        {/* Left: Chat Messages List */}
        <div className="flex-1 space-y-4">
          {displayMessages.map((msg, idx) => {
            const isMe = msg.user_id === user?.id || msg.username === 'You';
            return (
              <div key={msg.id || idx} className="flex items-start gap-3">
                <UserAvatar
                  username={msg.username}
                  size="sm"
                  className="shrink-0 mt-0.5"
                />
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-200">
                      {isMe ? 'You' : msg.username}
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono">
                      {msg.created_at || '9:42 PM'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 font-normal leading-relaxed">
                    {msg.message}
                  </p>
                </div>
              </div>
            );
          })}
          <div ref={chatEndRef} />
        </div>

        {/* Right Edge: Stacked Reaction Counter Badges */}
        <div className="hidden sm:flex flex-col gap-2 shrink-0 self-center">
          {REACTION_COUNTERS.map((item, idx) => (
            <button
              key={idx}
              onClick={() => sendReaction(item.emoji)}
              title={`React with ${item.emoji}`}
              className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-900/90 border border-slate-800 rounded-full text-xs font-semibold text-slate-300 hover:border-purple-500/50 transition-all shadow-sm"
            >
              <span>{item.emoji}</span>
              <span className="text-[11px] font-mono text-slate-400">{item.count}</span>
            </button>
          ))}
        </div>

      </div>

      {/* ── BOTTOM INPUT BAR ────────────────────────────────── */}
      <form onSubmit={handleSubmit} className="p-4 border-t border-slate-800/80 flex items-center gap-3">
        <div className="relative flex-1 flex items-center">
          <input
            type="text"
            placeholder="Type a message…"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            className="w-full bg-[#08090f] border border-purple-500/50 focus:border-purple-400 rounded-2xl px-4 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-purple-500/30 transition-all pr-10"
          />
          <button
            type="button"
            className="absolute right-3 text-slate-400 hover:text-slate-200 transition-colors"
          >
            <Smile className="w-4 h-4" />
          </button>
        </div>

        <button
          type="submit"
          disabled={!inputText.trim()}
          className="w-10 h-10 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-40 disabled:cursor-not-allowed text-white flex items-center justify-center transition-all shadow-glow-purple shrink-0 active:scale-95"
          title="Send Message"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>

    </div>
  );
}
