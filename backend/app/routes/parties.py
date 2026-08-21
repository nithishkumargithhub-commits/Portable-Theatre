import secrets
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.models import User, Party, PartyParticipant, PlaybackState, ChatMessage
from app.schemas import PartyCreate, PartyResponse, PlaybackStateSchema, ChatMessageSchema
from app.routes.auth import get_current_user

router = APIRouter(prefix="/api/parties", tags=["Parties"])

def generate_invite_code():
    return secrets.token_hex(4).upper()

@router.post("", response_model=PartyResponse)
async def create_party(
    party_in: PartyCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    invite_code = generate_invite_code()
    new_party = Party(
        host_id=current_user.id,
        title=party_in.title,
        description=party_in.description,
        invite_code=invite_code,
        is_public=party_in.is_public,
        max_participants=party_in.max_participants
    )
    db.add(new_party)
    await db.commit()
    await db.refresh(new_party)

    # Add host as participant with screen share rights
    host_participant = PartyParticipant(
        party_id=new_party.id,
        user_id=current_user.id,
        is_host=True,
        can_share_screen=True
    )
    db.add(host_participant)

    # Initialize playback state
    video_url = party_in.video_url or "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8"
    video_source = "hls" if ".m3u8" in video_url else "mp4"
    if "youtube.com" in video_url or "youtu.be" in video_url:
        video_source = "youtube"

    playback = PlaybackState(
        party_id=new_party.id,
        video_url=video_url,
        video_title=party_in.video_title or "Big Buck Bunny",
        video_source_type=video_source,
        current_timestamp=0,
        is_playing=False
    )
    db.add(playback)

    # Add initial system message
    sys_msg = ChatMessage(
        party_id=new_party.id,
        user_id=current_user.id,
        username="SYSTEM",
        message=f"Party room '{new_party.title}' created by {current_user.username}",
        is_system=True
    )
    db.add(sys_msg)

    await db.commit()

    return PartyResponse(
        id=new_party.id,
        host_id=new_party.host_id,
        title=new_party.title,
        description=new_party.description,
        invite_code=new_party.invite_code,
        status=new_party.status,
        max_participants=new_party.max_participants,
        is_public=new_party.is_public,
        created_at=new_party.created_at,
        active_participants_count=1
    )

@router.get("", response_model=List[PartyResponse])
async def list_parties(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Party).where(Party.is_public == True, Party.status == "active"))
    parties = result.scalars().all()
    
    response = []
    for p in parties:
        p_res = PartyResponse(
            id=p.id,
            host_id=p.host_id,
            title=p.title,
            description=p.description,
            invite_code=p.invite_code,
            status=p.status,
            max_participants=p.max_participants,
            is_public=p.is_public,
            created_at=p.created_at,
            active_participants_count=1
        )
        response.append(p_res)
    return response

@router.get("/code/{invite_code}", response_model=PartyResponse)
async def get_party_by_code(invite_code: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Party).where(Party.invite_code == invite_code.upper()))
    party = result.scalars().first()
    if not party:
        raise HTTPException(status_code=404, detail="Party room not found")
    return PartyResponse.model_validate(party)

@router.get("/{party_id}", response_model=PartyResponse)
async def get_party(party_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Party).where(Party.id == party_id))
    party = result.scalars().first()
    if not party:
        raise HTTPException(status_code=404, detail="Party room not found")
    return PartyResponse.model_validate(party)

@router.get("/{party_id}/playback", response_model=PlaybackStateSchema)
async def get_playback_state(party_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(PlaybackState).where(PlaybackState.party_id == party_id))
    playback = result.scalars().first()
    if not playback:
        raise HTTPException(status_code=404, detail="Playback state not found")
    return PlaybackStateSchema.model_validate(playback)

@router.get("/{party_id}/messages", response_model=List[ChatMessageSchema])
async def get_party_messages(party_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(ChatMessage).where(ChatMessage.party_id == party_id).order_by(ChatMessage.created_at.asc()).limit(100)
    )
    messages = result.scalars().all()
    return [ChatMessageSchema.model_validate(m) for m in messages]
