# 🎬 Portable Theatre — Professional Real-Time Watch Party & Media Platform

**Portable Theatre** is a full-stack, real-time cinema streaming, collaborative watch party, and media sharing application. It enables groups of users to stream synchronized video playback (HLS adaptive streams, MP4 files, or client-side local video files), share their screen using Google Meet / Zoom style WebRTC display capture, engage in low-latency camera & microphone feeds, exchange live room chat messages, and trigger interactive floating emoji reaction bursts.

---

## 🚀 Key Features

### 🍿 1. Synchronized Watch Parties & Rooms
- **Server-Authoritative Sync**: Sub-second clock synchronization algorithm with automatic drift compensation (>800ms) ensuring all participants experience aligned `PLAY`, `PAUSE`, and `SEEK` actions.
- **Multi-Format Video Player**: Native support for adaptive bitrate HLS (`.m3u8`) streams, direct `.mp4` URLs, and client-side local video file playback.
- **Wholesome Moment Snapshot**: One-click watermark snapshot utility capturing video frames stamped with an official cinema banner.

### 🖥️ 2. Professional WebRTC Screen Sharing (Google Meet / Zoom Style)
- **Native OS/Browser Picker**: Uses `navigator.mediaDevices.getDisplayMedia()` allowing presenters to choose **Entire Screen**, **A Specific Window**, or **A Browser Tab**.
- **Host Approval Permission Flow**: Preserved permission workflow: Participant requests screen share → Host receives notification → Host approves → Presenter stream commences.
- **Display Surface & Audio Inspection**: Automatically detects display surface type (`Entire Screen`, `Window`, `Browser Tab`) and streams system/tab audio (`🔊 Screen Audio Active` vs `🔇 Screen Audio Unavailable`).
- **Native Stop Detection**: Binds to `videoTrack.onended` to cleanly handle the browser's floating "Stop sharing" bar.
- **Singleton Hook Architecture**: Prevents recursive browser picker invocation loops using a shared singleton lock in `useWebRTC.js`.

### 📷 3. Camera Grid & Microphone Engine
- **Dual Track Acquisition**: Captures high-definition camera video and noise-suppressed microphone audio with automatic fallback handling.
- **Hardware Fallback Engine**: If camera or microphone hardware is restricted, initializes a WebAudio track + dynamic 30fps animated canvas stream ensuring uninterrupted video grid functionality.
- **Interrupt-Safe Video Rendering**: Prevents black screen decoding crashes by checking `video.srcObject !== localStream` before binding.
- **Real-Time Mic Mute Control**: Independent one-click microphone mute/unmute control with live WebSocket state broadcasting (`MUTE_AUDIO` / `UNMUTE_AUDIO`).
- **Live Status Badges**: Live indicators displaying `🟢 Camera Active` and `🎤 Mic Active` vs `🔇 Mic Muted`.

### 💬 4. Live Chat & Reaction Bursts
- **Full-Width Control Center**: Integrated bottom panel housing room chat threads and reaction controls.
- **Interactive Emoji Bursts**: Animated floating canvas reactions (❤️ 🔥 🍿 👏 😂 🚀) with randomized drift vectors and smooth opacity decay.
- **Message Log**: Real-time room chat sidebar with user avatar chips, system join/leave notifications, and timestamp tracking.

### 👑 5. Admin LMS Control Center (`/admin`)
- **Platform Analytics**: Total Users, Active Users (7d), New Users (7d), Total Watch Hours, Active Party Rooms.
- **7-Day Registration Chart**: Visual bar chart tracking daily user growth.
- **User Governance**: Searchable, filterable, and paginated user management table with role promotion/demotion and account activation/deactivation.
- **Audit Stream & CSV Export**: Consolidated real-time activity log stream and one-click **Export Users CSV** reporting tool.

---

## 🛠️ Architecture & Technology Stack

```mermaid
flowchart TD
    subgraph Frontend["Frontend Client (React 18 + Vite 5 + Tailwind CSS 3)"]
        UI["Lobby / Party Room / Admin LMS"]
        SyncPlayer["useSyncPlayer Hook"]
        WebRTCModule["useWebRTC / useWebRTCCamera"]
        SocketMgr["SocketManager (WebSocket Client)"]
    end

    subgraph Backend["Backend API (FastAPI + Uvicorn + Python 3.10+)"]
        AuthRouter["🔐 Auth Routes (JWT, Passlib, Bcrypt)"]
        PartyRouter["🍿 Party & Room CRUD"]
        AnalyticsRouter["📊 Watch Sessions & History"]
        AdminRouter["👑 Admin LMS & User Management"]
        WSEngine["⚡ WebSocket ConnectionManager"]
    end

    subgraph Database["Persistent Storage"]
        SQLite[(SQLite / aiosqlite + Async SQLAlchemy 2.0)]
    end

    subgraph P2PMesh["P2P Signaling & Media"]
        WebRTCScreen["🖥️ WebRTC Screen Share Broadcast"]
        WebRTCCam["📷 WebRTC Camera Mesh Grid"]
    end

    UI <-->|HTTP REST /api| AuthRouter
    UI <-->|HTTP REST /api| PartyRouter
    UI <-->|HTTP REST /api| AdminRouter
    SocketMgr <-->|WebSocket /ws/party| WSEngine

    AuthRouter <--> SQLite
    PartyRouter <--> SQLite
    AdminRouter <--> SQLite
    AnalyticsRouter <--> SQLite

    WebRTCModule <.-.->|P2P WebRTC Offer/Answer/ICE| WebRTCScreen
    WebRTCModule <.-.->|P2P WebRTC Camera Mesh| WebRTCCam
```

