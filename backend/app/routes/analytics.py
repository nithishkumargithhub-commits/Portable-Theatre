from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from typing import List
from datetime import datetime

from app.database import get_db
from app.models import User, WatchHistory
from app.schemas import WatchSessionCreate, WatchHistoryResponse
from app.routes.auth import get_current_user

router = APIRouter(prefix="/api/analytics", tags=["Analytics"])

@router.post("/watch-session", response_model=WatchHistoryResponse)
async def log_watch_session(
    session_in: WatchSessionCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    history_entry = WatchHistory(
        user_id=current_user.id,
        party_id=session_in.party_id,
        party_title=session_in.party_title,
        duration_seconds=session_in.duration_seconds,
        joined_at=datetime.utcnow()
    )
    db.add(history_entry)
    await db.commit()
    await db.refresh(history_entry)
    return history_entry

@router.get("/history", response_model=List[WatchHistoryResponse])
async def get_watch_history(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(WatchHistory)
        .where(WatchHistory.user_id == current_user.id)
        .order_by(WatchHistory.joined_at.desc())
    )
    return result.scalars().all()
