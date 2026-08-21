import { useEffect, useRef, useState, useCallback } from 'react';
import Hls from 'hls.js';
import { useParty } from '../context/PartyContext';

export function useSyncPlayer(videoRef) {
  const { playbackState, sendPlay, sendPause, sendSeek, isHost, localFileBlobUrl } = useParty();
  const hlsRef = useRef(null);
  const [driftMs, setDriftMs] = useState(0);
  const isLocalUpdateRef = useRef(false);

  // Initialize HLS / Native / Local File video source
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !playbackState.video_url) return;

    if (playbackState.video_source_type === 'hls' || playbackState.video_url.endsWith('.m3u8')) {
      if (Hls.isSupported()) {
        if (hlsRef.current) {
          hlsRef.current.destroy();
        }
        const hls = new Hls({ enableWorker: true, lowLatencyMode: true });
        hls.loadSource(playbackState.video_url);
        hls.attachMedia(video);
        hlsRef.current = hls;
      } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = playbackState.video_url;
      }
    } else {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
      const targetUrl = (playbackState.video_source_type === 'local_file' && localFileBlobUrl)
        ? localFileBlobUrl
        : playbackState.video_url;

      if (video.src !== targetUrl) {
        video.src = targetUrl;
      }
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [playbackState.video_url, playbackState.video_source_type, localFileBlobUrl]);

  // Synchronize playback state changes from server / host
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const targetSec = (playbackState.current_timestamp || 0) / 1000;
    const currentSec = video.currentTime || 0;
    const diffMs = Math.abs(currentSec - targetSec) * 1000;
    setDriftMs(Math.round(diffMs));

    // Force seek if drift is greater than 800ms
    if (diffMs > 800 && isFinite(targetSec)) {
      isLocalUpdateRef.current = true;
      video.currentTime = targetSec;
      setTimeout(() => { isLocalUpdateRef.current = false; }, 200);
    }

    if (playbackState.is_playing) {
      const playPromise = video.play();
      if (playPromise !== undefined) {
        playPromise.catch((err) => {
          if (err.name === 'NotAllowedError') {
            video.muted = true;
            video.play().catch((e) => console.warn("Muted play failed:", e));
          } else if (err.name !== 'AbortError') {
            console.warn("Play error:", err);
          }
        });
      }
    } else {
      video.pause();
    }
  }, [playbackState.is_playing, playbackState.current_timestamp]);

  // Handle local user playback controls (play, pause, seek)
  const handlePlay = useCallback(() => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const currentMs = Math.round((video.currentTime || 0) * 1000);

    // Play locally immediately for snappy response
    const playPromise = video.play();
    if (playPromise !== undefined) {
      playPromise.catch((err) => {
        if (err.name === 'NotAllowedError') {
          video.muted = true;
          video.play().catch(e => console.warn(e));
        }
      });
    }

    sendPlay(currentMs);
  }, [sendPlay]);

  const handlePause = useCallback(() => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const currentMs = Math.round((video.currentTime || 0) * 1000);

    // Pause locally immediately for snappy response
    video.pause();

    sendPause(currentMs);
  }, [sendPause]);

  const handleSeek = useCallback((newTimeSec) => {
    if (!videoRef.current) return;
    isLocalUpdateRef.current = true;
    videoRef.current.currentTime = newTimeSec;
    const currentMs = Math.round(newTimeSec * 1000);
    sendSeek(currentMs);
    setTimeout(() => { isLocalUpdateRef.current = false; }, 200);
  }, [sendSeek]);

  const manualResync = useCallback(() => {
    if (!videoRef.current) return;
    const targetSec = (playbackState.current_timestamp || 0) / 1000;
    if (isFinite(targetSec)) {
      videoRef.current.currentTime = targetSec;
    }
    if (playbackState.is_playing) {
      videoRef.current.play().catch(() => {});
    } else {
      videoRef.current.pause();
    }
  }, [playbackState.current_timestamp, playbackState.is_playing]);

  return {
    driftMs,
    handlePlay,
    handlePause,
    handleSeek,
    manualResync
  };
}
