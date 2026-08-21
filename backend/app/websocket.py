import json
import asyncio
from typing import Dict, Set, Any
from fastapi import WebSocket, WebSocketDisconnect
import time

class ConnectionManager:
    def __init__(self):
        # party_id -> Dict[user_id, Dict[socket, metadata]]
        self.rooms: Dict[str, Dict[str, Dict[str, Any]]] = {}
        # party_id -> state dict
        self.room_states: Dict[str, Dict[str, Any]] = {}

    async def connect(self, websocket: WebSocket, party_id: str, user_id: str, username: str):
        await websocket.accept()
        if party_id not in self.rooms:
            self.rooms[party_id] = {}
            self.room_states[party_id] = {
                "is_playing": False,
                "current_timestamp": 0,
                "last_update_time": time.time(),
                "video_url": "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8",
                "video_title": "Big Buck Bunny",
                "video_source_type": "hls",
                "active_screen_share_user": None,
                "pending_screen_share_requests": []
            }
        
        self.rooms[party_id][user_id] = {
            "socket": websocket,
            "username": username,
            "joined_at": time.time()
        }

        # Broadcast participant list update
        await self.broadcast_participants(party_id)

        # Send current room sync state to the newly connected client
        state = self.get_calculated_room_state(party_id)
        await websocket.send_text(json.dumps({
            "type": "SYNC_STATE",
            "data": state,
            "server_time": time.time() * 1000
        }))

        # Broadcast user joined chat notification
        await self.broadcast(party_id, {
            "type": "CHAT_MESSAGE",
            "data": {
                "id": str(time.time()),
                "user_id": "system",
                "username": "SYSTEM",
                "message": f"✨ {username} joined the party!",
                "is_system": True,
                "created_at": time.strftime("%H:%M:%S")
            }
        })

    def disconnect(self, party_id: str, user_id: str):
        if party_id in self.rooms and user_id in self.rooms[party_id]:
            username = self.rooms[party_id][user_id]["username"]
            del self.rooms[party_id][user_id]
            if not self.rooms[party_id]:
                del self.rooms[party_id]
                if party_id in self.room_states:
                    del self.room_states[party_id]
            return username
        return None

    def get_calculated_room_state(self, party_id: str) -> Dict[str, Any]:
        if party_id not in self.room_states:
            return {}
        state = self.room_states[party_id].copy()
        if state["is_playing"]:
            elapsed = (time.time() - state["last_update_time"]) * 1000 # ms
            state["current_timestamp"] += int(elapsed)
        return state

    async def broadcast(self, party_id: str, message: dict, exclude_user_id: str = None):
        if party_id in self.rooms:
            payload = json.dumps(message)
            for uid, user_data in list(self.rooms[party_id].items()):
                if uid != exclude_user_id:
                    try:
                        await user_data["socket"].send_text(payload)
                    except Exception:
                        pass

    async def send_personal(self, party_id: str, target_user_id: str, message: dict):
        if party_id in self.rooms and target_user_id in self.rooms[party_id]:
            try:
                await self.rooms[party_id][target_user_id]["socket"].send_text(json.dumps(message))
            except Exception:
                pass

    async def broadcast_participants(self, party_id: str):
        if party_id in self.rooms:
            participants = [
                {"user_id": uid, "username": udata["username"]}
                for uid, udata in self.rooms[party_id].items()
            ]
            await self.broadcast(party_id, {
                "type": "PARTICIPANTS_UPDATE",
                "data": participants
            })

manager = ConnectionManager()
