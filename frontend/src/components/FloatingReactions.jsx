import React from 'react';
import { useParty } from '../context/PartyContext';

export function FloatingReactions() {
  const { activeReactions } = useParty();

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-20">
      {activeReactions.map((r) => {
        const isLarge = r.x % 3 === 0;
        const isMed = r.x % 3 === 1;
        const rotationDeg = (r.x % 10 - 5) * 4; // -20deg to +20deg drift

        return (
          <div
            key={r.id}
            style={{
              left: `${r.x}%`,
              bottom: '70px',
              transform: `rotate(${rotationDeg}deg)`,
              animationDuration: isLarge ? '3.2s' : isMed ? '2.8s' : '2.4s',
            }}
            className={`absolute animate-float-up flex flex-col items-center gap-1 ${
              isLarge ? 'scale-125' : isMed ? 'scale-100' : 'scale-90'
            }`}
          >
            <span className={`${isLarge ? 'text-4xl' : isMed ? 'text-3xl' : 'text-2xl'} drop-shadow-cinema transition-transform`}>
              {r.emoji}
            </span>
            {r.username && (
              <span className="px-2 py-0.5 rounded-full bg-slate-900/80 border border-slate-700/60 text-[10px] font-semibold text-slate-200 backdrop-blur-md shadow-md">
                {r.username}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}
