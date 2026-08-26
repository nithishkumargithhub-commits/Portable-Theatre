import React, { useRef, useState, useEffect, useCallback } from 'react';
import {
  Play, Pause, Volume2, VolumeX, Maximize, RotateCcw, RotateCw, Radio, Settings,
  Tv, CheckCircle2, AlertTriangle, MonitorUp, Share2, FileVideo, Upload,
  Film, Camera, Download, X
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useParty } from '../context/PartyContext';
import { useSyncPlayer } from '../hooks/useSyncPlayer';
import { useWebRTC } from '../hooks/useWebRTC';
import { FloatingReactions } from './FloatingReactions';
import { ScreenShareCanvas } from './ScreenShareCanvas';

const PRESET_STREAMS = [
  { title: "Big Buck Bunny (4K HLS Stream)", url: "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8", type: "hls" },
  { title: "Tears of Steel (MP4 HD)", url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4", type: "mp4" },
  { title: "Sintel Open Movie (MP4 1080p)", url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4", type: "mp4" },
  { title: "Elephant's Dream (MP4)", url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4", type: "mp4" }
];

export function VideoPlayer() {
  const videoRef = useRef(null);
  const containerRef = useRef(null);
  const fileInputRef = useRef(null);
  const controlsTimeoutRef = useRef(null);

  const { user } = useAuth();
  const { playbackState, changeSource, isHost, screenShareState, requestScreenShare, approveScreenShare, stopScreenShare, setLocalFileBlobUrl, localFileBlobUrl } = useParty();
  const { driftMs, handlePlay, handlePause, handleSeek, manualResync } = useSyncPlayer(videoRef);
  const { isSupported } = useWebRTC();

  const handleShareClick = () => {
    if (!isSupported) {
      alert("Screen sharing isn't supported on this device/browser.");
      return;
    }
    if (isHost) {
      approveScreenShare(user?.id);
    } else {
      requestScreenShare();
    }
  };

  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [isScrubbing, setIsScrubbing] = useState(false);
  const [scrubTime, setScrubTime] = useState(0);
  const [showControls, setShowControls] = useState(true);
  const [showLocalNotice, setShowLocalNotice] = useState(false);
  const [showSourceModal, setShowSourceModal] = useState(false);
  const [modalTab, setModalTab] = useState('preset');
  const [customUrlInput, setCustomUrlInput] = useState('');
  const [customTitleInput, setCustomTitleInput] = useState('');
  const [screenshotToast, setScreenshotToast] = useState(false);

  // Auto-dismiss local file notification after 3 seconds
  useEffect(() => {
    if (playbackState.video_source_type === 'local_file') {
      setShowLocalNotice(true);
      const timer = setTimeout(() => {
        setShowLocalNotice(false);
      }, 3000);
      return () => clearTimeout(timer);
    } else {
      setShowLocalNotice(false);
    }
  }, [playbackState.video_source_type, playbackState.video_url, playbackState.video_title]);

  const handleCaptureScreenshot = () => {
    try {
      const video = videoRef.current;
      if (!video) return;
      const canvas = document.createElement('canvas');
      const width = video.videoWidth || 1280;
      const height = video.videoHeight || 720;
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0, width, height);
      const barHeight = Math.max(60, Math.floor(height * 0.08));
      ctx.fillStyle = "rgba(15, 23, 42, 0.9)";
      ctx.fillRect(0, height - barHeight, width, barHeight);
      ctx.fillStyle = "#6366f1";
      ctx.fillRect(0, height - barHeight, width, 4);
      ctx.font = `bold ${Math.floor(barHeight * 0.35)}px sans-serif`;
      ctx.fillStyle = "#ffffff";
      ctx.fillText("🎬 PORTABLE THEATRE — Wholesome Party Moment", 24, height - barHeight / 2);
      ctx.font = `${Math.floor(barHeight * 0.28)}px sans-serif`;
      ctx.fillStyle = "#94a3b8";
      ctx.fillText(`${playbackState.video_title || "Watch Party"} | ${new Date().toLocaleTimeString()}`, 24, height - barHeight / 5);
      const dataUrl = canvas.toDataURL("image/png");
      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = `wholesome-moment-${Date.now()}.png`;
      a.click();
      setScreenshotToast(true);
      setTimeout(() => setScreenshotToast(false), 3000);
    } catch (err) {
      console.warn("Screenshot capture error", err);
    }
  };

  const handleLocalFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      const blobUrl = URL.createObjectURL(file);
      setLocalFileBlobUrl(blobUrl);
      changeSource(blobUrl, file.name, 'local_file');
      setShowSourceModal(false);
      setShowLocalNotice(true);
      setTimeout(() => setShowLocalNotice(false), 3000);
    }
  };

  // Robust duration and timeupdate event listeners
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const updateDuration = () => {
      if (video.duration && !isNaN(video.duration) && isFinite(video.duration)) {
        setDuration(video.duration);
      }
    };

    const onTimeUpdate = () => {
      if (!isScrubbing) {
        setCurrentTime(video.currentTime || 0);
      }
      updateDuration();
    };

    video.addEventListener('loadedmetadata', updateDuration);
    video.addEventListener('durationchange', updateDuration);
    video.addEventListener('timeupdate', onTimeUpdate);

    updateDuration();

    return () => {
      video.removeEventListener('loadedmetadata', updateDuration);
      video.removeEventListener('durationchange', updateDuration);
      video.removeEventListener('timeupdate', onTimeUpdate);
    };
  }, [isScrubbing]);

  // Forward / Rewind quick skip handler
  const handleSkip = useCallback((deltaSeconds) => {
    const video = videoRef.current;
    const maxDur = duration || video?.duration || 0;
    const activeTime = isScrubbing ? scrubTime : (currentTime || video?.currentTime || 0);
    const targetTime = Math.max(0, Math.min(maxDur > 0 ? maxDur : 99999, activeTime + deltaSeconds));

    setCurrentTime(targetTime);
    setScrubTime(targetTime);
    handleSeek(targetTime);
  }, [duration, currentTime, isScrubbing, scrubTime, handleSeek]);

  // Keyboard controls for seeking & playback
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName)) return;
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        handleSkip(10);
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        handleSkip(-10);
      } else if (e.key === ' ' || e.key === 'k') {
        e.preventDefault();
        playbackState.is_playing ? handlePause() : handlePlay();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleSkip, playbackState.is_playing, handlePause, handlePlay]);

  const handleMouseMove = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    controlsTimeoutRef.current = setTimeout(() => {
      if (playbackState.is_playing) setShowControls(false);
    }, 3500);
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    videoRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const handleVolumeChange = (e) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    if (videoRef.current) {
      videoRef.current.volume = val;
      videoRef.current.muted = val === 0;
    }
    setIsMuted(val === 0);
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch((err) => console.log(err));
    } else {
      document.exitFullscreen().catch((err) => console.log(err));
    }
  };

  const formatTime = (secs) => {
    if (!secs || isNaN(secs) || !isFinite(secs)) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const handleSourceSelect = (preset) => {
    changeSource(preset.url, preset.title, preset.type);
    setShowSourceModal(false);
  };

  const handleCustomSourceSubmit = (e) => {
    e.preventDefault();
    if (!customUrlInput.trim()) return;
    const title = customTitleInput.trim() || 'Custom Stream';
    const type = customUrlInput.endsWith('.m3u8') ? 'hls' : 'mp4';
    changeSource(customUrlInput.trim(), title, type);
    setShowSourceModal(false);
    setCustomUrlInput('');
    setCustomTitleInput('');
  };

  const activeTimeDisplay = isScrubbing ? scrubTime : currentTime;
  const activeDuration = duration > 0 ? duration : (videoRef.current?.duration || 0);
  const progress = activeDuration > 0 ? Math.min(100, Math.max(0, (activeTimeDisplay / activeDuration) * 100)) : 0;

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      className="relative w-full h-full bg-black rounded-2xl overflow-hidden shadow-cinema group border border-slate-800/80 flex flex-col justify-center"
    >
      {/* Top Header Overlay */}
      <div className={`absolute top-0 left-0 right-0 z-30 p-4 bg-gradient-to-b from-black/80 via-black/40 to-transparent flex items-center justify-between transition-opacity duration-300 ${showControls && !screenShareState.isSharing ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-indigo-600/20 text-indigo-400 flex items-center justify-center border border-indigo-500/30">
            <Tv className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-100 truncate max-w-xs sm:max-w-md">
              {playbackState.video_title || "Untitled Video"}
            </h2>
            <div className="flex items-center gap-2 text-[11px] text-slate-400 font-mono">
              <span>{playbackState.video_source_type?.toUpperCase() || "HLS"}</span>
              <span>•</span>
              <span className={driftMs < 300 ? "text-emerald-400 font-semibold" : "text-amber-400 font-semibold"}>
                Sync Drift: {driftMs}ms
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Wholesome Snapshot Button */}
          <button
            onClick={handleCaptureScreenshot}
            title="Take a Wholesome Party Moment Snapshot"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/30 text-xs font-semibold transition-all active:scale-95"
          >
            <Camera className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Moment</span>
          </button>

          {/* Screen Share Button */}
          <button
            onClick={handleShareClick}
            title={screenShareState.isSharing ? 'Sharing Screen' : 'Share Screen'}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all active:scale-95 ${
              screenShareState.isSharing
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                : 'bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border-indigo-500/30'
            }`}
          >
            <MonitorUp className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">
              {screenShareState.isSharing ? 'Sharing Screen' : 'Share Screen'}
            </span>
          </button>

          {isHost && (
            <button
              onClick={() => setShowSourceModal(true)}
              className="btn-secondary text-xs py-1.5 px-3 flex items-center gap-1.5"
            >
              <Film className="w-3.5 h-3.5" />
              <span>Change Source</span>
            </button>
          )}

          <button
            onClick={manualResync}
            title="Manual Resync"
            className="p-2 rounded-xl bg-slate-800/80 text-slate-300 hover:text-white border border-slate-700/50 transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Snapshot Toast Notification */}
      {screenshotToast && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-40 px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold shadow-lg flex items-center gap-2 animate-bounce">
          <CheckCircle2 className="w-4 h-4" />
          <span>Wholesome Party Moment Captured & Downloaded!</span>
        </div>
      )}

      {/* Local screening popup notice - Auto-dismisses after 3 seconds */}
      {showLocalNotice && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-40 p-3 px-4 rounded-2xl bg-slate-900/90 border border-amber-500/40 text-amber-200 text-xs flex items-center gap-3 backdrop-blur-xl shadow-2xl animate-fade-in max-w-lg w-11/12 sm:w-auto">
          <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 border border-amber-500/30">
            <Film className="w-4 h-4" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-slate-100 truncate">Local Screening: "{playbackState.video_title}"</p>
            <p className="text-[11px] text-slate-400">Host is screening local video file.</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {!localFileBlobUrl && (
              <button onClick={() => fileInputRef.current?.click()} className="btn-primary text-[11px] py-1 px-2.5">
                <Upload className="w-3 h-3" /> Pick File
              </button>
            )}
            <button
              onClick={() => setShowLocalNotice(false)}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              title="Dismiss Popup"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Video element or Screen Share Canvas */}
      <div
        className="relative w-full h-full flex items-center justify-center bg-black cursor-pointer"
        onClick={(e) => {
          if (e.target.tagName === 'VIDEO' || e.target.classList.contains('cursor-pointer')) {
            playbackState.is_playing ? handlePause() : handlePlay();
          }
        }}
      >
        <video
          ref={videoRef}
          className={`w-full h-full object-contain ${screenShareState.isSharing ? 'hidden' : 'block'}`}
          playsInline
        />

        {/* Screen Share Overlay component */}
        {screenShareState.isSharing && (
          <div className="w-full h-full flex items-center justify-center">
            <ScreenShareCanvas />
          </div>
        )}

        {/* Floating Emojis Overlay */}
        <FloatingReactions />
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="video/*"
        onChange={handleLocalFileSelect}
        className="hidden"
      />

      {/* Bottom controls overlay */}
      <div className={`absolute bottom-0 left-0 right-0 z-30 bg-gradient-to-t from-black/95 via-black/70 to-transparent px-4 pb-4 pt-8 transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0'}`}>

        {/* Duration Bar Slider & Progress Line */}
        <div className="relative mb-3 group cursor-pointer flex items-center">
          {/* Interactive Scrubbing Range Input */}
          <input
            type="range"
            min={0}
            max={activeDuration > 0 ? activeDuration : 100}
            step={0.1}
            value={activeTimeDisplay}
            onMouseDown={() => setIsScrubbing(true)}
            onTouchStart={() => setIsScrubbing(true)}
            onChange={(e) => {
              const newTime = parseFloat(e.target.value);
              setScrubTime(newTime);
              setCurrentTime(newTime);
            }}
            onMouseUp={(e) => {
              setIsScrubbing(false);
              const newTime = parseFloat(e.target.value);
              handleSeek(newTime);
            }}
            onTouchEnd={(e) => {
              setIsScrubbing(false);
              const newTime = parseFloat(e.target.value);
              handleSeek(newTime);
            }}
            className="w-full h-3 rounded-lg appearance-none bg-transparent cursor-pointer z-20 opacity-0 group-hover:opacity-100 transition-opacity focus:outline-none"
          />

          {/* Styled Visual Progress Bar */}
          <div
            className="absolute inset-0 h-2 my-auto bg-slate-800/90 rounded-lg overflow-hidden pointer-events-none border border-slate-700/50"
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const ratio = (e.clientX - rect.left) / rect.width;
              const targetSec = ratio * activeDuration;
              setCurrentTime(targetSec);
              handleSeek(targetSec);
            }}
          >
            <div
              className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-400 rounded-lg transition-all duration-75 shadow-glow-purple"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <div className="flex items-center justify-between">
          {/* Left Controls: Rewind -10s, Play/Pause, Forward +10s, Volume, Time */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Rewind 10 seconds */}
            <button
              onClick={() => handleSkip(-10)}
              title="Rewind 10 seconds (Left Arrow)"
              className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/50 transition-all active:scale-95"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            {/* Play / Pause Toggle */}
            <button
              onClick={() => playbackState.is_playing ? handlePause() : handlePlay()}
              className="p-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white transition-all active:scale-95 shadow-glow-sm"
              title={playbackState.is_playing ? "Pause" : "Play"}
            >
              {playbackState.is_playing
                ? <Pause className="w-5 h-5 fill-current" />
                : <Play className="w-5 h-5 fill-current ml-0.5" />
              }
            </button>

            {/* Forward 10 seconds */}
            <button
              onClick={() => handleSkip(10)}
              title="Forward 10 seconds (Right Arrow)"
              className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/50 transition-all active:scale-95"
            >
              <RotateCw className="w-4 h-4" />
            </button>

            {/* Volume Control */}
            <div className="flex items-center gap-2 ml-1">
              <button onClick={toggleMute} className="text-slate-300 hover:text-white transition-colors">
                {isMuted || volume === 0 ? <VolumeX className="w-5 h-5 text-red-400" /> : <Volume2 className="w-5 h-5" />}
              </button>
              <input
                type="range" min={0} max={1} step={0.05}
                value={isMuted ? 0 : volume}
                onChange={handleVolumeChange}
                className="w-16 sm:w-20 h-1 rounded cursor-pointer accent-indigo-500"
              />
            </div>

            {/* Duration / Timestamp Display */}
            <div className="text-xs font-mono text-slate-400 ml-1">
              <span className="text-white font-semibold">{formatTime(activeTimeDisplay)}</span>
              {' '}/{' '}
              <span>{formatTime(activeDuration)}</span>
            </div>
          </div>

          {/* Right Controls: Quality indicator & Fullscreen */}
          <div className="flex items-center gap-2">
            <span className="hidden sm:block text-[10px] font-bold tracking-wider px-2 py-0.5 rounded-md bg-slate-800 text-indigo-400 border border-indigo-500/25">
              {playbackState.video_source_type === 'local_file' ? 'LOCAL' : '4K AUTO'}
            </span>
            <button
              onClick={toggleFullscreen}
              title="Toggle Fullscreen"
              className="p-2 text-slate-300 hover:text-white rounded-lg hover:bg-slate-800/80 transition-colors"
            >
              <Maximize className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Source Change Modal */}
      {showSourceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center modal-overlay p-4">
          <div className="glass-premium p-6 rounded-2xl max-w-lg w-full border border-slate-700/50 shadow-cinema">
            <div className="flex items-center gap-2 mb-4">
              <Tv className="w-5 h-5 text-indigo-400" />
              <h3 className="text-base font-bold text-slate-100">Select Stream Source</h3>
            </div>

            <div className="flex gap-1 p-1 bg-surface rounded-xl border border-slate-800 mb-5">
              {[['preset','🎬 Presets'], ['url','🌐 Custom URL'], ['local','📁 Local File']].map(([t, label]) => (
                <button
                  key={t} type="button"
                  onClick={() => setModalTab(t)}
                  className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${modalTab === t ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'}`}
                >
                  {label}
                </button>
              ))}
            </div>

            {modalTab === 'preset' && (
              <div className="space-y-2 mb-4">
                {PRESET_STREAMS.map((s, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSourceSelect(s)}
                    className="w-full flex items-center justify-between p-3 rounded-xl bg-surface hover:bg-surface-hover border border-slate-700/50 text-left transition-all hover:border-indigo-500/40"
                  >
                    <div>
                      <p className="text-xs font-semibold text-slate-200">{s.title}</p>
                      <p className="text-[10px] font-mono text-slate-500 truncate max-w-xs">{s.url}</p>
                    </div>
                    <span className="badge-indigo shrink-0 ml-2">{s.type.toUpperCase()}</span>
                  </button>
                ))}
              </div>
            )}

            {modalTab === 'url' && (
              <form onSubmit={handleCustomSourceSubmit} className="space-y-3">
                <input
                  type="text" placeholder="Stream Title…"
                  value={customTitleInput}
                  onChange={(e) => setCustomTitleInput(e.target.value)}
                  className="input-field"
                />
                <input
                  type="url" required placeholder="https://example.com/stream.m3u8"
                  value={customUrlInput}
                  onChange={(e) => setCustomUrlInput(e.target.value)}
                  className="input-field font-mono text-xs"
                />
                <div className="flex justify-end gap-2 pt-1">
                  <button type="button" onClick={() => setShowSourceModal(false)} className="btn-ghost text-sm px-4 py-2">Cancel</button>
                  <button type="submit" className="btn-primary text-sm px-5 py-2">Apply Source</button>
                </div>
              </form>
            )}

            {modalTab === 'local' && (
              <div className="relative border-2 border-dashed border-slate-700 hover:border-indigo-500 rounded-2xl p-8 text-center bg-surface/40 transition-all cursor-pointer">
                <input
                  type="file" accept="video/*"
                  onChange={handleLocalFileSelect}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                />
                <div className="w-12 h-12 rounded-2xl bg-indigo-600/15 text-indigo-400 flex items-center justify-center mx-auto mb-3 border border-indigo-500/25">
                  <FileVideo className="w-6 h-6" />
                </div>
                <p className="text-sm font-bold text-slate-200 mb-1">Select Local Video File</p>
                <p className="text-xs text-slate-500">MP4, MKV, WebM, MOV supported</p>
              </div>
            )}

            {modalTab !== 'url' && (
              <div className="flex justify-end pt-4">
                <button type="button" onClick={() => setShowSourceModal(false)} className="btn-ghost text-sm px-5 py-2">Close</button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
