export class PartySocketManager {

  isConnected() {
    return (this.ws && this.ws.readyState === 1) || this.isFallback;
  }

  on(event, callback) {
    if (!this.eventListeners) this.eventListeners = new Map();
    if (!this.eventListeners.has(event)) this.eventListeners.set(event, new Set());
    this.eventListeners.get(event).add(callback);
  }

  off(event, callback) {
    if (this.eventListeners && this.eventListeners.has(event)) {
      this.eventListeners.get(event).delete(callback);
    }
  }

  emitEvent(event, data) {
    if (this.eventListeners && this.eventListeners.has(event)) {
      this.eventListeners.get(event).forEach(cb => { try { cb(data); } catch(e){} });
    }
  }
  constructor() {
    this.ws = null;
    this.reconnectAttempts = 0;
    this.currentPartyId = null;
    this.currentUserId = null;
    this.currentUsername = null;
    this.listeners = new Set();
    this.isFallback = false;
    this.mockState = {
      is_playing: false,
      current_timestamp: 0,
      last_update_time: Date.now() / 1000,
      video_url: "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8",
      video_title: "Big Buck Bunny 4K (HLS)",
      video_source_type: "hls",
      active_screen_share_user: null
    };
    this.mockParticipants = [
      { user_id: "bot_1", username: "🎬 Alex_Host" },
      { user_id: "bot_2", username: "🍿 Sarah_C" },
      { user_id: "bot_3", username: "⚡ MovieFan99" }
    ];
  }

  connect(partyId, userId, username) {
    this.currentPartyId = partyId;
    this.currentUserId = userId;
    this.currentUsername = username;
    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsHost = window.location.host;
    const wsUrl = `${wsProtocol}//${wsHost}/ws/party/${partyId}?user_id=${encodeURIComponent(userId)}&username=${encodeURIComponent(username)}`;

    try {
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        console.log("Connected to Portable Theatre WebSocket server");
        this.isFallback = false;
        this.reconnectAttempts = 0;
        this.emitEvent("connect");
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.notifyListeners(data);
        } catch (e) {
          console.error("Error parsing WS message", e);
        }
      };

      this.ws.onerror = (err) => {
        console.warn("WebSocket error, falling back to client-simulated room engine", err);
        this.enableFallback(userId, username);
      };

