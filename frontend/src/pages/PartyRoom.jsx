import React, { useState } from 'react';
import { ArrowLeft, Crown, MoreVertical, Check, Share2, Film, LogOut, Sparkles, Volume2, Shield } from 'lucide-react';
import { useParty } from '../context/PartyContext';
import { useAuth } from '../context/AuthContext';
import { useWebRTCCamera } from '../hooks/useWebRTCCamera';
import { socketManager } from '../services/socket';
import { VideoPlayer } from '../components/VideoPlayer';
import { CameraGrid } from '../components/CameraGrid';
import { ChatSidebar } from '../components/ChatSidebar';

export function PartyRoom() {
  const { currentParty, participants, isHost, leaveParty } = useParty();
  const { user } = useAuth();
  const [copied, setCopied] = useState(false);

  const cameraHook = useWebRTCCamera(
    currentParty?.id,
    user?.id,
    user?.username,
    socketManager
  );

  if (!currentParty) return null;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(currentParty.invite_code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleToggleCamera = () => {
    if (cameraHook.isCameraEnabled) {
      cameraHook.stopCamera();
    } else {
      cameraHook.startCamera();
    }
  };

  return (
    <div className="max-w-[1440px] mx-auto space-y-4 pb-12 page-enter text-slate-100 font-sans">

      {/* ── TOP CINEMA HEADER BAR ─────────────────────────────────── */}
      <div className="px-5 py-3.5 bg-cinema-900/90 backdrop-blur-2xl rounded-3xl border border-white/[0.08] flex items-center justify-between gap-3 shadow-cinema">
        
        {/* Left: Exit/Leave Party + Title + Watching Pill */}
        <div className="flex items-center gap-3.5 min-w-0">
          <button
            onClick={leaveParty}
            className="flex items-center gap-2 px-4 py-2 bg-cinema-850 hover:bg-cinema-700 text-slate-200 border border-slate-800 rounded-2xl text-xs font-bold transition-all shrink-0 active:scale-95 shadow-sm"
            title="Leave Party"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-indigo-400" />
            <span className="hidden sm:inline">Leave Theatre</span>
          </button>

          <div className="flex items-center gap-2.5 min-w-0">
            <h2 className="text-base sm:text-lg font-black font-display text-white truncate drop-shadow-md flex items-center gap-2">
              <span>🍿 {currentParty.title || 'Movie Night'}</span>
            </h2>

            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 bg-indigo-950/60 border border-indigo-500/30 rounded-full text-xs font-bold text-indigo-300 shrink-0">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>{participants.length || 3} Cinephiles</span>
            </div>
          </div>
        </div>

        {/* Right: Sync Status + Host Badge + Invite Code Copy */}
        <div className="flex items-center gap-2.5 shrink-0">
          
          {/* Sync Status Badge */}
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 rounded-full text-xs font-bold shadow-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
            <span>&lt; 20ms Drift</span>
          </div>

          {isHost && (
            <div className="hidden md:flex items-center gap-1.5 px-3 py-1 bg-amber-950/80 border border-amber-500/40 text-amber-300 rounded-full text-xs font-bold shadow-sm">
              <Crown className="w-3.5 h-3.5 text-amber-400" />
              <span>Host Control</span>
            </div>
          )}

          {/* Copy Invite Code Pill */}
          <button
            onClick={handleCopyCode}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-2xl bg-indigo-600/20 hover:bg-indigo-600/35 border border-indigo-500/40 text-indigo-200 text-xs font-mono font-bold tracking-widest transition-all active:scale-95 shadow-sm"
            title="Copy room invite code"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-300">COPIED</span>
              </>
            ) : (
              <>
                <Share2 className="w-3.5 h-3.5 text-indigo-400" />
                <span>CODE: {currentParty.invite_code}</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* ── TOP SECTION: Movie Player (Left) & Camera Grid (Right) ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch relative">
        
        {/* Soft Reactive Theatre Ambilight Backlight */}
        <div className="ambilight-glow" />

        {/* Left Column: Movie Player (62% width) */}
        <div className="lg:col-span-7 flex flex-col min-h-0">
          <VideoPlayer />
        </div>

        {/* Right Column: Camera Panel (38% width, matching player height) */}
        <div className="lg:col-span-5 flex flex-col min-h-0">
          <CameraGrid
            {...cameraHook}
            onToggleCamera={handleToggleCamera}
            onToggleAudio={cameraHook.toggleAudioMute}
          />
        </div>
      </div>

      {/* ── BOTTOM SECTION: Full-Width Chat & Reactions Panel ────── */}
      <div className="w-full">
        <ChatSidebar />
      </div>

    </div>
  );
}
