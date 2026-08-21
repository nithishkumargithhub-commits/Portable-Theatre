from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
from datetime import datetime

# User Schemas
class UserRegister(BaseModel):
    username: str = Field(..., min_length=3, max_length=50)
    email: EmailStr
    password: str = Field(..., min_length=6)

class UserLogin(BaseModel):
    username_or_email: str
    password: str

class GuestLogin(BaseModel):
    username: str = Field(..., min_length=2, max_length=50)

class UserResponse(BaseModel):
    id: str
    username: str
    email: str
    role: str = "user"
    avatar_url: Optional[str] = None
    is_active: bool = True
    created_at: datetime
    last_active_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class AdminUserResponse(BaseModel):
    id: str
    username: str
    email: str
    role: str = "user"
    avatar_url: Optional[str] = None
    is_active: bool = True
    created_at: datetime
    last_active_at: Optional[datetime] = None
    party_count: int = 0
    total_watch_seconds: int = 0

    class Config:
        from_attributes = True

class PaginatedUserResponse(BaseModel):
    users: List[AdminUserResponse]
    total_users: int
    page: int
    page_size: int
    total_pages: int

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

class WatchSessionCreate(BaseModel):
    party_id: Optional[str] = None
    party_title: str
    duration_seconds: int

class WatchHistoryResponse(BaseModel):
    id: str
    user_id: str
    party_id: Optional[str]
    party_title: str
    duration_seconds: int
    joined_at: datetime
    left_at: datetime

    class Config:
        from_attributes = True

class DailyRegistrationData(BaseModel):
    date: str
    count: int

class AdminStatsExtendedResponse(BaseModel):
    total_users: int
    new_users_7d: int
    active_users_7d: int
    total_parties: int
    active_parties_count: int
    total_watch_hours: float
    total_sessions: int
    admin_users_count: int
    registration_chart: List[DailyRegistrationData] = []

class ActivityItemResponse(BaseModel):
    id: str
    user_id: str
    username: str
    avatar_url: Optional[str] = None
    action: str # "registered", "created_party", "watched_session", "role_updated", "status_updated"
    details: str
    timestamp: datetime

class AdminAuditLogResponse(BaseModel):
    id: str
    admin_id: str
    action: str
    target_id: Optional[str] = None
    details: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

# Party Schemas
class PartyCreate(BaseModel):
    title: str = Field(..., min_length=3, max_length=200)
    description: Optional[str] = None
    is_public: bool = True
    max_participants: int = 100
    video_url: Optional[str] = "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8"
    video_title: Optional[str] = "Big Buck Bunny (HLS Stream)"

class PartyResponse(BaseModel):
    id: str
    host_id: str
    title: str
    description: Optional[str]
    invite_code: str
    status: str
    max_participants: int
    is_public: bool
    created_at: datetime
    active_participants_count: Optional[int] = 1

    class Config:
        from_attributes = True

class PlaybackStateSchema(BaseModel):
    party_id: str
    video_url: str
    video_title: str
    video_source_type: str
    current_timestamp: int
    is_playing: bool

    class Config:
        from_attributes = True

class ChatMessageSchema(BaseModel):
    id: str
    party_id: str
    user_id: str
    username: str
    message: str
    is_system: bool
    created_at: datetime

    class Config:
        from_attributes = True
