import { useState, useRef, useEffect, useCallback } from 'react';

export function useWebRTCCamera(partyId, userId, userName, socketManager) {
  const [localStream, setLocalStream] = useState(null);
  const [peers, setPeers] = useState({}); // userId -> { stream, username, isAudioMuted, connectionQuality }
  const [isCameraEnabled, setIsCameraEnabled] = useState(false);
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [connectionQuality, setConnectionQuality] = useState('excellent');

  const localStreamRef = useRef(null);
  const peerConnectionsRef = useRef({});

  // Helper to create a fallback audio track if real mic is unavailable
  const createFallbackAudioTrack = () => {
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      gain.gain.value = 0.001; // subtle audible signal
      const dst = audioCtx.createMediaStreamDestination();
      osc.connect(gain);
      gain.connect(dst);
      osc.start();
      const track = dst.stream.getAudioTracks()[0];
      track.enabled = true;
      return track;
    } catch (e) {
      return null;
    }
  };

  // Helper to create a dynamic fallback video track if real camera is unavailable
  const createFallbackVideoTrack = (displayName) => {
    const canvas = document.createElement("canvas");
    canvas.width = 640;
    canvas.height = 480;
    const ctx = canvas.getContext("2d");

    let animFrame;
    let angle = 0;

    const render = () => {
      angle += 0.05;
      // Gradient background
      const grad = ctx.createLinearGradient(0, 0, 640, 480);
      grad.addColorStop(0, '#1e1b4b');
      grad.addColorStop(0.5, '#0f172a');
      grad.addColorStop(1, '#311b92');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 640, 480);

      // Pulsating circle
      const r = 55 + Math.sin(angle) * 12;
      ctx.beginPath();
      ctx.arc(320, 200, r, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(129, 140, 248, 0.25)';
      ctx.fill();
      ctx.lineWidth = 3;
      ctx.strokeStyle = '#818cf8';
      ctx.stroke();

      // Camera icon / Initials
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 42px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const initial = (displayName || 'U').charAt(0).toUpperCase();
      ctx.fillText(initial, 320, 200);

      // Name label
      ctx.fillStyle = '#cbd5e1';
      ctx.font = 'bold 16px sans-serif';
      ctx.fillText(`${displayName || 'You'} (Live Feed)`, 320, 300);

      animFrame = requestAnimationFrame(render);
    };

    render();

    const stream = canvas.captureStream(30);
    const track = stream.getVideoTracks()[0];
    track._cleanup = () => cancelAnimationFrame(animFrame);
    return track;
  };

  // 1. Start User Camera & Microphone
  const startCamera = useCallback(async () => {
    let videoTrack = null;
    let audioTrack = null;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' },
        audio: { echoCancellation: true, noiseSuppression: true }
      });
      videoTrack = stream.getVideoTracks()[0];
      audioTrack = stream.getAudioTracks()[0];
    } catch (err) {
      console.warn("Joint media capture unavailable, using fallback tracks", err);

      try {
        const vStream = await navigator.mediaDevices.getUserMedia({ video: true });
        videoTrack = vStream.getVideoTracks()[0];
      } catch (vErr) {
        videoTrack = createFallbackVideoTrack(userName);
      }

      try {
        const aStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        audioTrack = aStream.getAudioTracks()[0];
      } catch (aErr) {
        audioTrack = createFallbackAudioTrack();
      }
    }

    const tracks = [];
    if (videoTrack) tracks.push(videoTrack);
    if (audioTrack) {
      audioTrack.enabled = true;
      tracks.push(audioTrack);
    }

    const finalStream = new MediaStream(tracks);
    localStreamRef.current = finalStream;
    setLocalStream(finalStream);
    setIsCameraEnabled(true);
    setIsAudioMuted(false);

    if (socketManager) {
      socketManager.send("CAMERA_ENABLED", { user_id: userId, username: userName });
    }

    return finalStream;
  }, [socketManager, userId, userName]);

  // 2. Stop User Camera & Microphone
  const stopCamera = useCallback(() => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => {
        try {
          track.stop();
          if (track._cleanup) track._cleanup();
        } catch(e){}
      });
      localStreamRef.current = null;
    }
    setLocalStream(null);
    setIsCameraEnabled(false);
    setIsAudioMuted(false);

    if (socketManager) {
      socketManager.send("CAMERA_DISABLED", { user_id: userId });
    }

    Object.values(peerConnectionsRef.current).forEach(pc => {
      try { pc.close(); } catch(e){}
    });
    peerConnectionsRef.current = {};
    setPeers({});
  }, [socketManager, userId]);

  // 3. Toggle Microphone Mute / Unmute
  const toggleAudioMute = useCallback(() => {
    if (!localStreamRef.current) {
      // If camera/mic stream is not active yet, start it!
      startCamera();
      return;
    }

    const audioTracks = localStreamRef.current.getAudioTracks();
    if (audioTracks.length > 0) {
      const track = audioTracks[0];
      track.enabled = !track.enabled;
      const newMutedState = !track.enabled;
      setIsAudioMuted(newMutedState);

      if (socketManager) {
        socketManager.send(newMutedState ? "MUTE_AUDIO" : "UNMUTE_AUDIO", { user_id: userId });
      }
    } else {
      setIsAudioMuted(prev => !prev);
    }
  }, [socketManager, userId, startCamera]);

  // 4. Create P2P Peer Connection
  const createPeerConnection = useCallback((peerId, peerName, initiator = false) => {
    if (peerConnectionsRef.current[peerId]) return peerConnectionsRef.current[peerId];

    const pc = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' }
      ]
    });

    peerConnectionsRef.current[peerId] = pc;

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => pc.addTrack(track, localStreamRef.current));
    }

    pc.ontrack = (event) => {
      const [remoteStream] = event.streams;
      setPeers(prev => ({
        ...prev,
        [peerId]: {
          stream: remoteStream,
          username: peerName,
          isAudioMuted: false,
          connectionQuality: 'excellent'
        }
      }));
    };

    pc.onicecandidate = (event) => {
      if (event.candidate && socketManager) {
        socketManager.send("CAMERA_ICE_CANDIDATE", {
          target_user_id: peerId,
          signal: event.candidate
        });
      }
    };

    if (initiator) {
      pc.createOffer().then(offer => {
        pc.setLocalDescription(offer);
        if (socketManager) {
          socketManager.send("CAMERA_OFFER", {
            target_user_id: peerId,
            signal: offer
          });
        }
      }).catch(err => console.error("Error creating SDP offer", err));
    }

    return pc;
  }, [socketManager]);

  // 5. Handle WebSocket Events
  useEffect(() => {
    if (!socketManager) return;

    const unsubscribe = socketManager.subscribe((msg) => {
      const { type, data } = msg;

      if (type === "CAMERA_ENABLED") {
        if (data.user_id !== userId && isCameraEnabled) {
          createPeerConnection(data.user_id, data.username, true);
        }
      } else if (type === "CAMERA_DISABLED") {
        if (peerConnectionsRef.current[data.user_id]) {
          try { peerConnectionsRef.current[data.user_id].close(); } catch(e){}
          delete peerConnectionsRef.current[data.user_id];
        }
        setPeers(prev => {
          const updated = { ...prev };
          delete updated[data.user_id];
          return updated;
        });
      } else if (type === "CAMERA_OFFER") {
        if (data.sender_id !== userId) {
          const pc = createPeerConnection(data.sender_id, data.sender_name, false);
          pc.setRemoteDescription(new RTCSessionDescription(data.signal)).then(() => {
            return pc.createAnswer();
          }).then(answer => {
            pc.setLocalDescription(answer);
            socketManager.send("CAMERA_ANSWER", {
              target_user_id: data.sender_id,
              signal: answer
            });
          }).catch(err => console.error("Error setting SDP offer", err));
        }
      } else if (type === "CAMERA_ANSWER") {
        const pc = peerConnectionsRef.current[data.sender_id];
        if (pc) {
          pc.setRemoteDescription(new RTCSessionDescription(data.signal)).catch(err => console.error("Error setting SDP answer", err));
        }
      } else if (type === "CAMERA_ICE_CANDIDATE") {
        const pc = peerConnectionsRef.current[data.sender_id];
        if (pc && data.signal) {
          pc.addIceCandidate(new RTCIceCandidate(data.signal)).catch(err => console.error("Error adding ICE candidate", err));
        }
      } else if (type === "MUTE_AUDIO") {
        setPeers(prev => {
          if (!prev[data.user_id]) return prev;
          return {
            ...prev,
            [data.user_id]: { ...prev[data.user_id], isAudioMuted: true }
          };
        });
      } else if (type === "UNMUTE_AUDIO") {
        setPeers(prev => {
          if (!prev[data.user_id]) return prev;
          return {
            ...prev,
            [data.user_id]: { ...prev[data.user_id], isAudioMuted: false }
          };
        });
      }
    });

    return () => {
      unsubscribe();
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => {
          try {
            track.stop();
            if (track._cleanup) track._cleanup();
          } catch(e){}
        });
        localStreamRef.current = null;
      }
      Object.values(peerConnectionsRef.current).forEach(pc => {
        try { pc.close(); } catch(e){}
      });
      peerConnectionsRef.current = {};
    };
  }, [socketManager, userId, isCameraEnabled, createPeerConnection]);

  return {
    localStream,
    peers,
    isCameraEnabled,
    isAudioMuted,
    connectionQuality,
    startCamera,
    stopCamera,
    toggleAudioMute
  };
}
