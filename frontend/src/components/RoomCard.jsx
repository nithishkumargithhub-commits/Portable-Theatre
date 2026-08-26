
import React from 'react';
import { Users, Play, Radio, Code, Sparkles } from 'lucide-react';
import { useParty } from '../context/PartyContext';

export function RoomCard({ room }) {
  const { joinParty } = useParty();

  return (
    <div className="glass-panel glass-panel-hover rounded-2xl p-5 border border-slate-800/80 flex flex-col justify-between group">
      <div>
        {/* Header Badges */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-red-600/20 text-red-400 border border-red-500/30 text-[10px] font-bold uppercase tracking-wider">
            <Radio className="w-3 h-3 animate-pulse" /> LIVE STREAM
          </span>
          <span className="font-mono text-[10px] font-semibold px-2 py-0.5 bg-surface text-slate-400 rounded-md border border-slate-700/80">
            CODE: {room.invite_code}
          </span>
        </div>

        {/* Title & Description */}
        <h3 className="text-base font-bold text-slate-100 group-hover:text-indigo-300 transition-colors line-clamp-1 mb-1">
          {room.title}
        </h3>
        <p className="text-xs text-slate-400 line-clamp-2 mb-4">
          {room.description || "Join this watch party room and enjoy synchronized video playback!"}
        </p>
      </div>

      {/* Footer Info & Action */}
      <div>
        <div className="flex items-center justify-between text-xs text-slate-400 mb-4 pt-3 border-t border-slate-800/60">
          <div className="flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-indigo-400" />
            <span className="font-medium text-slate-200">{room.active_participants_count || 1} Viewers</span>
          </div>
          <span className="text-[10px] font-mono text-slate-500">
            {room.video_title ? room.video_title : "4K Cinema"}
          </span>
        </div>

        <button
          onClick={() => joinParty(room)}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/30 transition-all transform group-hover:scale-[1.02]"
        >
          <Play className="w-3.5 h-3.5 fill-current" /> Join Theatre Room
        </button>
      </div>
    </div>
  );
}
