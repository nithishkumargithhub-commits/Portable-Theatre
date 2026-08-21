import React from 'react';
import { Film, Clock, Users, MessageSquare, Heart, CheckCircle2, ArrowRight } from 'lucide-react';

export function PartySummaryModal({ isOpen, onClose, partyTitle, durationSeconds, participantCount, messageCount, reactionCount }) {
  if (!isOpen) return null;

  const formatDuration = (secs) => {
    const mins = Math.floor(secs / 60);
    const hours = Math.floor(mins / 60);
    const remMins = mins % 60;
    if (hours > 0) return `${hours}h ${remMins}m`;
    return `${mins} min${mins !== 1 ? 's' : ''}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center modal-overlay p-4">
      <div className="glass-premium rounded-3xl max-w-md w-full border border-slate-700/60 shadow-cinema relative overflow-hidden p-6 text-center animate-scale-up">
        {/* Glow backdrop */}
        <div className="absolute -top-24 -left-24 w-56 h-56 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />

        {/* Icon */}
        <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-indigo-600/30">
          <Film className="w-8 h-8 text-white" />
        </div>

        {/* Title */}
        <h3 className="text-xl font-bold text-white mb-1">Party Complete 🍿</h3>
        <p className="text-xs text-slate-400 mb-6">You enjoyed a wholesome watch session!</p>

        {/* Party Title Banner */}
        <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 mb-6 text-left">
          <p className="text-[11px] font-semibold text-indigo-400 uppercase tracking-wider">Screened Room</p>
          <p className="text-sm font-bold text-slate-100 truncate">{partyTitle || "Watch Party"}</p>
        </div>

        {/* Grid Stats */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="p-3.5 rounded-2xl bg-surface/80 border border-slate-800 flex flex-col items-center">
            <Clock className="w-5 h-5 text-indigo-400 mb-1" />
            <span className="text-base font-bold text-slate-100">{formatDuration(durationSeconds || 0)}</span>
            <span className="text-[11px] text-slate-400">Watch Time</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-surface/80 border border-slate-800 flex flex-col items-center">
            <Users className="w-5 h-5 text-emerald-400 mb-1" />
            <span className="text-base font-bold text-slate-100">{participantCount || 1}</span>
            <span className="text-[11px] text-slate-400">Viewers Joined</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-surface/80 border border-slate-800 flex flex-col items-center">
            <MessageSquare className="w-5 h-5 text-sky-400 mb-1" />
            <span className="text-base font-bold text-slate-100">{messageCount || 0}</span>
            <span className="text-[11px] text-slate-400">Messages Sent</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-surface/80 border border-slate-800 flex flex-col items-center">
            <Heart className="w-5 h-5 text-rose-400 mb-1" />
            <span className="text-base font-bold text-slate-100">{reactionCount || 0}</span>
            <span className="text-[11px] text-slate-400">Reactions Shared</span>
          </div>
        </div>

        {/* Action Button */}
        <button
          onClick={onClose}
          className="w-full btn-primary py-3 text-xs font-semibold flex items-center justify-center gap-2 shadow-glow-sm"
        >
          <span>Return to Lobby</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
