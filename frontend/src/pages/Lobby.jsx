import React, { useEffect, useState } from 'react';
import { 
  Zap, Monitor, Film, Users, Radio, Plus, ArrowRight, Sparkles, Tv, 
  Flame, Play, Disc, Clapperboard, Volume2, ShieldCheck, Search, Filter 
} from 'lucide-react';
import { fetchParties } from '../services/api';
import { RoomCard } from '../components/RoomCard';
import { CardSkeleton } from '../components/ui/LoadingSkeleton';
import { useParty } from '../context/PartyContext';

const PREMIERE_SHOWCASE = [
  {
    id: 'cyberpunk_2099',
    title: 'Cyberpunk 2099: Neon Syndicate',
    genre: 'SCI-FI · SYNTHWAVE · 4K',
    description: 'Immerse into a neo-tokyo cyberpunk thriller with live synchronized audio and HDR cinematic grading.',
    video_url: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
    video_title: 'Cyberpunk 2099: Neon Syndicate (4K HLS)',
    backdrop: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=1600&q=80',
    tag: '🔥 PREMIERE OF THE WEEK',
    viewers: 1420,
  },
  {
    id: 'sintel_dragon',
    title: 'Sintel: The Dragon Chronicles',
    genre: 'FANTASY · 4K ANIMATION',
    description: 'The award-winning open movie masterpiece remastered in crystal clear 4K with frame-perfect multi-user sync.',
    video_url: 'https://bitdash-a.akamaihd.net/content/sintel/hls/playlist.m3u8',
    video_title: 'Sintel 4K (Akamai HLS)',
    backdrop: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1600&q=80',
    tag: '⭐ COMMUNITY CHOICE',
    viewers: 890,
  },
  {
    id: 'tears_of_steel',
    title: 'Tears of Steel: Cybernetic Frontier',
    genre: 'ACTION · VFX · DOLBY',
    description: 'Post-apocalyptic sci-fi action featuring cutting-edge VFX, live camera reactions, and low-latency audio.',
    video_url: 'https://demo.unified-streaming.com/k8s/features/stable/video/tears-of-steel/tears-of-steel.ism/.m3u8',
    video_title: 'Tears of Steel (HLS)',
    backdrop: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=1600&q=80',
    tag: '🎬 4K REMASTER',
    viewers: 640,
  }
];

const FEATURES = [
  { 
    icon: Zap, 
    color: 'text-indigo-400', 
    glow: 'group-hover:border-indigo-500/50 group-hover:shadow-[0_0_30px_rgba(99,102,241,0.25)]',
    badgeBg: 'bg-indigo-500/15 border-indigo-500/30 text-indigo-300', 
    label: '< 20ms Jitter Drift', 
    sub: 'Sub-second real-time sync algorithm eliminates spoilers between friends.' 
  },
  { 
    icon: Monitor, 
    color: 'text-violet-400', 
    glow: 'group-hover:border-violet-500/50 group-hover:shadow-[0_0_30px_rgba(157,78,221,0.25)]',
    badgeBg: 'bg-violet-500/15 border-violet-500/30 text-violet-300', 
    label: '4K WebRTC Screen Share', 
    sub: 'Stream native browser tabs, desktop gameplay, or streaming apps directly.' 
  },
  { 
    icon: Film, 
    color: 'text-pink-400', 
    glow: 'group-hover:border-pink-500/50 group-hover:shadow-[0_0_30px_rgba(247,37,133,0.25)]',
    badgeBg: 'bg-pink-500/15 border-pink-500/30 text-pink-300', 
    label: 'Universal HLS & MP4', 
    sub: 'Direct support for custom .m3u8 streams, MP4 CDN links, and local video files.' 
  },
  { 
    icon: Users, 
    color: 'text-emerald-400', 
    glow: 'group-hover:border-emerald-500/50 group-hover:shadow-[0_0_30px_rgba(16,185,129,0.25)]',
    badgeBg: 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300', 
    label: 'Live Face Cam & Mic', 
    sub: 'Low-latency dual-track WebRTC video grid with floating emoji bursts.' 
  },
];

const CATEGORIES = [
  '🍿 All Screening Halls',
  '🔥 Trending Now',
  '🚀 Sci-Fi & Cyberpunk',
  '🎬 4K HDR Movies',
  '🖥️ Screen Shares',
];

