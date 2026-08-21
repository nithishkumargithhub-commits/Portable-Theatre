import React, { useState } from 'react';
import { Film, Plus, Code, LogOut, Clock, Shield, Lock, ChevronRight, Clapperboard } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useParty } from '../context/PartyContext';
import { UserAvatar } from './ui/UserAvatar';

export function Navbar({ onOpenCreateModal, onJoinByCode, onNavigateToHistory, onNavigateToAdmin, onOpenAuthModal }) {
  const { user, logout, isAdmin } = useAuth();
  const { currentParty, leaveParty } = useParty();
  const [inputCode, setInputCode] = useState('');
  const [isFocused, setIsFocused] = useState(false);

  const handleJoinSubmit = (e) => {
    e.preventDefault();
    if (inputCode.trim()) {
      onJoinByCode(inputCode.trim().toUpperCase());
      setInputCode('');
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full navbar-blur px-4 lg:px-8 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">

        {/* Brand */}
        <div
          className="flex items-center gap-3 cursor-pointer group shrink-0"
          onClick={() => currentParty && leaveParty()}
          title={currentParty ? 'Leave party & return to lobby' : 'Portable Theatre'}
        >
          <div className="relative">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-600 via-violet-600 to-pink-500 flex items-center justify-center shadow-lg shadow-indigo-600/30 group-hover:shadow-indigo-500/50 transition-shadow">
              <Clapperboard className="w-4.5 h-4.5 text-white" size={18} />
            </div>
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-background" />
          </div>
          <div className="hidden sm:block">
            <div className="flex items-center gap-2">
              <h1 className="font-black text-sm tracking-tight text-white leading-none">
                PORTABLE THEATRE
              </h1>
              <span className="text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                PRO
              </span>
            </div>
            <p className="text-[10px] text-slate-500 font-medium mt-0.5">Synchronized Party Streaming</p>
          </div>
        </div>

        {/* Join code bar — hidden on mobile */}
        <form
          onSubmit={handleJoinSubmit}
          className={`hidden md:flex items-center gap-2 bg-surface border rounded-xl px-3 py-2 transition-all duration-200 ${isFocused ? 'border-indigo-500/60 shadow-glow-sm bg-surface-light' : 'border-slate-700/50'}`}
        >
          <Code className="w-3.5 h-3.5 text-slate-500 shrink-0" />
          <input
            type="text"
            placeholder="Room code…"
            value={inputCode}
            onChange={(e) => setInputCode(e.target.value.toUpperCase())}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            maxLength={12}
            className="bg-transparent text-xs text-slate-100 placeholder-slate-600 focus:outline-none w-28 font-mono tracking-widest"
            aria-label="Enter room invite code"
          />
          <button
            type="submit"
            className="text-xs font-semibold px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors flex items-center gap-1"
          >
            Join <ChevronRight className="w-3 h-3" />
          </button>
        </form>

        {/* Right actions */}
        <div className="flex items-center gap-2">

          {currentParty && (
            <button
              onClick={leaveParty}
              className="hidden sm:flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition-all"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden lg:inline">Leave</span>
            </button>
          )}

          {isAdmin && (
            <button
              onClick={onNavigateToAdmin}
              className="badge-gold gap-1.5 px-3 py-1.5 cursor-pointer hover:bg-amber-500/25 transition-colors"
              title="Admin Dashboard"
            >
              <Shield className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Admin</span>
            </button>
          )}

          {user && (
            <button
              onClick={onNavigateToHistory}
              className="hidden sm:flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg bg-surface hover:bg-surface-light text-slate-300 hover:text-white border border-slate-700/50 transition-all"
              title="Watch History"
            >
              <Clock className="w-3.5 h-3.5 text-indigo-400" />
              <span className="hidden lg:inline">History</span>
            </button>
          )}

          <button
            onClick={onOpenCreateModal}
            className="btn-primary text-xs px-4 py-2"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Create Party</span>
            <span className="sm:hidden">Create</span>
          </button>

          {/* User profile */}
          {user ? (
            <div className="flex items-center gap-2 pl-2 border-l border-slate-800">
              <UserAvatar username={user.username} avatarUrl={user.avatar_url} size="sm" showRing />
              <div className="hidden lg:block text-left">
                <p className="text-xs font-semibold text-slate-200 leading-tight">{user.username}</p>
                <p className="text-[10px] text-indigo-400 font-medium">{isAdmin ? '⭐ Admin' : 'Viewer'}</p>
              </div>
              <button
                onClick={logout}
                className="p-1.5 rounded-lg hover:bg-red-500/15 text-slate-500 hover:text-red-300 transition-colors"
                title="Sign Out"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={onOpenAuthModal}
              className="btn-ghost text-xs px-4 py-2 border-indigo-500/30 text-indigo-300 hover:text-white hover:bg-indigo-600 hover:border-indigo-500"
            >
              <Lock className="w-3.5 h-3.5" /> Sign In
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
