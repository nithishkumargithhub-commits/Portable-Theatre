import React, { useState, useEffect } from 'react';
import { Clock, Film, Shield, Calendar, Play, ArrowLeft, Award, Trophy, Zap } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { fetchWatchHistoryApi } from '../services/api';
import { UserAvatar } from '../components/ui/UserAvatar';
import { StatCardSkeleton } from '../components/ui/LoadingSkeleton';

export function UserHistoryPage({ onBackToLobby }) {
  const { user, token, isAdmin } = useAuth();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadHistory() {
      if (token) {
        const data = await fetchWatchHistoryApi(token);
        setHistory(data || []);
      }
      setLoading(false);
    }
    loadHistory();
  }, [token]);

  const totalSeconds = history.reduce((acc, curr) => acc + (curr.duration_seconds || 0), 0);
  const totalHours = Math.floor(totalSeconds / 3600);
  const totalMins = Math.floor((totalSeconds % 3600) / 60);

  const formatDuration = (secs) => {
    if (!secs) return '0m';
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    if (h > 0) return `${h}h ${m}m`;
    if (m > 0) return `${m}m ${s}s`;
    return `${s}s`;
  };

  const formatDate = (isoStr) => {
    if (!isoStr) return 'Just now';
    return new Date(isoStr).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const STAT_CARDS = [
    { icon: Clock, color: 'text-indigo-400', bg: 'bg-indigo-600/15 border-indigo-500/25', label: 'Total Watch Time', value: `${totalHours}h ${totalMins}m`, sub: 'Cumulative watch duration' },
    { icon: Film, color: 'text-violet-400', bg: 'bg-violet-600/15 border-violet-500/25', label: 'Party Sessions', value: `${history.length}`, sub: 'Rooms joined' },
    { icon: Zap, color: 'text-emerald-400', bg: 'bg-emerald-600/15 border-emerald-500/25', label: 'Sync Rating', value: '99.8%', sub: 'Average playback sync' },
    { icon: Trophy, color: 'text-amber-400', bg: 'bg-amber-600/15 border-amber-500/25', label: 'Member Status', value: 'Pro', sub: 'Viewer tier' },
  ];

  return (
    <div className="space-y-8 page-enter">

      {/* Profile banner */}
      <div className="relative glass-premium rounded-3xl border border-slate-800/60 px-6 py-7 overflow-hidden">
        <div className="ambient-blob w-72 h-72 bg-indigo-600/12 -top-24 -right-24" />
        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="relative">
              <UserAvatar
                username={user?.username}
                avatarUrl={user?.avatar_url}
                size="xl"
                className="shadow-glow-md"
              />
              <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-400 border-2 border-background" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h1 className="text-2xl font-extrabold text-white">{user?.username || 'Guest Viewer'}</h1>
                {isAdmin && (
                  <span className="badge-gold">
                    <Shield className="w-3 h-3" /> Admin
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 font-mono">{user?.email || 'guest@portabletheatre.local'}</p>
              <p className="text-xs text-indigo-400 font-medium mt-1">🎬 Pro Viewer · {history.length} sessions</p>
            </div>
          </div>
          <button onClick={onBackToLobby} className="btn-ghost text-sm py-2 px-5 shrink-0">
            <ArrowLeft className="w-4 h-4" /> Back to Lobby
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {loading ? (
          [1,2,3,4].map(i => <StatCardSkeleton key={i} />)
        ) : (
          STAT_CARDS.map(({ icon: Icon, color, bg, label, value, sub }) => (
            <div key={label} className="glass-card rounded-2xl p-5 flex items-center gap-4">
              <div className={`w-12 h-12 rounded-2xl border flex items-center justify-center shrink-0 ${bg}`}>
                <Icon className={`w-6 h-6 ${color}`} />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-500">{label}</p>
                <p className={`text-xl font-black mt-0.5 ${color}`}>{value}</p>
                <p className="text-[10px] text-slate-600">{sub}</p>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Watch history feed */}
      <div className="glass-premium rounded-3xl border border-slate-800/60 p-6 space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Film className="w-5 h-5 text-indigo-400" />
            <h2 className="text-base font-bold text-white">Watch History</h2>
          </div>
          <span className="text-xs font-mono text-slate-600">{history.length} recorded sessions</span>
        </div>

        {loading ? (
          <div className="py-12 text-center text-sm text-slate-600">Loading watch history…</div>
        ) : history.length === 0 ? (
          <div className="py-16 text-center border-2 border-dashed border-slate-800 rounded-2xl">
            <div className="w-14 h-14 rounded-3xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mx-auto mb-4">
              <Film className="w-7 h-7 text-indigo-400 opacity-50" />
            </div>
            <h3 className="text-base font-bold text-slate-300 mb-1">No Watch History Yet</h3>
            <p className="text-xs text-slate-600 max-w-xs mx-auto">Join or host a party room to start tracking your viewing sessions!</p>
          </div>
        ) : (
          <div className="space-y-2">
            {history.map((item, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-4 rounded-2xl bg-surface border border-slate-800/60 hover:border-slate-700 hover:bg-surface-hover transition-all group"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-indigo-600/15 border border-indigo-500/25 flex items-center justify-center shrink-0 group-hover:bg-indigo-600/25 transition-colors">
                    <Play className="w-4 h-4 fill-current text-indigo-400" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-200 group-hover:text-white transition-colors">
                      {item.party_title}
                    </h3>
                    <p className="text-[11px] text-slate-600 font-mono mt-0.5">
                      {formatDate(item.joined_at)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {/* Duration bar */}
                  <div className="hidden sm:block w-20 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full"
                      style={{ width: `${Math.min(100, ((item.duration_seconds || 0) / 7200) * 100)}%` }}
                    />
                  </div>
                  <span className="badge-indigo font-mono">
                    ⏱ {formatDuration(item.duration_seconds)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
