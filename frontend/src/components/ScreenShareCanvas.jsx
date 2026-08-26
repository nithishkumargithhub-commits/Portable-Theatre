import React, { useRef, useEffect, useState } from 'react';
import { Monitor, StopCircle, Maximize, Volume2, VolumeX, AlertCircle, Radio } from 'lucide-react';
import { useParty } from '../context/PartyContext';
import { useAuth } from '../context/AuthContext';
import { useWebRTC } from '../hooks/useWebRTC';

export function ScreenShareCanvas() {
  const containerRef = useRef(null);
  const videoRef = useRef(null);
  const { screenShareState, stopScreenShare, isHost } = useParty();
  const { user } = useAuth();
  const { localStream, remoteStream, isSupported } = useWebRTC();

  const [isAudioMuted, setIsAudioMuted] = useState(false);

  const isPresenter = screenShareState.sharerId === user?.id;
  const activeStream = isPresenter ? localStream : remoteStream;

  useEffect(() => {
    if (videoRef.current && activeStream) {
      videoRef.current.srcObject = activeStream;
    }
  }, [activeStream]);

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(err => console.error(err));
    } else {
      document.exitFullscreen();
    }
  };

  const toggleAudio = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isAudioMuted;
      setIsAudioMuted(!isAudioMuted);
    }
  };

  const surfaceLabel = screenShareState.surfaceType || "Screen Share";

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full bg-slate-950 flex items-center justify-center overflow-hidden rounded-2xl border border-indigo-500/20 shadow-cinema group"
    >
      {/* Unsupported Browser Warning */}
      {!isSupported && (
        <div className="text-center p-8 max-w-md mx-auto animate-fade-in">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-amber-400" />
          </div>
          <h3 className="text-lg font-bold text-slate-100 mb-2">Screen Sharing Unavailable</h3>
          <p className="text-xs text-slate-400 mb-4">
            Screen sharing isn't supported on this device/browser. Please use a desktop browser like Chrome, Edge, Firefox, or Brave.
          </p>
        </div>
      )}

      {/* Screen Video Display */}
      {isSupported && activeStream ? (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted={isPresenter || isAudioMuted}
          className="w-full h-full object-contain"
        />
      ) : isSupported && (
        /* Connecting / Loading Radar Overlay */
        <div className="text-center p-8 animate-fade-in">
          <div className="relative w-24 h-24 rounded-3xl bg-indigo-600/15 border border-indigo-500/30 flex items-center justify-center mx-auto mb-5 animate-pulse-slow">
            <Monitor className="w-10 h-10 text-indigo-400" />
            <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-indigo-500 animate-ping" />
          </div>
          <div className="flex items-center justify-center gap-2 mb-2">
            <Radio className="w-4 h-4 text-indigo-400 animate-pulse" />
            <h3 className="text-base font-bold text-slate-100">
              {isPresenter ? "Initializing Screen Capture..." : "Connecting to Screen Stream..."}
            </h3>
          </div>
          <p className="text-xs text-slate-400 mb-1">
            Presenter: <span className="text-indigo-300 font-semibold">{screenShareState.sharerName || "Presenter"}</span>
          </p>
          <p className="text-[11px] text-slate-500 max-w-xs mx-auto mb-6">
            Establishing low-latency WebRTC broadcast stream directly from presenter.
          </p>

          {(isPresenter || isHost) && (
            <button
              onClick={stopScreenShare}
              className="btn-danger mx-auto text-xs px-4 py-2"
            >
              <StopCircle className="w-4 h-4" /> Cancel Screen Share
            </button>
          )}
        </div>
      )}

      {/* Top Glassmorphic Indicator Overlay Bar */}
      {activeStream && (
        <div className="absolute top-0 left-0 right-0 p-3.5 bg-gradient-to-b from-black/85 via-black/40 to-transparent flex items-center justify-between gap-3 opacity-90 group-hover:opacity-100 transition-opacity">
          
          {/* Left: Live status & presenter badges */}
          <div className="flex items-center gap-2 flex-wrap min-w-0">
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-red-600/90 text-white text-xs font-bold tracking-wide shadow-glow-sm">
              <span className="w-2 h-2 rounded-full bg-white animate-ping" />
              LIVE SCREEN SHARE
            </span>

            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-surface/80 border border-slate-700/60 backdrop-blur-md text-xs">
              <span className="text-slate-400">Presenter:</span>
              <span className="font-semibold text-indigo-300 truncate max-w-[140px]">
                {isPresenter ? "You" : screenShareState.sharerName || "Presenter"}
              </span>
            </div>

            {/* Display Surface badge */}
            <div className="hidden sm:flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-950/70 border border-indigo-500/30 backdrop-blur-md text-[11px] font-medium text-indigo-200">
              <Monitor className="w-3 h-3 text-indigo-400" />
              <span>{surfaceLabel}</span>
            </div>

            {/* Audio status pill */}
            <div className="hidden md:flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-900/80 border border-slate-700/60 backdrop-blur-md text-[11px] text-slate-300">
              {screenShareState.hasAudio ? (
                <>
                  <Volume2 className="w-3 h-3 text-emerald-400" />
                  <span className="text-emerald-300">Screen Audio Active</span>
                </>
              ) : (
                <>
                  <VolumeX className="w-3 h-3 text-slate-400" />
                  <span className="text-slate-400">Screen Audio Unavailable</span>
                </>
              )}
            </div>
          </div>

          {/* Right: Controls */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Audio Mute toggle for viewers when system audio present */}
            {!isPresenter && screenShareState.hasAudio && (
              <button
                onClick={toggleAudio}
                className="p-1.5 rounded-lg bg-surface/80 hover:bg-surface text-slate-300 border border-slate-700 transition-all"
                title={isAudioMuted ? "Unmute Screen Audio" : "Mute Screen Audio"}
              >
                {isAudioMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
              </button>
            )}

            {/* Fullscreen button */}
            <button
              onClick={toggleFullscreen}
              className="p-1.5 rounded-lg bg-surface/80 hover:bg-surface text-slate-300 border border-slate-700 transition-all"
              title="Toggle Fullscreen"
            >
              <Maximize className="w-4 h-4" />
            </button>

            {/* Stop Sharing button */}
            {(isPresenter || isHost) && (
              <button
                onClick={stopScreenShare}
                title="Stop Screen Share"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white text-xs font-semibold shadow-glow-sm transition-all"
              >
                <StopCircle className="w-3.5 h-3.5" />
                <span>Stop Sharing</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Local Presenter Preview Card Badge */}
      {isPresenter && activeStream && (
        <div className="absolute bottom-4 left-4 p-3 rounded-xl bg-slate-900/90 border border-indigo-500/40 backdrop-blur-md shadow-2xl flex items-center gap-3 animate-fade-in pointer-events-none">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
          <div className="text-left">
            <p className="text-xs font-bold text-white">YOU ARE SHARING YOUR SCREEN</p>
            <p className="text-[10px] text-indigo-300">{surfaceLabel} • WebRTC Active</p>
          </div>
        </div>
      )}
    </div>
  );
}
