import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { PartyProvider, useParty } from './context/PartyContext';
import { ToastProvider } from './components/ui/ToastContainer';
import { AmbianceProvider, useAmbiance } from './context/AmbianceContext';
import { Navbar } from './components/Navbar';
import { Lobby } from './pages/Lobby';
import { PartyRoom } from './pages/PartyRoom';
import { UserHistoryPage } from './pages/UserHistoryPage';
import { AdminDashboard } from './pages/AdminDashboard';
import { CreatePartyModal } from './components/CreatePartyModal';
import { AuthModal } from './components/AuthModal';
import { fetchParties } from './services/api';
import { Clapperboard, Sparkles, Radio, Shield, Heart } from 'lucide-react';

function MainApp() {
  const { currentParty, joinParty } = useParty();
  const { isAdmin } = useAuth();
  const { currentPreset, lightsDimmed } = useAmbiance();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [activeTab, setActiveTab] = useState('main'); // 'main' | 'history' | 'admin'

  const handleJoinByCode = async (code) => {
    try {
      const parties = await fetchParties();
      const match = parties.find(p => p.invite_code.toUpperCase() === code.toUpperCase());
      if (match) {
        joinParty(match);
        setActiveTab('main');
      } else {
        alert(`Room with code "${code}" not found. Creating a new party room with this code!`);
        joinParty({
          id: "room_" + code.toLowerCase(),
          host_id: "user_host",
          title: `🍿 Party Room (${code})`,
          description: "Joined via room invite code",
          invite_code: code.toUpperCase(),
          status: "active",
          video_url: "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8",
          video_title: "Big Buck Bunny 4K (HLS)"
        });
        setActiveTab('main');
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className={`min-h-screen flex flex-col bg-[#030408] text-slate-100 selection:bg-amber-500/40 selection:text-amber-100 transition-colors duration-700 ${lightsDimmed ? 'brightness-75 contrast-110' : ''}`}>
      
      {/* Dynamic Background Ambient Projection Spotlight */}
      <div 
        className="fixed top-0 left-1/2 -translate-x-1/2 w-[800px] h-[350px] rounded-full blur-[140px] pointer-events-none -z-10 transition-all duration-700 opacity-40"
        style={{ background: currentPreset.glowColor }}
      />

      <Navbar
        onOpenCreateModal={() => { setShowCreateModal(true); setActiveTab('main'); }}
        onJoinByCode={handleJoinByCode}
        onNavigateToHistory={() => setActiveTab('history')}
        onNavigateToAdmin={() => setActiveTab('admin')}
        onOpenAuthModal={() => setShowAuthModal(true)}
      />

      <main className="flex-1 pt-20 sm:pt-24 p-4 lg:p-8 max-w-7xl mx-auto w-full">
        {activeTab === 'history' ? (
          <UserHistoryPage onBackToLobby={() => setActiveTab('main')} />
        ) : activeTab === 'admin' && isAdmin ? (
          <AdminDashboard onBackToLobby={() => setActiveTab('main')} />
        ) : currentParty ? (
          <PartyRoom />
        ) : (
          <Lobby
            onOpenCreateModal={() => setShowCreateModal(true)}
            onJoinByCode={handleJoinByCode}
          />
        )}
      </main>

      <CreatePartyModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
      />

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
      />

      {/* ── LUXURY CINEMA FOOTER ────────────────────────────────────── */}
      <footer className="border-t border-white/[0.06] bg-[#05060d]/90 backdrop-blur-xl py-8 mt-12 text-xs text-slate-400">
        <div className="max-w-7xl mx-auto px-4 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
          
          <div className="flex items-center gap-3">
            <img
              src="/logo.png"
              alt="Portable Theatre Logo"
              className="h-9 w-auto object-contain rounded-lg drop-shadow-md"
            />
            <div>
              <p className="font-display font-bold text-white text-sm tracking-tight flex items-center gap-1.5">
                PORTABLE THEATRE <span className="text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">PRO</span>
              </p>
              <p className="text-[11px] text-slate-500">Ultra-low latency cinema synchronization platform</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4 text-xs font-semibold">
            <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950/60 border border-emerald-500/30 text-emerald-300">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
              Sync Engine 99.98%
            </span>
            <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-950/60 border border-amber-500/30 text-amber-300">
              <Sparkles className="w-3 h-3 text-amber-400" />
              Dolby Vision / 4K Matrix
            </span>
            <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-950/60 border border-rose-500/30 text-rose-300">
              <Radio className="w-3 h-3 text-rose-400" />
              P2P WebRTC Active
            </span>
          </div>

          <p className="text-slate-500 text-[11px] text-center md:text-right">
            Portable Theatre &copy; 2026. Made for movie lovers worldwide.
          </p>

        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <PartyProvider>
        <AmbianceProvider>
          <ToastProvider>
            <MainApp />
          </ToastProvider>
        </AmbianceProvider>
      </PartyProvider>
    </AuthProvider>
  );
}