---

## ⚙️ REST API Reference

### 🔐 Auth Endpoints (`/api/auth`)
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/auth/register` | Register a new user account |
| `POST` | `/api/auth/login` | Login with username and password |
| `POST` | `/api/auth/guest` | Instant guest authentication session |
| `GET` | `/api/auth/me` | Retrieve authenticated user profile |
| `POST` | `/api/auth/demo-admin` | Quick login as Demo Admin |

### 🍿 Party Endpoints (`/api/parties`)
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/parties` | Create a new watch party room |
| `GET` | `/api/parties` | List active public party rooms |
| `GET` | `/api/parties/{party_id}` | Get room details by ID |
| `GET` | `/api/parties/code/{invite_code}` | Lookup party by 8-character invite code |

### 📊 Analytics Endpoints (`/api/analytics`)
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/analytics/watch-session` | Log user watch session duration |
| `GET` | `/api/analytics/history` | Retrieve user watch history logs |

### 👑 Admin LMS Endpoints (`/api/admin`)
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/admin/stats` | Platform KPI metrics and registration trend |
| `GET` | `/api/admin/users` | Paginated user management list |
| `PUT` | `/api/admin/users/{user_id}/status` | Activate or deactivate user account |
| `PUT` | `/api/admin/users/{user_id}/role` | Promote or demote user role |
| `GET` | `/api/admin/users/export` | Export users table as CSV file |
| `GET` | `/api/admin/activity` | Consolidated real-time activity stream |

---

## ⚡ WebSocket Event Protocol (`/ws/party/{party_id}`)

| Event Type | Direction | Payload Description |
|---|---|---|
| `SYNC_STATE` | Server → Client | Initial room synchronization state on connect |
| `PARTICIPANTS_UPDATE` | Server → Client | List of active room members |
| `PLAY` / `PAUSE` / `SEEK` | Client ↔ Server | Playback timing updates |
| `PLAYBACK_UPDATE` | Server → Client | Broadcast playback state to viewers |
| `CHANGE_SOURCE` | Client → Server | Change room stream URL or media type |
| `CHAT_MESSAGE` | Client ↔ Server | Live room chat message broadcast |
| `REACTION` | Client ↔ Server | Floating emoji reaction event |
| `SCREEN_SHARE_REQUEST` | Client → Host | Participant screen share permission request |
| `SCREEN_SHARE_APPROVE` | Host → Server | Host approval for screen share presenter |
| `SCREEN_SHARE_APPROVED` | Server → All | Broadcast active presenter screen share stream |
| `SCREEN_SHARE_STOP` | Presenter → All | Terminate active screen share stream |
| `WEBRTC_OFFER` / `WEBRTC_ANSWER` / `WEBRTC_ICE_CANDIDATE` | Peer ↔ Peer | P2P WebRTC signaling routing |
| `CAMERA_ENABLED` / `CAMERA_DISABLED` | Client ↔ Server | Camera mesh status updates |
| `MUTE_AUDIO` / `UNMUTE_AUDIO` | Client ↔ Server | Microphone audio state updates |

---

## 🧪 Testing & Verification

### 1. Automated Playwright E2E Tests
Run the 16 automated Playwright end-to-end browser tests:
```bash
cd frontend
npx playwright test
```

### 2. Python System Suite Test
Run the end-to-end Python test suite validating REST APIs and WebSockets:
```bash
python scratch/e2e_test.py
```

### 3. Frontend Production Build
Validate clean frontend compilation:
```bash
cd frontend
npm run build
```

---

## 💻 Installation & Local Running

### Prerequisites
- Python 3.10+
- Node.js 18+ and `npm`

### 1. Start Backend Server
```bash
cd backend
python -m venv venv
# On Windows:
venv\Scripts\activate
pip install -r requirements.txt
python run.py
```
*Backend runs on `http://127.0.0.1:8008` (Swagger API Docs at `http://127.0.0.1:8008/docs`).*

### 2. Start Frontend Dev Server
```bash
cd frontend
npm install
npm run dev
```
*Frontend runs on `http://localhost:3000`.*

---

## 📜 License

MIT License © Portable Theatre Team.
