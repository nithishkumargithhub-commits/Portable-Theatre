import React from 'react';
import { Users, Crown, Monitor, Check, X, Camera, Mic, MicOff, Radio } from 'lucide-react';
import { useParty } from '../context/PartyContext';
import { useAuth } from '../context/AuthContext';
import { UserAvatar } from './ui/UserAvatar';

export function ParticipantDrawer() {
  const { participants, isHost, screenShareState, approveScreenShare, currentParty } = useParty();
  const { user } = useAuth();

  return (
    <div className="flex flex-col h-full glass-premium rounded-2xl border border-slate-800/60 overflow-hidden shadow-cinema">

      {/* Header */}
      <div className="px-4 py-3 border-b border-slate-800/60 flex items-center justify-between shrink-0 bg-slate-900/60">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-indigo-400" />
          <h3 className="text-xs font-bold uppercase tracking-widest text-slate-300">Party Viewers</h3>
        </div>
        <span className="badge-success text-[10px]">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          {participants.length} Online
        </span>
      </div>

      {/* Screen share approval alert */}
      {isHost && screenShareState.pendingRequest && (
        <div className="mx-3 mt-3 p-3 rounded-xl bg-indigo-950/70 border border-indigo-500/40 shadow-glow-sm animate-bounce-soft shrink-0">
          <div className="flex items-center gap-2 text-xs font-bold text-indigo-300 mb-1.5">
            <Monitor className="w-3.5 h-3.5 text-indigo-400" />
            Screen Share Request
          </div>
          <p className="text-xs text-slate-300 mb-2.5">
            <span className="font-semibold text-white">{screenShareState.pendingRequest.requesterName}</span>{' '}
            wants to present their screen.
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => approveScreenShare(screenShareState.pendingRequest.requesterId)}
              className="flex-1 btn-primary py-1.5 text-xs flex items-center justify-center gap-1"
            >
              <Check className="w-3.5 h-3.5" /> Approve
            </button>
            <button
              onClick={() => approveScreenShare(null)}
              className="px-3 py-1.5 bg-surface hover:bg-surface-light text-slate-400 hover:text-white rounded-lg text-xs border border-slate-700 transition-all"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Viewer list */}
      <div className="flex-1 p-3 overflow-y-auto space-y-1.5 min-h-0 custom-scrollbar">
        {participants.map((p) => {
          const isPartyHost = p.user_id === currentParty?.host_id || p.username?.includes('Host');
          const isSharer = screenShareState.sharerId === p.user_id;
          const isMe = p.user_id === user?.id;

          return (
            <div
              key={p.user_id}
              className={`flex items-center justify-between px-3 py-2.5 rounded-xl border transition-all ${
                isMe
                  ? 'bg-indigo-600/10 border-indigo-500/30'
                  : 'bg-surface/50 border-slate-800/60 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="relative shrink-0">
                  <UserAvatar username={p.username} size="sm" showRing={isMe} />
                  <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-slate-950" />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-xs font-semibold text-slate-200 truncate max-w-[110px]">
                      {p.username}
                    </span>
                    {isMe && <span className="text-[10px] text-indigo-400 font-bold">(You)</span>}

                    {isPartyHost && (
                      <span className="flex items-center gap-0.5 text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/30 uppercase shrink-0">
                        <Crown className="w-2.5 h-2.5" /> Host
                      </span>
                    )}

                    {isSharer && (
                      <span className="flex items-center gap-0.5 text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 shrink-0">
                        <Monitor className="w-2.5 h-2.5" /> Presenting
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5">
                    <span className="flex items-center gap-1 text-emerald-400">
                      <Radio className="w-2.5 h-2.5 animate-pulse" /> Watching
                    </span>
                  </div>
                </div>
              </div>

              {isHost && !isMe && (
                <button
                  onClick={() => approveScreenShare(p.user_id)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-300 hover:bg-indigo-500/10 transition-all shrink-0"
                  title="Grant Presenter Permission"
                >
                  <Monitor className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