export function Lobby({ onOpenCreateModal, onJoinByCode }) {
  const { joinParty } = useParty();
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [inputCode, setInputCode] = useState('');
  const [activeShowcaseIdx, setActiveShowcaseIdx] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState('🍿 All Screening Halls');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    async function loadParties() {
      try {
        const data = await fetchParties();
        setRooms(data);
      } catch (err) {
        console.error('Failed to load rooms', err);
      } finally {
        setLoading(false);
      }
    }
    loadParties();
  }, []);

  const currentShowcase = PREMIERE_SHOWCASE[activeShowcaseIdx];

  const handleLaunchShowcase = (showcase) => {
    joinParty({
      id: `premiere_${showcase.id}`,
      title: `🍿 ${showcase.title}`,
      description: showcase.description,
      invite_code: showcase.id.substring(0, 6).toUpperCase(),
      status: 'active',
      video_url: showcase.video_url,
      video_title: showcase.video_title,
      is_public: true,
      active_participants_count: showcase.viewers,
    });
  };

  const handleJoinSubmit = (e) => {
    e.preventDefault();
    if (inputCode.trim()) {
      onJoinByCode(inputCode.trim().toUpperCase());
    }
  };

  // Filter rooms
  const filteredRooms = rooms.filter((r) => {
    const matchesSearch = !searchQuery.trim() || 
      r.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.invite_code?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  return (
    <div className="space-y-16 pb-24 page-enter">

      {/* ── 1. CINEMATIC HERO PREMIERE STAGE ──────────────────────── */}
      <section className="relative rounded-3xl overflow-hidden border border-white/10 shadow-cinema bg-cinema-950">
        
        {/* Dynamic Backdrop Image with Smooth Fade */}
        <div className="relative w-full h-[520px] lg:h-[580px] overflow-hidden select-none">
          <img
            key={currentShowcase.id}
            src={currentShowcase.backdrop}
            alt={currentShowcase.title}
            className="w-full h-full object-cover object-center transform scale-105 animate-fade-in transition-all duration-700 brightness-[0.45] contrast-125"
          />

          {/* Cinematic lighting gradients */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#030408] via-[#030408]/60 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#030408] via-[#030408]/70 to-transparent w-full lg:w-3/4" />
          <div className="absolute -top-32 -left-32 w-96 h-96 bg-indigo-600/30 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl pointer-events-none" />

          {/* Hero Content Overlay */}
          <div className="absolute inset-0 flex flex-col justify-between p-6 sm:p-10 lg:p-14 z-10">
            
            {/* Top Showcase Tags */}
            <div className="flex items-center gap-3">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-red-600 to-pink-600 text-white text-xs font-black uppercase tracking-wider shadow-lg shadow-red-600/40">
                <span className="w-2 h-2 rounded-full bg-white animate-ping" />
                {currentShowcase.tag}
              </span>
              <span className="px-3 py-1 rounded-full bg-black/60 border border-white/15 text-indigo-300 text-xs font-mono font-bold tracking-wide backdrop-blur-md">
                {currentShowcase.genre}
              </span>
            </div>

            {/* Middle Title & Description */}
            <div className="max-w-2xl space-y-4">
              <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black font-display text-white tracking-tight leading-[1.08] drop-shadow-2xl">
                {currentShowcase.title}
              </h1>

              <p className="text-slate-300 text-sm sm:text-base lg:text-lg line-clamp-2 leading-relaxed drop-shadow-md">
                {currentShowcase.description}
              </p>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-4 pt-2">
                <button
                  onClick={() => handleLaunchShowcase(currentShowcase)}
                  className="btn-cinema text-sm sm:text-base px-8 py-3.5 flex items-center gap-3 group/btn"
                >
                  <Play className="w-5 h-5 fill-white group-hover/btn:scale-110 transition-transform" />
                  <span>Enter Premiere Room</span>
                </button>

                <button
                  onClick={onOpenCreateModal}
                  className="btn-ghost px-6 py-3.5 text-sm rounded-2xl flex items-center gap-2"
                >
                  <Plus className="w-4 h-4 text-indigo-400" />
                  <span>Host Custom Movie</span>
                </button>
              </div>
            </div>

            {/* Bottom Premiere Switcher Tabs */}
            <div className="flex items-center gap-2 sm:gap-3 overflow-x-auto pb-1 pt-4 border-t border-white/10">
              <span className="text-[11px] font-mono font-bold text-slate-400 uppercase tracking-widest hidden sm:inline mr-2">
                FEATURED:
              </span>
              {PREMIERE_SHOWCASE.map((item, idx) => (
                <button
                  key={item.id}
                  onClick={() => setActiveShowcaseIdx(idx)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-2 ${
                    activeShowcaseIdx === idx
                      ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/40 border border-indigo-400/40 scale-105'
                      : 'bg-black/50 hover:bg-black/80 text-slate-300 border border-white/10'
                  }`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  {item.title.split(':')[0]}
                </button>
              ))}
            </div>

          </div>
        </div>
      </section>

      {/* ── 2. LIVE PREMIERE MARQUEE TICKER ───────────────────────── */}
      <div className="w-full marquee-container border-y border-white/[0.07] py-3 bg-[#070914]/60 backdrop-blur-md">
        <div className="marquee-content font-tech text-xs font-bold tracking-wider text-slate-300 flex items-center">
          <span className="flex items-center gap-2 text-indigo-400"><Sparkles className="w-4 h-4 text-pink-400" /> DOLBY CINEMA 4K MATRIX</span>
          <span className="text-slate-600">✦</span>
          <span className="flex items-center gap-2 text-emerald-400"><span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" /> &lt; 20MS SYNCHRONIZATION</span>
          <span className="text-slate-600">✦</span>
          <span className="flex items-center gap-2 text-pink-400"><Film className="w-4 h-4 text-pink-400" /> WEBRTC SCREEN SHARING ACTIVE</span>
          <span className="text-slate-600">✦</span>
          <span className="flex items-center gap-2 text-amber-400"><Volume2 className="w-4 h-4 text-amber-400" /> LOW-LATENCY SPATIAL CAMERAS</span>
          <span className="text-slate-600">✦</span>
          <span className="flex items-center gap-2 text-cyan-400"><Clapperboard className="w-4 h-4 text-cyan-400" /> 24/7 SCREENING HALLS</span>
          <span className="text-slate-600">✦</span>
          <span className="flex items-center gap-2 text-indigo-400"><Sparkles className="w-4 h-4 text-pink-400" /> DOLBY CINEMA 4K MATRIX</span>
          <span className="text-slate-600">✦</span>
          <span className="flex items-center gap-2 text-emerald-400"><span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" /> &lt; 20MS SYNCHRONIZATION</span>
        </div>
      </div>

      {/* ── 3. SEARCH & CATEGORY FILTER BAR ───────────────────────── */}
      <section className="space-y-4">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          
          {/* Categories */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                  selectedCategory === cat
                    ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-600/30 border border-indigo-400/30'
                    : 'glass hover:bg-surface-light text-slate-300 border-white/5'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Search box */}
          <div className="relative min-w-[260px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search movie or room..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input-field pl-10 py-2 text-xs rounded-xl"
            />
          </div>
        </div>
      </section>

      {/* ── 4. LIVE SCREENING HALLS GRID ─────────────────────────── */}
      <section className="space-y-6">
        
        {/* Section Title */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="live-indicator" />
            <h2 className="text-2xl font-black font-display text-white tracking-tight">
              Live Screening Halls
            </h2>
            {!loading && (
              <span className="badge-indigo">
                {filteredRooms.length} Active {filteredRooms.length === 1 ? 'Hall' : 'Halls'}
              </span>
            )}
          </div>

          <button
            onClick={onOpenCreateModal}
            className="btn-primary text-xs px-4 py-2"
          >
            <Plus className="w-3.5 h-3.5" /> Host New Screening
          </button>
        </div>

        {/* Room Cards Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <CardSkeleton key={n} />
            ))}
          </div>
        ) : filteredRooms.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredRooms.map((room, idx) => (
              <RoomCard key={room.id} room={room} index={idx} />
            ))}
          </div>
        ) : (
          <div className="glass-premium rounded-3xl p-12 text-center border border-slate-800 space-y-4 max-w-lg mx-auto">
            <div className="w-16 h-16 rounded-2xl bg-indigo-600/20 text-indigo-400 flex items-center justify-center mx-auto border border-indigo-500/30">
              <Tv className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-white">No Matching Screening Rooms</h3>
            <p className="text-xs text-slate-400">Be the first to start a synchronized watch party or check back soon!</p>
            <button
              onClick={onOpenCreateModal}
              className="btn-primary text-xs px-6 py-2.5 mx-auto"
            >
              <Plus className="w-4 h-4" /> Start Party Room
            </button>
          </div>
        )}
      </section>

      {/* ── 5. CINEMA ENGINE TECH SPECS ──────────────────────────── */}
      <section className="space-y-6 pt-6">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <span className="badge-cyan text-[11px] font-bold">STATE-OF-THE-ART STREAMING</span>
          <h2 className="text-3xl font-black font-display text-white">Built for True Cinephiles</h2>
          <p className="text-xs sm:text-sm text-slate-400">
            Engineered with WebSockets, WebRTC mesh protocols, and adaptive HLS streaming for ultra-low latency.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {FEATURES.map(({ icon: Icon, color, glow, badgeBg, label, sub }) => (
            <div
              key={label}
              className={`glass-panel rounded-3xl p-6 border border-slate-800/90 transition-all duration-300 group ${glow}`}
            >
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 border ${badgeBg}`}>
                <Icon className={`w-6 h-6 ${color}`} />
              </div>
              <h3 className="font-display font-bold text-base text-white mb-1.5">{label}</h3>
              <p className="text-xs text-slate-400 leading-relaxed">{sub}</p>
            </div>
          ))}
        </div>
      </section>

    </div>
  );
}
