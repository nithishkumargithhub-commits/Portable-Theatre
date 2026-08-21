import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { socketManager } from '../services/socket';
import { logWatchSessionApi } from '../services/api';
import { useAuth } from './AuthContext';

const PartyContext = createContext();

export function PartyProvider({ children }) {
  const { user, token } = useAuth();
  const [currentParty, setCurrentParty] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [playbackState, setPlaybackState] = useState({
    is_playing: false,
    current_timestamp: 0,
    video_url: "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8",
    video_title: "Big Buck Bunny 4K (HLS)",
    video_source_type: "hls"
  });
  const [chatMessages, setChatMessages] = useState([]);
  const [activeReactions, setActiveReactions] = useState([]);
  const [localFileBlobUrl, setLocalFileBlobUrl] = useState(null);
  const [screenShareState, setScreenShareState] = useState({
    isSharing: false,
    sharerId: null,
    sharerName: null,
    pendingRequest: null
  });
  const joinedTimeRef = useRef(null);

  const joinParty = useCallback((partyObj) => {
    setCurrentParty(partyObj);
    joinedTimeRef.current = Date.now();
    const activeUser = user || JSON.parse(localStorage.getItem('pt_user') || 'null');
    if (activeUser) {
      socketManager.connect(partyObj.id, activeUser.id, activeUser.username);
    }
  }, [user]);

  useEffect(() => {
    if (currentParty && user) {
      if (!joinedTimeRef.current) joinedTimeRef.current = Date.now();
      socketManager.connect(currentParty.id, user.id, user.username);
    }
  }, [currentParty, user]);

  const leaveParty = useCallback(() => {
    if (currentParty && joinedTimeRef.current) {
      const durationSec = Math.floor((Date.now() - joinedTimeRef.current) / 1000);
      if (durationSec >= 3) {
        logWatchSessionApi(
          {
            party_id: currentParty.id,
            party_title: currentParty.title || "Watch Party",
            duration_seconds: durationSec
          },
          token
        );
      }
      joinedTimeRef.current = null;
    }

    socketManager.disconnect();
    setCurrentParty(null);
    setParticipants([]);
    setChatMessages([]);
    setScreenShareState({ isSharing: false, sharerId: null, sharerName: null, pendingRequest: null });
  }, [currentParty, token]);

  // Subscribe to real-time events
  useEffect(() => {
    const unsubscribe = socketManager.subscribe((msg) => {
      const { type, data, server_time } = msg;

      if (type === "SYNC_STATE") {
        setPlaybackState((prev) => ({
          ...prev,
          is_playing: data.is_playing,
          current_timestamp: data.current_timestamp,
          video_url: data.video_url || prev.video_url,
          video_title: data.video_title || prev.video_title,
          video_source_type: data.video_source_type || prev.video_source_type
        }));
        if (data.active_screen_share_user) {
          setScreenShareState(prev => ({
            ...prev,
            isSharing: true,
            sharerId: data.active_screen_share_user
          }));
        }
      } else if (type === "PARTICIPANTS_UPDATE") {
        setParticipants(data || []);
      } else if (type === "PLAYBACK_UPDATE") {
        setPlaybackState((prev) => ({
          ...prev,
          is_playing: data.is_playing,
          current_timestamp: data.current_timestamp
        }));
      } else if (type === "SOURCE_CHANGED") {
        setPlaybackState((prev) => ({
          ...prev,
          video_url: data.video_url,
          video_title: data.video_title,
          video_source_type: data.video_source_type,
          current_timestamp: 0,
          is_playing: true
        }));
        // Reset screen share if active
        setScreenShareState({ isSharing: false, sharerId: null, sharerName: null, pendingRequest: null });
      } else if (type === "CHAT_MESSAGE") {
        setChatMessages((prev) => [...prev, data]);
      } else if (type === "REACTION") {
        const newReaction = {
          id: Math.random().toString(36).substring(2, 9),
          emoji: data.emoji,
          username: data.username,
          x: Math.floor(Math.random() * 70) + 15, // percentage
        };
        setActiveReactions((prev) => [...prev, newReaction]);
        setTimeout(() => {
          setActiveReactions((prev) => prev.filter((r) => r.id !== newReaction.id));
        }, 2500);
      } else if (type === "SCREEN_SHARE_REQUEST") {
        setScreenShareState(prev => ({
          ...prev,
          pendingRequest: {
            requesterId: data.requester_id,
            requesterName: data.requester_name
          }
        }));
      } else if (type === "SCREEN_SHARE_APPROVED") {
        setScreenShareState(prev => ({
          ...prev,
          isSharing: true,
          sharerId: data.sharer_id,
          sharerName: data.approved_by || "Presenter",
          pendingRequest: null,
          surfaceType: data.surface_type || prev.surfaceType || "Screen",
          hasAudio: data.has_audio ?? prev.hasAudio ?? false
        }));
        setPlaybackState(prev => ({ ...prev, video_source_type: "screenshare", is_playing: true }));
      } else if (type === "SCREEN_SHARE_STOPPED") {
        setScreenShareState({ isSharing: false, sharerId: null, sharerName: null, pendingRequest: null, surfaceType: null, hasAudio: false });
        setPlaybackState(prev => ({ ...prev, video_source_type: "hls" }));
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const sendPlay = useCallback((timestamp) => {
    socketManager.send("PLAY", { timestamp });
  }, []);

  const sendPause = useCallback((timestamp) => {
    socketManager.send("PAUSE", { timestamp });
  }, []);

  const sendSeek = useCallback((timestamp) => {
    socketManager.send("SEEK", { timestamp });
  }, []);

  const changeSource = useCallback((video_url, video_title, video_source_type = "hls") => {
    socketManager.send("CHANGE_SOURCE", { video_url, video_title, video_source_type });
  }, []);

  const sendChatMessage = useCallback((message) => {
    if (!user) return;
    socketManager.send("CHAT_MESSAGE", { message, username: user.username });
  }, [user]);

  const sendReaction = useCallback((emoji) => {
    if (!user) return;
    socketManager.send("REACTION", { emoji, username: user.username });
  }, [user]);

  const requestScreenShare = useCallback(() => {
    if (!user) return;
    socketManager.send("SCREEN_SHARE_REQUEST", { user_id: user.id, username: user.username });
  }, [user]);

  const approveScreenShare = useCallback((targetUserId) => {
    socketManager.send("SCREEN_SHARE_APPROVE", { target_user_id: targetUserId });
  }, []);

  const stopScreenShare = useCallback(() => {
    socketManager.send("SCREEN_SHARE_STOP", {});
  }, []);

  const isHost = currentParty?.host_id === user?.id || currentParty?.host_id === "current_user";

  return (
    <PartyContext.Provider
      value={{
        currentParty,
        participants,
        playbackState,
        chatMessages,
        activeReactions,
        screenShareState,
        localFileBlobUrl,
        setLocalFileBlobUrl,
        isHost,
        joinParty,
        leaveParty,
        sendPlay,
        sendPause,
        sendSeek,
        changeSource,
        sendChatMessage,
        sendReaction,
        requestScreenShare,
        approveScreenShare,
        stopScreenShare,
        setScreenShareState
      }}
    >
      {children}
    </PartyContext.Provider>
  );
}

export function useParty() {
  return useContext(PartyContext);
}
