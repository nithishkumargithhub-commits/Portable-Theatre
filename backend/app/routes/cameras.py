import logging
from datetime import datetime
from typing import List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.models import User, PartyParticipant, Party
from app.routes.auth import get_current_user

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/cameras", tags=["Cameras"])

@router.post("/enable")
async def enable_camera(
    party_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Enable user's webcam feed in party room & return active camera peers"""
    try:
        result = await db.execute(
            select(PartyParticipant).where(
                PartyParticipant.party_id == party_id,
                PartyParticipant.user_id == current_user.id
            )
        )
        participant = result.scalars().first()
        if not participant:
            # Auto register participant if not exists
            participant = PartyParticipant(
                party_id=party_id,
                user_id=current_user.id,
                is_camera_enabled=True
            )
            db.add(participant)
        else:
            participant.is_camera_enabled = True

        await db.commit()

        # Fetch other users with active cameras in the room
        active_res = await db.execute(
            select(PartyParticipant, User)
            .join(User, PartyParticipant.user_id == User.id)
            .where(
                PartyParticipant.party_id == party_id,
                PartyParticipant.is_camera_enabled == True,
                PartyParticipant.user_id != current_user.id
            )
        )
        active_peers = []
        for p, u in active_res.all():
            active_peers.append({
                "user_id": u.id,
                "username": u.username,
                "avatar_url": u.avatar_url,
                "is_host": p.is_host,
                "is_audio_muted": p.is_audio_muted
            })

        return {
            "status": "camera_enabled",
            "party_id": party_id,
            "peers": active_peers
        }
    except Exception as e:
        logger.error(f"Error enabling camera: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/disable")
async def disable_camera(
    party_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Disable user's webcam feed in party room"""
    try:
        result = await db.execute(
            select(PartyParticipant).where(
                PartyParticipant.party_id == party_id,
                PartyParticipant.user_id == current_user.id
            )
        )
        participant = result.scalars().first()
        if participant:
            participant.is_camera_enabled = False
            await db.commit()

        return {"status": "camera_disabled", "party_id": party_id}
    except Exception as e:
        logger.error(f"Error disabling camera: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/parties/{party_id}/active")
async def get_active_cameras(party_id: str, db: AsyncSession = Depends(get_db)):
    """Retrieve all users with active webcam streams in a party"""
    result = await db.execute(
        select(PartyParticipant, User)
        .join(User, PartyParticipant.user_id == User.id)
        .where(
            PartyParticipant.party_id == party_id,
            PartyParticipant.is_camera_enabled == True
        )
    )
    active_cameras = []
    for p, u in result.all():
        active_cameras.append({
            "user_id": u.id,
            "username": u.username,
            "avatar_url": u.avatar_url,
            "is_host": p.is_host,
            "is_audio_muted": p.is_audio_muted,
            "connection_quality": p.connection_quality
        })

    return {
        "party_id": party_id,
        "active_cameras": active_cameras
    }
