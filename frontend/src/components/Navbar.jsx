import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, Plus, LogOut, Clock, Shield, Lock, ChevronDown, 
  Film, ArrowRight, X
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useParty } from '../context/PartyContext';
import { UserAvatar } from './ui/UserAvatar';

const NAV_LINKS = [
  { id: 'home', label: 'Home' },
  { id: 'screen', label: 'Share Screen' },
];

export function Navbar({ onOpenCreateModal, onJoinByCode, onNavigateToHistory, onNavigateToAdmin, onOpenAuthModal }) {
  const { user, logout, isAdmin } = useAuth();
  const { currentParty, leaveParty } = useParty();

  const [inputCode, setInputCode] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [activeNav, setActiveNav] = useState('home');
  
  // Auto-hide & cursor-hover reveal state
  const [isVisible, setIsVisible] = useState(true);
  const [isHovered, setIsHovered] = useState(false);
  const hideTimeoutRef = useRef(null);

  // Scroll detection
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 30) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Global mouse position detection to reveal navbar when cursor moves to top
  useEffect(() => {
    const handleMouseMove = (e) => {
      // If cursor is in the top 85px of the screen, reveal navbar
      if (e.clientY <= 85) {
        setIsVisible(true);
        if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
      } else if (!isHovered && !searchOpen && !profileOpen) {
        // If cursor moves away, auto-hide after 1.5 seconds if scrolled
        if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
        hideTimeoutRef.current = setTimeout(() => {
          setIsVisible(false);
        }, 1500);
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
    };
  }, [isHovered, searchOpen, profileOpen]);

  const handleJoinSubmit = (e) => {
    e.preventDefault();
    if (inputCode.trim()) {
      onJoinByCode(inputCode.trim().toUpperCase());
      setInputCode('');
      setSearchOpen(false);
    }
  };

  const handleNavClick = (id) => {
    setActiveNav(id);
    if (id === 'home' && currentParty) {
      leaveParty();
    } else if (id === 'screen' && !currentParty) {
      onOpenCreateModal();
    }
  };

  // Determine if navbar is revealed
  const shouldShow = isVisible || isHovered || searchOpen || profileOpen;

  return (
    <>
      {/* ── INVISIBLE TOP CURSOR SENSOR (Triggers reveal when hovering top screen edge) ── */}
      <div 
        className="fixed top-0 left-0 right-0 h-8 z-40 pointer-events-auto"
        onMouseEnter={() => {
          setIsVisible(true);
          if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
        }}
      />

      {/* ── FLOATING CINEMA TITLE BAR ─────────────────────────────────────── */}
      <header 
        onMouseEnter={() => {
          setIsHovered(true);
          setIsVisible(true);
          if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
        }}
        onMouseLeave={() => {
          setIsHovered(false);
          if (!searchOpen && !profileOpen) {
            hideTimeoutRef.current = setTimeout(() => setIsVisible(false), 1200);
          }
        }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-400 ease-out select-none ${
          shouldShow 
            ? 'translate-y-0 opacity-100 pointer-events-auto' 
            : '-translate-y-full opacity-0 pointer-events-none'
        } ${
          isScrolled 
            ? 'bg-[#06070d]/95 backdrop-blur-2xl border-b border-white/[0.08] shadow-[0_12px_40px_rgba(0,0,0,0.85)] py-3' 
            : 'bg-gradient-to-b from-black/95 via-black/60 to-transparent py-4 sm:py-5'
        }`}
      >
        <div className="max-w-[1480px] mx-auto px-4 sm:px-8 lg:px-12 flex items-center justify-between gap-4">

          {/* ── LEFT: BRANDING & NAV LINKS ───────────────────────────────── */}
          <div className="flex items-center gap-6 lg:gap-10 shrink-0">
            
            {/* Brand Signature with New Logo */}
            <div
              className="flex items-center gap-3 cursor-pointer group select-none py-1"
              onClick={() => currentParty ? leaveParty() : handleNavClick('home')}
              title="Portable Theatre — Home"
            >
              <div className="relative">
                <img
                  src="/logo.png"
                  alt="Portable Theatre Logo"
                  className="h-10 sm:h-12 w-auto object-contain drop-shadow-[0_4px_20px_rgba(59,130,246,0.4)] group-hover:scale-105 transition-transform duration-300 rounded-lg"
                />
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-black animate-pulse" />
              </div>
            </div>

            {/* Navigation Tabs: Home & Share Screen */}
            <nav className="flex items-center gap-1 lg:gap-2">
              {NAV_LINKS.map((link) => (
                <button
                  key={link.id}
                  onClick={() => handleNavClick(link.id)}
                  className={`relative px-3.5 py-1.5 text-xs lg:text-sm font-semibold transition-all duration-200 rounded-lg flex items-center gap-1.5 ${
                    activeNav === link.id
                      ? 'text-white font-bold'
                      : 'text-slate-300 hover:text-white hover:bg-white/[0.06]'
                  }`}
                >
                  <span>{link.label}</span>
                  {activeNav === link.id && (
                    <span className="absolute -bottom-1.5 left-3.5 right-3.5 h-0.5 bg-red-500 rounded-full shadow-[0_0_8px_rgba(229,9,20,0.8)]" />
                  )}
                </button>
              ))}
            </nav>

          </div>

          {/* ── RIGHT: SEARCH / ROOM CODE, HOST CTA & USER PROFILE ───────── */}
          <div className="flex items-center gap-3 sm:gap-4">

            {/* Expanding Search & Room Code Pill */}
            <div className="relative flex items-center">
              {searchOpen ? (
                <form 
                  onSubmit={handleJoinSubmit}
                  className="flex items-center gap-2 bg-[#121524]/90 backdrop-blur-xl border border-white/20 rounded-full px-3.5 py-1.5 shadow-2xl transition-all duration-300 animate-scale-in"
                >
                  <Search className="w-4 h-4 text-slate-400 shrink-0" />
                  <input
                    type="text"
                    autoFocus
                    placeholder="Enter room code or search..."
                    value={inputCode}
                    onChange={(e) => setInputCode(e.target.value.toUpperCase())}
                    className="bg-transparent text-xs text-white placeholder-slate-400 focus:outline-none w-44 sm:w-64 font-mono font-medium"
                  />
                  {inputCode.trim() && (
                    <button 
                      type="submit"
                      className="p-1 rounded-full bg-red-600 hover:bg-red-500 text-white transition-colors"
                      title="Join Room"
                    >
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setSearchOpen(false)}
                    className="p-1 rounded-full hover:bg-white/10 text-slate-400 hover:text-white"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </form>
              ) : (
                <button
                  onClick={() => setSearchOpen(true)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.07] hover:bg-white/[0.12] border border-white/10 text-slate-300 hover:text-white text-xs font-semibold transition-all"
                  title="Search or Join Room Code"
                >
                  <Search className="w-3.5 h-3.5 text-slate-300" />
                  <span className="hidden sm:inline text-slate-400">Join by Code</span>
                </button>
              )}
            </div>

            {/* If in party: Leave button */}
            {currentParty && (
              <button
                onClick={leaveParty}
                className="flex items-center gap-1.5 text-xs font-bold px-3.5 py-1.5 rounded-full bg-red-600/20 text-red-400 border border-red-500/30 hover:bg-red-600 hover:text-white transition-all shadow-sm"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Leave Room</span>
              </button>
            )}

            {/* Watch History Shortcut */}
            {user && (
              <button
                onClick={onNavigateToHistory}
                className="p-2 rounded-full text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
                title="Watch History"
              >
                <Clock className="w-4 h-4" />
              </button>
            )}

            {/* Admin Portal */}
            {isAdmin && (
              <button
                onClick={onNavigateToAdmin}
                className="flex items-center gap-1 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-bold hover:bg-amber-500/30 transition-all shadow-sm"
                title="Admin Dashboard"
              >
                <Shield className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden sm:inline">Admin</span>
              </button>
            )}

            {/* Host Party Button */}
            <button
              onClick={onOpenCreateModal}
              className="flex items-center gap-2 px-4 sm:px-5 py-2 rounded-full font-bold text-xs sm:text-sm text-white bg-gradient-to-r from-[#e50914] via-[#ff1e38] to-[#b3001e] hover:brightness-110 shadow-[0_0_20px_rgba(229,9,20,0.45)] hover:shadow-[0_0_30px_rgba(229,9,20,0.65)] border border-white/20 transition-all transform active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Host Party</span>
            </button>

            {/* User Profile Dropdown */}
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setProfileOpen(!profileOpen)}
                  className="flex items-center gap-1.5 p-0.5 rounded-xl hover:ring-2 hover:ring-white/30 transition-all"
                >
                  <UserAvatar username={user.username} avatarUrl={user.avatar_url} size="sm" showRing />
                  <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${profileOpen ? 'rotate-180' : ''}`} />
                </button>

                {profileOpen && (
                  <div 
                    className="absolute right-0 top-full mt-2 w-56 bg-[#0c0e18]/95 backdrop-blur-2xl rounded-2xl border border-white/10 shadow-2xl p-2 z-50 animate-scale-in"
                    onMouseLeave={() => setProfileOpen(false)}
                  >
                    <div className="px-3 py-2.5 border-b border-white/10 flex items-center gap-3">
                      <UserAvatar username={user.username} avatarUrl={user.avatar_url} size="md" />
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-white truncate">{user.username}</p>
                        <p className="text-[10px] text-red-400 font-semibold">{isAdmin ? '⭐ Executive Admin' : '🎬 VIP Cinephile'}</p>
                      </div>
                    </div>

                    <div className="py-1 space-y-0.5">
                      <button
                        onClick={() => { onNavigateToHistory(); setProfileOpen(false); }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
                      >
                        <Clock className="w-3.5 h-3.5 text-indigo-400" />
                        <span>Watch History</span>
                      </button>

                      {isAdmin && (
                        <button
                          onClick={() => { onNavigateToAdmin(); setProfileOpen(false); }}
                          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
                        >
                          <Shield className="w-3.5 h-3.5 text-amber-400" />
                          <span>Admin Control Center</span>
                        </button>
                      )}
                    </div>

                    <div className="pt-1 border-t border-white/10">
                      <button
                        onClick={() => { logout(); setProfileOpen(false); }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-red-400 hover:bg-red-500/10 transition-colors"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>Sign Out of Theatre</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={onOpenAuthModal}
                className="px-4 py-1.5 rounded-full text-xs font-bold text-white bg-white/10 hover:bg-white/20 border border-white/15 transition-all"
              >
                Sign In
              </button>
            )}

          </div>

        </div>
      </header>
    </>
  );
}
