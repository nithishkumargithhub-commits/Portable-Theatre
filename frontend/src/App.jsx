import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { PartyProvider, useParty } from './context/PartyContext';
import { ToastProvider } from './components/ui/ToastContainer';
import { Navbar } from './components/Navbar';
import { Lobby } from './pages/Lobby';
import { PartyRoom } from './pages/PartyRoom';
import { UserHistoryPage } from './pages/UserHistoryPage';
import { AdminDashboard } from './pages/AdminDashboard';
import { CreatePartyModal } from './components/CreatePartyModal';
import { AuthModal } from './components/AuthModal';
import { fetchParties } from './services/api';

function MainApp() {
  const { currentParty, joinParty } = useParty();
  const { isAdmin } = useAuth();
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
    <div className="min-h-screen flex flex-col bg-background text-slate-100 selection:bg-indigo-500 selection:text-white">
      <Navbar
        onOpenCreateModal={() => { setShowCreateModal(true); setActiveTab('main'); }}
        onJoinByCode={handleJoinByCode}
        onNavigateToHistory={() => setActiveTab('history')}
        onNavigateToAdmin={() => setActiveTab('admin')}
        onOpenAuthModal={() => setShowAuthModal(true)}
      />

      <main className="flex-1 p-4 lg:p-8 max-w-7xl mx-auto w-full">
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

      {/* Subtle Footer */}
      <footer className="border-t border-slate-900 py-6 text-center text-xs text-slate-500">
        <p>Portable Theatre &copy; 2026 — Real-Time Synchronized Video Streaming & WebRTC Screen Sharing Engine</p>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <PartyProvider>
        <ToastProvider>
          <MainApp />
        </ToastProvider>
      </PartyProvider>
    </AuthProvider>
  );
}