      this.ws.onclose = () => {
        console.log("WebSocket closed");
        this.emitEvent("disconnect");
        if (!this.isFallback && (this.reconnectAttempts || 0) < 5) {
          const attempts = (this.reconnectAttempts || 0) + 1;
          this.reconnectAttempts = attempts;
          const delay = Math.min(1000 * Math.pow(2, attempts), 16000);
          setTimeout(() => {
            if (this.currentPartyId && this.currentUserId && this.currentUsername) {
              this.connect(this.currentPartyId, this.currentUserId, this.currentUsername);
            }
          }, delay);
        }
      };
    } catch (e) {
      console.warn("Could not establish WebSocket, running in simulated mode", e);
      this.enableFallback(userId, username);
    }
  }

  enableFallback(userId, username) {
    this.isFallback = true;
    // Add current user to mock participants
    if (!this.mockParticipants.some(p => p.user_id === userId)) {
      this.mockParticipants.push({ user_id: userId, username: username });
    }

    // Trigger initial state sync
    setTimeout(() => {
      this.notifyListeners({
        type: "SYNC_STATE",
        data: this.mockState,
        server_time: Date.now()
      });
      this.notifyListeners({
        type: "PARTICIPANTS_UPDATE",
        data: this.mockParticipants
      });
      this.notifyListeners({
        type: "CHAT_MESSAGE",
        data: {
          id: String(Date.now()),
          user_id: "system",
          username: "SYSTEM",
          message: `✨ ${username} connected to party room!`,
          is_system: true,
          created_at: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      });
    }, 100);
  }

  send(type, payload = {}) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN && !this.isFallback) {
      this.ws.send(JSON.stringify({ type, data: payload }));
    } else if (this.isFallback) {
      // Simulate local broadcast for single page / demo mode
      this.handleSimulatedSend(type, payload);
    }
  }

  handleSimulatedSend(type, payload) {
    const now = Date.now();
    if (type === "PLAY") {
      this.mockState.is_playing = true;
      this.mockState.current_timestamp = payload.timestamp || 0;
      this.mockState.last_update_time = now / 1000;
      this.notifyListeners({
        type: "PLAYBACK_UPDATE",
        data: {
          is_playing: true,
          current_timestamp: payload.timestamp || 0,
          sender_id: "local",
          sender_name: "You"
        },
        server_time: now
      });
    } else if (type === "PAUSE") {
      this.mockState.is_playing = false;
      this.mockState.current_timestamp = payload.timestamp || 0;
      this.mockState.last_update_time = now / 1000;
      this.notifyListeners({
        type: "PLAYBACK_UPDATE",
        data: {
          is_playing: false,
          current_timestamp: payload.timestamp || 0,
          sender_id: "local",
          sender_name: "You"
        },
        server_time: now
      });
    } else if (type === "SEEK") {
      this.mockState.current_timestamp = payload.timestamp || 0;
      this.mockState.last_update_time = now / 1000;
      this.notifyListeners({
        type: "PLAYBACK_UPDATE",
        data: {
          is_playing: this.mockState.is_playing,
          current_timestamp: payload.timestamp || 0,
          sender_id: "local",
          sender_name: "You"
        },
        server_time: now
      });
    } else if (type === "CHANGE_SOURCE") {
      this.mockState.video_url = payload.video_url;
      this.mockState.video_title = payload.video_title || "Custom Stream";
      this.mockState.video_source_type = payload.video_source_type || "hls";
      this.mockState.current_timestamp = 0;
      this.mockState.is_playing = true;
      this.mockState.last_update_time = now / 1000;
      this.notifyListeners({
        type: "SOURCE_CHANGED",
        data: {
          video_url: payload.video_url,
          video_title: payload.video_title,
          video_source_type: payload.video_source_type,
          changed_by: "Host"
        }
      });
    } else if (type === "CHAT_MESSAGE") {
      this.notifyListeners({
        type: "CHAT_MESSAGE",
        data: {
          id: String(now),
          user_id: "local",
          username: payload.username || "You",
          message: payload.message,
          is_system: false,
          created_at: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      });
    } else if (type === "REACTION") {
      this.notifyListeners({
        type: "REACTION",
        data: {
          emoji: payload.emoji || "❤️",
          user_id: "local",
          username: payload.username || "You"
        }
      });
    } else if (type === "SCREEN_SHARE_REQUEST") {
      this.notifyListeners({
        type: "SCREEN_SHARE_REQUEST",
        data: {
          requester_id: payload.user_id,
          requester_name: payload.username
        }
      });
    } else if (type === "SCREEN_SHARE_APPROVE") {
      this.mockState.active_screen_share_user = payload.target_user_id;
      this.notifyListeners({
        type: "SCREEN_SHARE_APPROVED",
        data: {
          sharer_id: payload.target_user_id,
          approved_by: "Host"
        }
      });
    } else if (type === "SCREEN_SHARE_STOP") {
      this.mockState.active_screen_share_user = null;
      this.notifyListeners({
        type: "SCREEN_SHARE_STOPPED",
        data: {
          stopped_by: "Host"
        }
      });
    }
  }

  subscribe(callback) {
    this.listeners.add(callback);
    return () => {
      this.listeners.delete(callback);
    };
  }

  notifyListeners(message) {
    this.listeners.forEach((callback) => {
      try {
        callback(message);
      } catch (e) {
        console.error("Listener error", e);
      }
    });
  }

  disconnect() {
    this.reconnectAttempts = 5;
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.listeners.clear();
    if (this.eventListeners) {
      this.eventListeners.clear();
    }
  }
}

export const socketManager = new PartySocketManager();
