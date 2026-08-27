import React, { useState } from 'react';
import { Users, Play, Radio, Copy, Check, Film, Sparkles, Tv, Monitor } from 'lucide-react';
import { useParty } from '../context/PartyContext';

// Curated cinematic backdrop posters for default showcase rooms
const POSTER_PRESETS = [
  'https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=800&q=80', // Cinema hall
  'https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=800&q=80', // Anime cyber aesthetic
  'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=800&q=80', // Sci-fi space
  'https://images.unsplash.com/photo-1574267432553-4b4628081c31?auto=format&fit=crop&w=800&q=80', // Cinema popcorn & screen
  'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=800&q=80', // Theatre lights
];

export function RoomCard({ room, index = 0 }) {
  const { joinParty } = useParty();
  const [copied, setCopied] = useState(false);

  const posterUrl = room.poster_url || POSTER_PRESETS[index % POSTER_PRESETS.length];
  const isScreenShare = room.video_source_type === 'screen' || (room.title && room.title.toLowerCase().includes('screen'));
  const is4K = !isScreenShare && (room.video_title?.includes('4K') || room.title?.includes('4K') || true);

  const handleCopyCode = (e) => {
    e.stopPropagation();
    navigator.clipboard.writeText(room.invite_code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div 
      className="glass-panel glass-panel-hover rounded-3xl overflow-hidden flex flex-col justify-between group relative border border-slate-800/80 hover:border-indigo-500/40 transition-all duration-300"
    >
      {/* ── Top Poster Showcase with Hover Overlay ───────────────── */}
      <div className="relative aspect-[16/9] w-full overflow-hidden bg-cinema-900 select-none">
        <img
          src={posterUrl}
          alt={room.title}
          className="w-full h-full object-cover object-center group-hover:scale-105 group-hover:filter-none filter brightness-90 transition-transform duration-500 ease-out"
          loading="lazy"
        />

        {/* Gradient dark vignette */}
        <div className="absolute inset-0 bg-gradient-to-t from-cinema-950 via-cinema-950/40 to-transparent" />

        {/* Top Badges */}
        <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none">
          <div className="flex items-center gap-1.5">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-600/90 text-white text-[10px] font-black uppercase tracking-wider backdrop-blur-md shadow-lg shadow-red-600/40">
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
              LIVE
            </span>
            {isScreenShare ? (
              <span className="px-2 py-0.5 rounded-full bg-violet-950/80 text-violet-300 border border-violet-500/40 text-[10px] font-bold tracking-wide backdrop-blur-md">
                🖥️ SCREEN SHARE
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded-full bg-indigo-950/80 text-indigo-300 border border-indigo-500/40 text-[10px] font-bold tracking-wide backdrop-blur-md">
                🎬 4K CINEMA
              </span>
            )}
          </div>

          <button
            onClick={handleCopyCode}
            className="pointer-events-auto flex items-center gap-1 px-2.5 py-1 rounded-xl bg-black/60 hover:bg-black/90 text-slate-200 border border-white/15 text-[11px] font-mono font-bold tracking-widest backdrop-blur-md transition-all active:scale-90"
            title="Click to copy invite code"
          >
            {copied ? (
              <>
                <Check className="w-3 h-3 text-emerald-400" />
                <span className="text-emerald-400">COPIED</span>
              </>
            ) : (
              <>
                <Copy className="w-3 h-3 text-indigo-400" />
                <span>{room.invite_code}</span>
              </>
            )}
          </button>
        </div>

        {/* Center Hover Play Button */}
        <div 
          onClick={() => joinParty(room)}
          className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 bg-black/40 backdrop-blur-[2px] transition-all duration-300 cursor-pointer"
        >
          <div className="w-14 h-14 rounded-full bg-gradient-to-r from-indigo-500 to-pink-500 flex items-center justify-center text-white shadow-2xl shadow-indigo-500/60 transform scale-75 group-hover:scale-100 transition-all duration-300 border border-white/30">
            <Play className="w-6 h-6 fill-white ml-0.5" />
          </div>
        </div>

        {/* Live Audio Waveform Animation Simulator */}
        <div className="absolute bottom-2 right-3 flex items-end gap-0.5 h-3.5">
          <span className="w-1 bg-indigo-400/80 rounded-full animate-bounce-soft" style={{ height: '60%', animationDelay: '0.1s' }} />
          <span className="w-1 bg-violet-400/80 rounded-full animate-bounce-soft" style={{ height: '100%', animationDelay: '0.3s' }} />
          <span className="w-1 bg-pink-400/80 rounded-full animate-bounce-soft" style={{ height: '40%', animationDelay: '0.2s' }} />
          <span className="w-1 bg-cyan-400/80 rounded-full animate-bounce-soft" style={{ height: '80%', animationDelay: '0.4s' }} />
        </div>
      </div>

      {/* ── Content & Actions ───────────────────────────────────── */}
      <div className="p-5 flex-1 flex flex-col justify-between">
        <div>
          <h3 className="font-display text-base font-extrabold text-white group-hover:text-indigo-300 transition-colors line-clamp-1 mb-1.5 flex items-center gap-1.5">
            {room.title}
          </h3>
          <p className="text-xs text-slate-400 line-clamp-2 mb-4 leading-relaxed">
            {room.description || "Join this live synchronized screening room for high-definition streaming & group chat!"}
          </p>
        </div>

        <div>
          {/* Metadata Bar */}
          <div className="flex items-center justify-between text-xs text-slate-400 mb-4 pt-3 border-t border-slate-800/80">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-indigo-950/40 border border-indigo-500/20 text-indigo-300">
                <Users className="w-3.5 h-3.5 text-indigo-400" />
                <span className="font-bold text-slate-200">{room.active_participants_count || 3} Cinephiles</span>
              </div>
            </div>

            <span className="text-[11px] font-mono font-semibold text-slate-400 truncate max-w-[130px]" title={room.video_title}>
              {room.video_title || "4K Master Stream"}
            </span>
          </div>

          {/* Join CTA Button */}
          <button
            onClick={() => joinParty(room)}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-2xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-xs font-extrabold tracking-wide shadow-lg shadow-indigo-600/30 hover:shadow-indigo-500/50 transition-all duration-300 border border-indigo-400/20 active:scale-[0.98]"
          >
            <Play className="w-3.5 h-3.5 fill-current" /> Enter Screening Room
          </button>
        </div>
      </div>
    </div>
  );
}
