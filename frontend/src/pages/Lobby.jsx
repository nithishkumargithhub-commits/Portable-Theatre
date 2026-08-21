import React, { useEffect, useState } from 'react';
import { Zap, Monitor, Film, Users, Radio, Plus, ArrowRight, Sparkles, Tv2 } from 'lucide-react';
import { fetchParties } from '../services/api';
import { RoomCard } from '../components/RoomCard';
import { CardSkeleton } from '../components/ui/LoadingSkeleton';

const FEATURES = [
  { icon: Zap, color: 'text-indigo-400', bg: 'bg-indigo-500/10 border-indigo-500/20', label: '< 800ms Sync', sub: 'Drift compensation' },
  { icon: Monitor, color: 'text-violet-400', bg: 'bg-violet-500/10 border-violet-500/20', label: 'WebRTC Sharing', sub: 'Permission control' },
  { icon: Film, color: 'text-pink-400', bg: 'bg-pink-500/10 border-pink-500/20', label: '4K HLS · MP4', sub: 'Custom stream URLs' },
  { icon: Users, color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20', label: 'Live Cameras', sub: 'P2P video grid' },
];

export function Lobby({ onOpenCreateModal, onJoinByCode }) {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [inputCode, setInputCode] = useState('');

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

  const handleJoinSubmit = (e) => {
    e.preventDefault();
    if (inputCode.trim()) {
      onJoinByCode(inputCode.trim().toUpperCase());
    }
  };

  return (
    <div className="space-y-12 pb-20 page-enter">

      {/* ── HERO ──────────────────────────────────────────────── */}
      <section className="relative overflow-hidden">

        {/* Ambient glow blobs */}
        <div className="ambient-blob w-96 h-96 bg-indigo-600/20 -top-32 -left-32" />
        <div className="ambient-blob w-80 h-80 bg-violet-600/15 -top-16 right-0" />
        <div className="ambient-blob w-64 h-64 bg-pink-600/10 bottom-0 left-1/2" />

        <div className="relative z-10 glass-premium rounded-3xl border border-indigo-500/10 px-8 py-16 lg:px-16 lg:py-20 max-w-5xl mx-auto text-center">

          {/* Eyebrow badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/25 text-indigo-300 text-xs font-semibold uppercase tracking-widest mb-8 animate-fade-in">
            <Sparkles className="w-3.5 h-3.5" />
            Next-Gen Watch Party Experience
          </div>

          {/* Headline */}
          <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-white leading-[1.05] mb-6 animate-slide-up" style={{animationDelay:'0.05s'}}>
            Stream Together,{' '}
            <br className="hidden sm:block" />
            <span className="bg-gradient-to-r from-indigo-400 via-violet-300 to-pink-400 bg-clip-text text-transparent">
              Frame Perfect.
            </span>
          </h1>

          <p className="text-slate-400 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed mb-10 animate-slide-up" style={{animationDelay:'0.1s'}}>
            Host synchronized cinema rooms, share your screen over WebRTC, react with live emoji, and watch 4K HLS or MP4 streams with zero drift.
          </p>

          {/* CTA group */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12 animate-slide-up" style={{animationDelay:'0.15s'}}>
            <button
              onClick={onOpenCreateModal}
              className="btn-primary w-full sm:w-auto px-8 py-3.5 text-base rounded-2xl"
            >
              <Plus className="w-5 h-5" />
              Start a Party Room
            </button>

            <form onSubmit={handleJoinSubmit} className="w-full sm:w-auto flex items-center gap-2 glass rounded-2xl border border-slate-700/50 focus-within:border-indigo-500/60 p-1.5 transition-all">
              <input
                type="text"
                placeholder="Enter Room Code…"
                value={inputCode}
                onChange={(e) => setInputCode(e.target.value.toUpperCase())}
                maxLength={12}
                className="bg-transparent text-sm text-slate-100 placeholder-slate-600 px-3 py-2 focus:outline-none w-40 font-mono tracking-widest"
                aria-label="Room invite code"
              />
              <button
                type="submit"
                className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-sm font-semibold transition-colors flex items-center gap-1.5"
              >
                Join <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          </div>

          {/* Feature pills */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 max-w-3xl mx-auto animate-slide-up" style={{animationDelay:'0.2s'}}>
            {FEATURES.map(({ icon: Icon, color, bg, label, sub }) => (
              <div key={label} className={`flex items-center gap-3 p-3.5 rounded-2xl border ${bg} text-left`}>
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${bg} border-0`}>
                  <Icon className={`w-4 h-4 ${color}`} />
                </div>
                <div>
                  <p className={`text-xs font-bold ${color}`}>{label}</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">{sub}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── LIVE ROOMS ────────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto space-y-6">

        {/* Section header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="live-indicator" />
            <h2 className="text-xl font-bold text-white">Live Public Parties</h2>
            {!loading && (
              <span className="badge-indigo">
                {rooms.length} {rooms.length === 1 ? 'Room' : 'Rooms'}
              </span>
            )}
          </div>
          <button
            onClick={onOpenCreateModal}
            className="btn-ghost text-xs py-2 px-4 hidden sm:flex"
          >
            <Plus className="w-3.5 h-3.5" /> Host New Room
          </button>
        </div>

        {/* Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => <CardSkeleton key={i} />)}
          </div>
        ) : rooms.length === 0 ? (
          <div className="glass-card rounded-3xl border border-dashed border-slate-700/50 py-20 text-center">
            <div className="w-16 h-16 rounded-3xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mx-auto mb-5">
              <Tv2 className="w-8 h-8 text-indigo-400 opacity-60" />
            </div>
            <h3 className="text-lg font-bold text-slate-300 mb-2">No Active Party Rooms</h3>
            <p className="text-sm text-slate-500 mb-6 max-w-sm mx-auto">Be the first to kick off a watch party. Create a room and invite your friends!</p>
            <button onClick={onOpenCreateModal} className="btn-primary mx-auto">
              <Plus className="w-4 h-4" /> Create the First Room
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {rooms.map((r) => <RoomCard key={r.id} room={r} />)}
          </div>
        )}
      </section>
    </div>
  );
}
