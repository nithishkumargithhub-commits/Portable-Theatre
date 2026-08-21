import React, { useState } from 'react';
import { ArrowLeft, Crown, MoreVertical, Check, Share2, Film, LogOut } from 'lucide-react';
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
    <div className="max-w-[1440px] mx-auto space-y-4 pb-8 page-enter text-slate-100 font-sans">

      {/* ── TOP HEADER BAR (Matching Screenshot) ────────────────── */}
      <div className="px-4 py-3 bg-[#0b0c14]/90 backdrop-blur-md rounded-2xl border border-slate-800/80 flex items-center justify-between gap-3 shadow-cinema">
        {/* Left: Exit/Leave Party + Title + Watching Pill */}
        <div className="flex items-center gap-3.5 min-w-0">
          <button
            onClick={leaveParty}
            className="flex items-center gap-2 px-3.5 py-1.5 bg-slate-900/90 hover:bg-slate-800 text-slate-200 border border-slate-800 rounded-xl text-xs font-semibold transition-all shrink-0"
            title="Leave Party"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Leave Party
          </button>

          <h2 className="text-base font-bold text-white truncate drop-shadow-sm flex items-center gap-2">
            {currentParty.title || 'Movie Night'} 🍿
          </h2>

          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 bg-slate-900/90 border border-slate-800/80 rounded-full text-xs font-medium text-slate-300 shrink-0">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>{participants.length || 2} watching</span>
          </div>
        </div>

        {/* Right: Sync Status + Host Badge + More Menu */}
        <div className="flex items-center gap-2.5 shrink-0">
          <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-950/60 border border-emerald-500/30 text-emerald-400 rounded-full text-xs font-semibold">
            <span>Sync: On</span>
          </div>

          {isHost && (
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 bg-amber-950/60 border border-amber-500/30 text-amber-300 rounded-full text-xs font-semibold">
              <Crown className="w-3.5 h-3.5 text-amber-400" /> You are the host
            </div>
          )}

          <button
            onClick={handleCopyCode}
            className="p-2 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-white transition-all"
            title="Share room invite code"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <MoreVertical className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* ── TOP SECTION: Movie Player (Left) & Camera Panel (Right) ─ */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
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

      {/* ── BOTTOM SECTION: Full-Width Chat & Reactions Panel ───── */}
      <div className="w-full">
        <ChatSidebar />
      </div>

    </div>
  );
}
