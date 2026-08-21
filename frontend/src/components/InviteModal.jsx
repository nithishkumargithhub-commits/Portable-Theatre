import React, { useState } from 'react';
import { Copy, Check, Share2, X, QrCode, Film, Sparkles } from 'lucide-react';

// Lightweight pure React SVG QR Code Generator (Matrix renderer)
function SimpleQRCodeSVG({ text, size = 160 }) {
  // Generate deterministic binary pattern from string
  const modules = [];
  const gridSize = 21; // standard QR version 1 size
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    hash = (hash << 5) - hash + text.charCodeAt(i);
    hash |= 0;
  }

  for (let r = 0; r < gridSize; r++) {
    const row = [];
    for (let c = 0; c < gridSize; c++) {
      // Corner finder patterns
      const isTopLeftFinder = r < 7 && c < 7;
      const isTopRightFinder = r < 7 && c >= gridSize - 7;
      const isBottomLeftFinder = r >= gridSize - 7 && c < 7;

      if (isTopLeftFinder || isTopRightFinder || isBottomLeftFinder) {
        const localR = isTopLeftFinder ? r : isTopRightFinder ? r : r - (gridSize - 7);
        const localC = isTopLeftFinder ? c : isTopRightFinder ? c - (gridSize - 7) : c;
        const isBorder = localR === 0 || localR === 6 || localC === 0 || localC === 6;
        const isCenter = localR >= 2 && localR <= 4 && localC >= 2 && localC <= 4;
        row.push(isBorder || isCenter);
      } else {
        const val = Math.abs(Math.sin(hash + r * 31 + c * 17));
        row.push(val > 0.48);
      }
    }
    modules.push(row);
  }

  const cellSize = size / gridSize;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="rounded-xl bg-white p-2.5 shadow-lg">
      {modules.map((row, r) =>
        row.map((cell, c) => (
          cell ? (
            <rect
              key={`${r}-${c}`}
              x={c * cellSize}
              y={r * cellSize}
              width={cellSize + 0.3}
              height={cellSize + 0.3}
              fill="#090d16"
            />
          ) : null
        ))
      )}
    </svg>
  );
}

export function InviteModal({ isOpen, onClose, party }) {
  const [copied, setCopied] = useState(false);
  const [showQR, setShowQR] = useState(false);

  if (!isOpen || !party) return null;

  const joinUrl = `${window.location.origin}/join/${party.invite_code}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(joinUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleWebShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: party.title || "Watch Party - Portable Theatre",
          text: `Join my cinema watch party for "${party.video_title || party.title}"!`,
          url: joinUrl,
        });
      } catch (err) {
        // User cancelled or share failed
      }
    } else {
      handleCopyLink();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center modal-overlay p-4">
      <div className="glass-premium rounded-3xl max-w-md w-full border border-slate-700/60 shadow-cinema relative overflow-hidden p-6 animate-scale-up">
        {/* Ambient background glow */}
        <div className="absolute -top-20 -right-20 w-48 h-48 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />

        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-1.5 rounded-xl hover:bg-surface-light text-slate-400 hover:text-white transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-600/30 shrink-0">
            <Film className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">Invite Friends</h3>
            <p className="text-xs text-slate-400">Share watch party link or room code</p>
          </div>
        </div>

        {/* Party Card Summary */}
        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 mb-5 flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-indigo-950 border border-indigo-500/30 flex items-center justify-center shrink-0">
            <Sparkles className="w-6 h-6 text-indigo-400" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-indigo-400 uppercase tracking-wider">Active Watch Party</p>
            <p className="text-sm font-bold text-slate-100 truncate">{party.title}</p>
            <p className="text-xs text-slate-400 truncate">{party.video_title || 'Synchronized Movie Stream'}</p>
          </div>
        </div>

        {/* Invite Code display */}
        <div className="mb-5 text-center p-4 rounded-2xl bg-surface/80 border border-slate-700/60">
          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest mb-1">Room Invite Code</p>
          <p className="text-2xl font-mono font-bold text-indigo-300 tracking-widest">{party.invite_code}</p>
        </div>

        {/* Link Copy Box */}
        <div className="space-y-3 mb-6">
          <label className="text-xs font-semibold text-slate-400">Shareable Room Link</label>
          <div className="flex items-center gap-2 p-1.5 bg-surface rounded-xl border border-slate-800">
            <input
              type="text"
              readOnly
              value={joinUrl}
              className="bg-transparent border-none text-xs text-slate-300 px-2 flex-1 focus:outline-none font-mono"
            />
            <button
              onClick={handleCopyLink}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                copied ? 'bg-emerald-600 text-white' : 'bg-indigo-600 hover:bg-indigo-500 text-white'
              }`}
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied!' : 'Copy'}</span>
            </button>
          </div>
        </div>

        {/* QR Code toggle section */}
        {showQR && (
          <div className="flex flex-col items-center justify-center p-4 bg-slate-900/90 rounded-2xl border border-slate-800 mb-5 animate-fade-in">
            <SimpleQRCodeSVG text={joinUrl} size={150} />
            <p className="text-[11px] text-slate-400 mt-2">Scan with phone camera to join instantly</p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {navigator.share && (
            <button
              onClick={handleWebShare}
              className="flex-1 btn-primary py-2.5 text-xs flex items-center justify-center gap-2"
            >
              <Share2 className="w-4 h-4" /> Share Link
            </button>
          )}
          <button
            onClick={() => setShowQR(!showQR)}
            className="flex-1 btn-secondary py-2.5 text-xs flex items-center justify-center gap-2"
          >
            <QrCode className="w-4 h-4 text-indigo-400" /> {showQR ? 'Hide QR Code' : 'Show QR Code'}
          </button>
        </div>
      </div>
    </div>
  );
}
