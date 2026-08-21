import React, { useRef, useEffect } from 'react';
import { Camera, CameraOff, Mic, MicOff, PhoneOff, Maximize2 } from 'lucide-react';

export function CameraGrid({ localStream, peers, isCameraEnabled, isAudioMuted, onToggleCamera, onToggleAudio }) {
  const localVideoRef = useRef(null);

  // Attach local stream safely WITHOUT resetting srcObject on every render
  useEffect(() => {
    if (localVideoRef.current && localStream && isCameraEnabled) {
      if (localVideoRef.current.srcObject !== localStream) {
        localVideoRef.current.srcObject = localStream;
      }
      localVideoRef.current.play().catch(e => {
        if (e.name !== 'AbortError') {
          console.warn("Local video playback exception:", e);
        }
      });
    }
  }, [localStream, isCameraEnabled]);

  const activePeersList = Object.entries(peers);
  const firstPeer = activePeersList.length > 0 ? activePeersList[0] : null;

  return (
    <div className="relative w-full h-full aspect-video lg:aspect-auto min-h-[380px] bg-[#0b0c14] rounded-2xl border border-purple-500/40 shadow-glow-purple overflow-hidden flex flex-col justify-between group">

      {/* Top Status Bar Indicator */}
      <div className="absolute top-4 left-4 z-20 flex items-center gap-2">
        {isCameraEnabled && (
          <span className="flex items-center gap-1.5 px-3 py-1 bg-slate-950/80 border border-emerald-500/40 rounded-full text-xs font-semibold text-emerald-400 backdrop-blur-md">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Camera Active</span>
          </span>
        )}
        {isCameraEnabled && (
          <span className={`flex items-center gap-1 px-3 py-1 bg-slate-950/80 border rounded-full text-xs font-semibold backdrop-blur-md ${
            isAudioMuted ? 'border-red-500/40 text-red-400' : 'border-emerald-500/40 text-emerald-400'
          }`}>
            {isAudioMuted ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5 text-emerald-400 animate-bounce" />}
            <span>{isAudioMuted ? 'Mic Muted' : 'Mic Active'}</span>
          </span>
        )}
      </div>

      {/* Video Feed Content */}
      <div className="relative w-full h-full flex-1 bg-black flex items-center justify-center overflow-hidden">
        {firstPeer && firstPeer[1].stream ? (
          <RemoteCameraTile peerData={firstPeer[1]} />
        ) : isCameraEnabled && localStream ? (
          <video
            ref={localVideoRef}
            autoPlay
            muted
            playsInline
            className="w-full h-full object-cover transform scale-x-[-1]"
          />
        ) : (
          /* Clean Glassmorphic Camera Off Card */
          <div className="relative w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-purple-950/30 via-[#0b0c14] to-slate-950 p-6 text-center gap-3">
            <div className="w-16 h-16 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center shadow-inner">
              <CameraOff className="w-8 h-8 text-purple-400 opacity-80" />
            </div>
            <div className="space-y-1">
              <h4 className="text-sm font-bold text-slate-200">Camera & Microphone Off</h4>
              <p className="text-xs text-slate-500 max-w-[260px]">
                Click the camera or microphone button below to turn on your live feed
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Controls Overlay */}
      <div className="absolute bottom-4 left-0 right-0 z-20 px-6 flex items-center justify-between pointer-events-none">
        <div className="w-8" /> {/* spacer */}

        {/* Center Round Action Buttons */}
        <div className="flex items-center gap-3 pointer-events-auto">
          {/* Camera Button */}
          <button
            onClick={onToggleCamera}
            className={`w-11 h-11 rounded-full flex items-center justify-center text-white transition-all backdrop-blur-md shadow-lg ${
              isCameraEnabled ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/30' : 'bg-red-600 hover:bg-red-500'
            }`}
            title="Toggle Camera"
          >
            {isCameraEnabled ? <Camera className="w-5 h-5" /> : <CameraOff className="w-5 h-5" />}
          </button>

          {/* Microphone Button */}
          <button
            onClick={onToggleAudio}
            className={`w-11 h-11 rounded-full flex items-center justify-center text-white transition-all backdrop-blur-md shadow-lg ${
              isAudioMuted ? 'bg-red-600 hover:bg-red-500' : 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/30'
            }`}
            title="Toggle Mic"
          >
            {isAudioMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </button>

          {/* End Call / Stop Camera */}
          <button
            onClick={onToggleCamera}
            className="w-12 h-12 rounded-full bg-red-600 hover:bg-red-500 text-white flex items-center justify-center shadow-lg shadow-red-600/30 transition-all active:scale-95"
            title="End Video Call"
          >
            <PhoneOff className="w-5 h-5" />
          </button>
        </div>

        {/* Right: Expand Button */}
        <div className="pointer-events-auto">
          <button
            className="p-2 rounded-xl bg-slate-950/70 hover:bg-slate-900 border border-slate-800 text-slate-300 hover:text-white backdrop-blur-md transition-all"
            title="Full Video View"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>
      </div>

    </div>
  );
}

function RemoteCameraTile({ peerData }) {
  const videoRef = useRef(null);

  useEffect(() => {
    if (videoRef.current && peerData.stream) {
      if (videoRef.current.srcObject !== peerData.stream) {
        videoRef.current.srcObject = peerData.stream;
      }
      videoRef.current.play().catch(e => console.warn("Remote video auto-play blocked", e));
    }
  }, [peerData.stream]);

  return (
    <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
  );
}
