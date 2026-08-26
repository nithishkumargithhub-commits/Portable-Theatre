# 🍿 Portable Theatre

**Portable Theatre** is a state-of-the-art, real-time synchronized virtual cinema platform. It enables users worldwide to watch HLS streams, MP4 videos, and live WebRTC screen shares in sub-second synchronization while interacting over real-time chat, camera video grids, and floating reaction bursts.

🔗 **GitHub Repository**: [https://github.com/nithishkumargithhub-commits/Portable-Theatre.git](https://github.com/nithishkumargithhub-commits/Portable-Theatre.git)

---

## ✨ Features

- 🎬 **Sub-Second Synchronized Video Player**: HLS `.m3u8` and MP4 support with interactive range slider scrubbing, `-10s` rewind, `+10s` forward skip, and auto-dismissing 3-second local file screening toast notifications.
- 🖥️ **WebRTC Peer-to-Peer Screen Sharing**: Host-controlled request & approval workflow for streaming native desktop/browser screens directly inside party rooms.
- 📹 **Dual-Track WebRTC Camera Grid & Audio**: Real-time video grid with live status indicators (`🟢 Camera Active`, `🎤 Mic Active` vs `🔇 Mic Muted`).
- 🍿 **Cinema Lobby & Public Rooms**: Discover live public screening halls (`CINEMA4K`, `STEEL108`, `SINTEL10`) or create private invite-only watch parties.
- 💬 **Real-Time WebSockets Chat & Floating Reactions**: Broadcast chat messages and floating emoji bursts with instant visual feedback.
- 📊 **User Watch History & Metrics**: Personal watch history analytics dashboard displaying cumulative watch hours and room activity.
- 👑 **Admin LMS Control Center (`/admin`)**: Real-time telemetry, platform user management, active party room monitoring, and RBAC security controls.
- 🔐 **Strict Production Authentication**: Secure JWT authentication with BCrypt password hashing.

---

## 🏗️ Production Architecture

- **Frontend**: React 18 + Vite 5 + Tailwind CSS 3 (Hosted on **Vercel**).
- **Backend**: FastAPI + Async SQLAlchemy 2.0 + WebSockets (Hosted on **Render**).
- **Database**: PostgreSQL with connection pooling & auto-seeding (Hosted on **Neon**).

---

## 🛠️ Local Development

### 1. Backend Setup
```bash
cd backend
python -m venv venv
# On Windows:
venv\Scripts\activate
pip install -r requirements.txt
python run.py
```
*Backend runs on `http://127.0.0.1:8008` (API docs at `http://127.0.0.1:8008/docs`).*

### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
*Frontend runs on `http://localhost:3000`.*

---

## 🧪 End-to-End Testing

```bash
cd frontend
# Run Playwright E2E Suite (16/16 tests)
npx playwright test

# Run Python System Suite Test
python ../scratch/e2e_test.py
```

---

## 🌐 Production Deployment Guide

### Backend (Render + Neon PostgreSQL)
1. Provision a free PostgreSQL database on [Neon.tech](https://neon.tech).
2. Deploy backend on [Render.com](https://render.com) using Python runtime.
3. Configure environment variables:
   - `ENVIRONMENT` = `production`
   - `SECRET_KEY` = `<your-secure-random-key>`
   - `DATABASE_URL` = `<your-neon-postgresql-url>`
   - `ALLOWED_ORIGINS` = `https://<your-vercel-app>.vercel.app`

### Frontend (Vercel)
1. Import repository on [Vercel.com](https://vercel.com).
2. Set Root Directory to `frontend`.
3. Configure environment variables:
   - `VITE_API_URL` = `https://<your-render-backend>.onrender.com`
   - `VITE_WS_URL` = `wss://<your-render-backend>.onrender.com`
4. Deploy! 🚀
