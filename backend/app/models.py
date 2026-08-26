import uuid
from datetime import datetime
from typing import Optional
from sqlalchemy import String, Boolean, Integer, BigInteger, Text, DateTime, ForeignKey, Enum as SQLEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base

def generate_uuid():
    return str(uuid.uuid4())

class User(Base):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    username: Mapped[str] = mapped_column(String(50), unique=True, index=True, nullable=False)
    email: Mapped[str] = mapped_column(String(100), unique=True, index=True, nullable=False)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[str] = mapped_column(String(20), default="user") # "user", "admin"
    avatar_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    last_active_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

class WatchHistory(Base):
    __tablename__ = "watch_histories"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    party_id: Mapped[Optional[str]] = mapped_column(String(36), nullable=True)
    party_title: Mapped[str] = mapped_column(String(200), nullable=False)
    duration_seconds: Mapped[int] = mapped_column(Integer, default=0)
    joined_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    left_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class Party(Base):
    __tablename__ = "parties"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    host_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    invite_code: Mapped[str] = mapped_column(String(20), unique=True, index=True, nullable=False)
    status: Mapped[str] = mapped_column(String(20), default="active") # active, archived
    max_participants: Mapped[int] = mapped_column(Integer, default=100)
    is_public: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    participants = relationship("PartyParticipant", back_populates="party", cascade="all, delete-orphan")
    playback = relationship("PlaybackState", back_populates="party", uselist=False, cascade="all, delete-orphan")

class PartyParticipant(Base):
    __tablename__ = "party_participants"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    party_id: Mapped[str] = mapped_column(String(36), ForeignKey("parties.id", ondelete="CASCADE"), nullable=False)
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    is_host: Mapped[bool] = mapped_column(Boolean, default=False)
    can_share_screen: Mapped[bool] = mapped_column(Boolean, default=False)
    is_sharing: Mapped[bool] = mapped_column(Boolean, default=False)
    is_camera_enabled: Mapped[bool] = mapped_column(Boolean, default=False)
    is_audio_muted: Mapped[bool] = mapped_column(Boolean, default=False)
    connection_quality: Mapped[str] = mapped_column(String(20), default="excellent")
    joined_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    party = relationship("Party", back_populates="participants")

class PlaybackState(Base):
    __tablename__ = "playback_states"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    party_id: Mapped[str] = mapped_column(String(36), ForeignKey("parties.id", ondelete="CASCADE"), unique=True, nullable=False)
    video_url: Mapped[str] = mapped_column(String(500), nullable=False)
    video_title: Mapped[str] = mapped_column(String(200), default="Untitled Video")
    video_source_type: Mapped[str] = mapped_column(String(50), default="hls") # hls, mp4, youtube, screenshare
    current_timestamp: Mapped[int] = mapped_column(BigInteger, default=0) # milliseconds
    is_playing: Mapped[bool] = mapped_column(Boolean, default=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    party = relationship("Party", back_populates="playback")

class ChatMessage(Base):
    __tablename__ = "chat_messages"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    party_id: Mapped[str] = mapped_column(String(36), ForeignKey("parties.id", ondelete="CASCADE"), nullable=False)
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    username: Mapped[str] = mapped_column(String(50), nullable=False)
    message: Mapped[str] = mapped_column(Text, nullable=False)
    is_system: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

class ScreenShareRequest(Base):
    __tablename__ = "screen_share_requests"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    party_id: Mapped[str] = mapped_column(String(36), ForeignKey("parties.id", ondelete="CASCADE"), nullable=False)
    requester_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    host_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    status: Mapped[str] = mapped_column(String(20), default="pending") # pending, approved, rejected
    requested_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

class AdminAuditLog(Base):
    __tablename__ = "admin_audit_logs"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    admin_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    action: Mapped[str] = mapped_column(String(100), nullable=False) # e.g. "promoted_user", "deactivated_user", "terminated_party"
    target_id: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    details: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
