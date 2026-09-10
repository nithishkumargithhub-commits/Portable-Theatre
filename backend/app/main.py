import json
import time
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Query, Depends
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.database import init_db, AsyncSessionLocal
from app.models import User, Party, PartyParticipant
from sqlalchemy.future import select
from jose import JWTError, jwt
from app.routes.auth import router as auth_router
from app.routes.parties import router as party_router
from app.routes.cameras import router as camera_router
from app.routes.analytics import router as analytics_router
from app.routes.admin import router as admin_router
from app.websocket import manager
from app.config import ALLOWED_ORIGINS, ENVIRONMENT, SECRET_KEY, ALGORITHM
from fastapi.responses import JSONResponse
import logging

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize database schema on startup
    await init_db()
    yield

app = FastAPI(
    title="Portable Theatre - Party Video Streaming API",
    description="Real-time synchronized video streaming, WebRTC screen sharing, camera feed grid, and interactive party room backend",
    version="1.0.0",
    lifespan=lifespan
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS if ALLOWED_ORIGINS else ["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    logging.exception("Unhandled exception", exc_info=exc)
    return JSONResponse(
        status_code=500,
        content={"detail": "An internal server error occurred. Please try again later."}
    )

# Include Routers
app.include_router(auth_router)
app.include_router(party_router)
app.include_router(camera_router)
app.include_router(analytics_router)
app.include_router(admin_router)

@app.get("/health")
@app.get("/api/health")
async def health_check():
    return {
        "status": "healthy",
        "environment": ENVIRONMENT,
        "timestamp": time.time()
    }

@app.get("/")
async def root():
    return {
        "app": "Portable Theatre API",
        "status": "online",
        "timestamp": time.time()
    }

@app.websocket("/ws/party/{party_id}")
async def websocket_party_endpoint(
    websocket: WebSocket,
    party_id: str,
    token: str = Query(...)
):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        authenticated_user_id = payload.get("sub")
        if not authenticated_user_id:
            raise JWTError("Missing subject")

        async with AsyncSessionLocal() as db:
            user_result = await db.execute(
                select(User).where(User.id == authenticated_user_id, User.is_active == True)
            )
            user = user_result.scalars().first()
            party_result = await db.execute(
                select(Party).where(Party.id == party_id, Party.status == "active")
            )
            party = party_result.scalars().first()
            if not user or not party:
                await websocket.close(code=1008)
                return

            if not party.is_public:
                membership_result = await db.execute(
                    select(PartyParticipant).where(
                        PartyParticipant.party_id == party_id,
                        PartyParticipant.user_id == user.id
                    )
                )
                if not membership_result.scalars().first():
                    await websocket.close(code=1008)
                    return

            user_id = user.id
            username = user.username
    except (JWTError, ValueError):
        await websocket.close(code=1008)
        return

    await manager.connect(websocket, party_id, user_id, username)
    try:
        while True:
            raw_data = await websocket.receive_text()
            message = json.loads(raw_data)
            msg_type = message.get("type")
            payload = message.get("data", {})

            if msg_type == "PLAY":
                if party_id in manager.room_states:
                    manager.room_states[party_id]["is_playing"] = True
                    manager.room_states[party_id]["current_timestamp"] = payload.get("timestamp", 0)
                    manager.room_states[party_id]["last_update_time"] = time.time()
                await manager.broadcast(party_id, {
                    "type": "PLAYBACK_UPDATE",
                    "data": {
                        "is_playing": True,
                        "current_timestamp": payload.get("timestamp", 0),
                        "sender_id": user_id,
                        "sender_name": username
                    },
                    "server_time": time.time() * 1000
                })

            elif msg_type == "PAUSE":
                if party_id in manager.room_states:
                    manager.room_states[party_id]["is_playing"] = False
                    manager.room_states[party_id]["current_timestamp"] = payload.get("timestamp", 0)
                    manager.room_states[party_id]["last_update_time"] = time.time()
                await manager.broadcast(party_id, {
                    "type": "PLAYBACK_UPDATE",
                    "data": {
                        "is_playing": False,
                        "current_timestamp": payload.get("timestamp", 0),
                        "sender_id": user_id,
                        "sender_name": username
                    },
                    "server_time": time.time() * 1000
                })

            elif msg_type == "SEEK":
                if party_id in manager.room_states:
                    manager.room_states[party_id]["current_timestamp"] = payload.get("timestamp", 0)
                    manager.room_states[party_id]["last_update_time"] = time.time()
                await manager.broadcast(party_id, {
                    "type": "PLAYBACK_UPDATE",
                    "data": {
                        "is_playing": manager.room_states[party_id]["is_playing"] if party_id in manager.room_states else False,
                        "current_timestamp": payload.get("timestamp", 0),
                        "sender_id": user_id,
                        "sender_name": username
                    },
                    "server_time": time.time() * 1000
                })

            elif msg_type == "CHANGE_SOURCE":
                video_url = payload.get("video_url")
                video_title = payload.get("video_title", "Custom Stream")
                video_source_type = payload.get("video_source_type", "hls")
                if party_id in manager.room_states:
                    manager.room_states[party_id]["video_url"] = video_url
                    manager.room_states[party_id]["video_title"] = video_title
                    manager.room_states[party_id]["video_source_type"] = video_source_type
                    manager.room_states[party_id]["current_timestamp"] = 0
                    manager.room_states[party_id]["is_playing"] = True
                    manager.room_states[party_id]["last_update_time"] = time.time()

                await manager.broadcast(party_id, {
                    "type": "SOURCE_CHANGED",
                    "data": {
                        "video_url": video_url,
                        "video_title": video_title,
                        "video_source_type": video_source_type,
                        "changed_by": username
                    }
                })

            elif msg_type == "CHAT_MESSAGE":
                msg_obj = {
                    "id": str(time.time()),
                    "user_id": user_id,
                    "username": username,
                    "message": str(payload.get("message", ""))[:500],
                    "is_system": False,
                    "created_at": time.strftime("%H:%M:%S")
                }
                await manager.broadcast(party_id, {
                    "type": "CHAT_MESSAGE",
                    "data": msg_obj
                })

            elif msg_type == "REACTION":
                await manager.broadcast(party_id, {
                    "type": "REACTION",
                    "data": {
                        "emoji": payload.get("emoji", "❤️"),
                        "user_id": user_id,
                        "username": username
                    }
                })

            elif msg_type == "CAMERA_ENABLED":
                await manager.broadcast(party_id, {
                    "type": "CAMERA_ENABLED",
                    "data": {
                        "user_id": user_id,
                        "username": username
                    }
                })

            elif msg_type == "CAMERA_DISABLED":
                await manager.broadcast(party_id, {
                    "type": "CAMERA_DISABLED",
                    "data": {
                        "user_id": user_id
                    }
                })

            elif msg_type in ["CAMERA_OFFER", "CAMERA_ANSWER", "CAMERA_ICE_CANDIDATE"]:
                target_user_id = payload.get("target_user_id")
                if target_user_id:
                    await manager.send_personal(party_id, target_user_id, {
                        "type": msg_type,
                        "data": {
                            "sender_id": user_id,
                            "sender_name": username,
                            "signal": payload.get("signal")
                        }
                    })

            elif msg_type in ["MUTE_AUDIO", "UNMUTE_AUDIO"]:
                await manager.broadcast(party_id, {
                    "type": msg_type,
                    "data": {
                        "user_id": user_id
                    }
                })

            elif msg_type == "SCREEN_SHARE_REQUEST":
                # Notify host about screen share request
                await manager.broadcast(party_id, {
                    "type": "SCREEN_SHARE_REQUEST",
                    "data": {
                        "requester_id": user_id,
                        "requester_name": username
                    }
                })

            elif msg_type == "SCREEN_SHARE_APPROVE":
                target_user_id = payload.get("target_user_id")
                if party_id in manager.room_states:
                    manager.room_states[party_id]["active_screen_share_user"] = target_user_id
                await manager.broadcast(party_id, {
                    "type": "SCREEN_SHARE_APPROVED",
                    "data": {
                        "sharer_id": target_user_id,
                        "approved_by": username
                    }
                })

            elif msg_type == "SCREEN_SHARE_STOP":
                if party_id in manager.room_states:
                    manager.room_states[party_id]["active_screen_share_user"] = None
                await manager.broadcast(party_id, {
                    "type": "SCREEN_SHARE_STOPPED",
                    "data": {
                        "stopped_by": username
                    }
                })

            elif msg_type in ["WEBRTC_OFFER", "WEBRTC_ANSWER", "WEBRTC_ICE_CANDIDATE"]:
                target_user_id = payload.get("target_user_id")
                if target_user_id:
                    await manager.send_personal(party_id, target_user_id, {
                        "type": msg_type,
                        "data": {
                            "sender_id": user_id,
                            "signal": payload.get("signal")
                        }
                    })
                else:
                    await manager.broadcast(party_id, {
                        "type": msg_type,
                        "data": {
                            "sender_id": user_id,
                            "signal": payload.get("signal")
                        }
                    }, exclude_user_id=user_id)

    except WebSocketDisconnect:
        disconnected_username = manager.disconnect(party_id, user_id)
        if disconnected_username:
            await manager.broadcast_participants(party_id)
            await manager.broadcast(party_id, {
                "type": "CHAT_MESSAGE",
                "data": {
                    "id": str(time.time()),
                    "user_id": "system",
                    "username": "SYSTEM",
                    "message": f"👋 {disconnected_username} left the party.",
                    "is_system": True,
                    "created_at": time.strftime("%H:%M:%S")
                }
            })
