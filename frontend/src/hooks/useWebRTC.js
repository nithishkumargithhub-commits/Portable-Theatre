import { useState, useRef, useEffect, useCallback } from 'react';
import { useParty } from '../context/PartyContext';
import { useAuth } from '../context/AuthContext';
import { socketManager } from '../services/socket';

// Shared module-level singleton state to prevent duplicate pickers across hook instances
let globalLocalStream = null;
let isPickerOpen = false;
let activeSessionSharerId = null;

export function useWebRTC() {
  const { screenShareState, stopScreenShare, setScreenShareState, participants } = useParty();
  const { user } = useAuth();

  const [localStream, setLocalStream] = useState(globalLocalStream);
  const [remoteStream, setRemoteStream] = useState(null);
  const [isScreenCapturing, setIsScreenCapturing] = useState(!!globalLocalStream);
  const [isMicMuted, setIsMicMuted] = useState(false);
  const [error, setError] = useState(null);
  const [connectionState, setConnectionState] = useState(globalLocalStream ? 'connected' : 'idle'); // idle, connecting, connected, ended

  const localStreamRef = useRef(globalLocalStream);
  const peerConnectionsRef = useRef({});

  // Clean up all active WebRTC screen connections
  const cleanupWebRTC = useCallback(() => {
    Object.values(peerConnectionsRef.current).forEach(pc => {
      try {
        pc.close();
      } catch (err) {
        // ignore
      }
    });
    peerConnectionsRef.current = {};
    setRemoteStream(null);
    setConnectionState('idle');
  }, []);

  // Stop local screen stream tracks
  const stopLocalStream = useCallback(() => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => {
        try { track.stop(); } catch(e){}
      });
      localStreamRef.current = null;
    }
    if (globalLocalStream) {
      globalLocalStream.getTracks().forEach(track => {
        try { track.stop(); } catch(e){}
      });
      globalLocalStream = null;
    }
    isPickerOpen = false;
    activeSessionSharerId = null;
    setLocalStream(null);
    setIsScreenCapturing(false);
    cleanupWebRTC();
  }, [cleanupWebRTC]);

  // Feature detection
  const isSupported = typeof navigator !== 'undefined' && !!navigator.mediaDevices?.getDisplayMedia;

  // Presenter side P2P Peer Connection
  const createPresenterPeerConnection = useCallback((targetUserId, stream) => {
    if (peerConnectionsRef.current[targetUserId]) return peerConnectionsRef.current[targetUserId];

    const pc = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' }
      ]
    });

    peerConnectionsRef.current[targetUserId] = pc;

    stream.getTracks().forEach(track => {
      pc.addTrack(track, stream);
    });

    pc.onicecandidate = (event) => {
      if (event.candidate && socketManager) {
        socketManager.send("WEBRTC_ICE_CANDIDATE", {
          target_user_id: targetUserId,
          signal: event.candidate
        });
      }
    };

    pc.createOffer()
      .then(offer => pc.setLocalDescription(offer))
      .then(() => {
        if (socketManager) {
          socketManager.send("WEBRTC_OFFER", {
            target_user_id: targetUserId,
            signal: pc.localDescription
          });
        }
      })
      .catch(err => console.error("Error creating screen share offer", err));

    return pc;
  }, []);

  // Broadcast WebRTC Offer to participants
  const broadcastScreenOffer = useCallback((stream) => {
    if (!socketManager || !stream || !participants) return;

    participants.forEach(p => {
      if (p.user_id !== user?.id) {
        createPresenterPeerConnection(p.user_id, stream);
      }
    });
  }, [participants, user?.id, createPresenterPeerConnection]);

  // Start Screen Sharing via native browser picker
  const startScreenShare = async () => {
    setError(null);

    // Guard: Return active stream or block if picker is already open
    if (globalLocalStream) {
      return globalLocalStream;
    }
    if (isPickerOpen) {
      return null;
    }

    if (!isSupported) {
      const msg = "Screen sharing is not supported on this browser/device.";
      setError(msg);
      console.warn(msg);
      return null;
    }

    try {
      isPickerOpen = true;
      setConnectionState('connecting');
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          cursor: "always"
        },
        audio: true
      });

      globalLocalStream = stream;
      localStreamRef.current = stream;
      isPickerOpen = false;
      activeSessionSharerId = user?.id;

      const videoTrack = stream.getVideoTracks()[0];
      const audioTracks = stream.getAudioTracks();
      const hasAudio = audioTracks.length > 0;

      // Extract display surface type from settings if available
      let surfaceType = "Screen";
      if (videoTrack && typeof videoTrack.getSettings === 'function') {
        const settings = videoTrack.getSettings();
        if (settings.displaySurface === 'monitor') surfaceType = "Entire Screen";
        else if (settings.displaySurface === 'window') surfaceType = "Window";
        else if (settings.displaySurface === 'browser') surfaceType = "Browser Tab";
      }

      setLocalStream(stream);
      setIsScreenCapturing(true);

      // Update screen share state in context with metadata
      if (setScreenShareState) {
        setScreenShareState(prev => ({
          ...prev,
          surfaceType,
          hasAudio
        }));
      }

      // Native browser stop sharing listener
      const handleEnded = () => {
        stopScreenShare();
        stopLocalStream();
      };

      if (videoTrack) {
        videoTrack.onended = handleEnded;
        videoTrack.addEventListener('ended', handleEnded);
      }

      setConnectionState('connected');

      // Initiate P2P WebRTC offers to other participants in room
      broadcastScreenOffer(stream);

      return stream;
    } catch (err) {
      console.warn("Screen share cancelled or permission denied", err);
      isPickerOpen = false;
      globalLocalStream = null;
      activeSessionSharerId = null;
      setConnectionState('idle');
      stopScreenShare();
      stopLocalStream();
      if (err.name !== 'NotAllowedError' && err.name !== 'AbortError') {
        setError(err.message || "Failed to start screen share");
      }
      return null;
    }
  };

  // Handle incoming signaling for screen sharing (for viewers & presenter)
  useEffect(() => {
    if (!socketManager) return;

    const unsubscribe = socketManager.subscribe((msg) => {
      const { type, data } = msg;

      // Handle WEBRTC_OFFER on Viewer side
      if (type === "WEBRTC_OFFER") {
        if (data.sender_id !== user?.id) {
          setConnectionState('connecting');
          const pc = new RTCPeerConnection({
            iceServers: [
              { urls: 'stun:stun.l.google.com:19302' },
              { urls: 'stun:stun1.l.google.com:19302' }
            ]
          });

          peerConnectionsRef.current[data.sender_id] = pc;

          pc.ontrack = (event) => {
            if (event.streams && event.streams[0]) {
              setRemoteStream(event.streams[0]);
              setConnectionState('connected');
            }
          };

          pc.onicecandidate = (event) => {
            if (event.candidate && socketManager) {
              socketManager.send("WEBRTC_ICE_CANDIDATE", {
                target_user_id: data.sender_id,
                signal: event.candidate
              });
            }
          };

          pc.setRemoteDescription(new RTCSessionDescription(data.signal))
            .then(() => pc.createAnswer())
            .then(answer => pc.setLocalDescription(answer))
            .then(() => {
              socketManager.send("WEBRTC_ANSWER", {
                target_user_id: data.sender_id,
                signal: pc.localDescription
              });
            })
            .catch(err => console.error("Error handling screen share offer", err));
        }
      }
      // Handle WEBRTC_ANSWER on Presenter side
      else if (type === "WEBRTC_ANSWER") {
        const pc = peerConnectionsRef.current[data.sender_id];
        if (pc) {
          pc.setRemoteDescription(new RTCSessionDescription(data.signal))
            .catch(err => console.error("Error setting screen share answer", err));
        }
      }
      // Handle ICE Candidate on both sides
      else if (type === "WEBRTC_ICE_CANDIDATE") {
        const pc = peerConnectionsRef.current[data.sender_id];
        if (pc && data.signal) {
          pc.addIceCandidate(new RTCIceCandidate(data.signal))
            .catch(err => console.error("Error adding screen share ICE candidate", err));
        }
      }
      // Clean up when screen share stops
      else if (type === "SCREEN_SHARE_STOPPED") {
        stopLocalStream();
      }
    });

    return () => {
      unsubscribe();
      stopLocalStream();
      cleanupWebRTC();
    };
  }, [socketManager, user?.id, stopLocalStream]);

  // When SCREEN_SHARE_APPROVED is received, if I am the presenter, automatically invoke startScreenShare ONCE
  useEffect(() => {
    if (
      screenShareState.isSharing &&
      screenShareState.sharerId === user?.id &&
      !globalLocalStream &&
      !isPickerOpen &&
      activeSessionSharerId !== user?.id
    ) {
      startScreenShare();
    }
  }, [screenShareState.isSharing, screenShareState.sharerId, user?.id]);

  const toggleMic = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMicMuted(!audioTrack.enabled);
      }
    }
  };

  const startLocalVideoStream = (videoElement) => {
    try {
      if (!videoElement) return null;
      let stream = null;
      if (typeof videoElement.captureStream === 'function') {
        stream = videoElement.captureStream();
      } else if (typeof videoElement.mozCaptureStream === 'function') {
        stream = videoElement.mozCaptureStream();
      }
      if (stream) {
        setLocalStream(stream);
        localStreamRef.current = stream;
        setIsScreenCapturing(true);
        return stream;
      }
    } catch (err) {
      console.warn("Failed to capture local video stream", err);
    }
    return null;
  };

  return {
    localStream,
    remoteStream,
    isScreenCapturing,
    isMicMuted,
    isSupported,
    error,
    connectionState,
    startScreenShare,
    startLocalVideoStream,
    stopLocalStream,
    toggleMic
  };
}

