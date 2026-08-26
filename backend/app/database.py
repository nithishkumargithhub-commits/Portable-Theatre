import uuid
from datetime import datetime
from sqlalchemy import select
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase
from app.config import DATABASE_URL

engine_kwargs = {
    "echo": False,
    "future": True,
}

if "sqlite" in DATABASE_URL:
    engine_kwargs["connect_args"] = {"check_same_thread": False}
elif "postgresql" in DATABASE_URL:
    engine_kwargs["pool_pre_ping"] = True
    engine_kwargs["pool_size"] = 10
    engine_kwargs["max_overflow"] = 20

engine = create_async_engine(DATABASE_URL, **engine_kwargs)

AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False
)

class Base(DeclarativeBase):
    pass

async def get_db():
    async with AsyncSessionLocal() as session:
        yield session

async def seed_initial_cinema_halls(session: AsyncSession):
    from app.models import User, Party, PartyParticipant, PlaybackState
    from passlib.context import CryptContext

    pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

    # Check if admin exists
    admin_result = await session.execute(select(User).where(User.username == "admin"))
    admin_user = admin_result.scalar_one_or_none()

    if not admin_user:
        admin_id = str(uuid.uuid4())
        pw_hash = pwd_context.hash("adminpassword")
        admin_user = User(
            id=admin_id,
            username="admin",
            email="admin@portabletheatre.com",
            password_hash=pw_hash,
            role="admin",
            is_active=True
        )
        session.add(admin_user)
        await session.commit()
        await session.refresh(admin_user)

    # Check if parties table is empty
    parties_result = await session.execute(select(Party))
    existing_parties = parties_result.scalars().all()

    if len(existing_parties) == 0:
        clean_rooms = [
            {
                "id": "c1111111-1111-1111-1111-111111111111",
                "title": "🍿 Public Cinema Hall — Big Buck Bunny 4K",
                "description": "Welcome to Portable Theatre's premier 4K HLS public screening! Grab your popcorn and enjoy sub-second synchronized playback with friends.",
                "invite_code": "CINEMA4K",
                "video_url": "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8",
                "video_title": "Big Buck Bunny (4K HLS Stream)",
                "video_type": "hls"
            },
            {
                "id": "c2222222-2222-2222-2222-222222222222",
                "title": "🎬 Sci-Fi Screening — Tears of Steel HD",
                "description": "Join our live sci-fi cinema party! High-definition stream with real-time video sync, camera grid, and floating reaction bursts.",
                "invite_code": "STEEL108",
                "video_url": "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4",
                "video_title": "Tears of Steel (MP4 HD)",
                "video_type": "mp4"
            },
            {
                "id": "c3333333-3333-3333-3333-333333333333",
                "title": "✨ Open Cinema Showcase — Sintel 1080p",
                "description": "Experience open cinema storytelling in stunning 1080p! Share your camera feed, chat with fellow viewers, and react in real-time.",
                "invite_code": "SINTEL10",
                "video_url": "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4",
                "video_title": "Sintel Open Movie (MP4 1080p)",
                "video_type": "mp4"
            }
        ]

        for room in clean_rooms:
            party_obj = Party(
                id=room["id"],
                host_id=admin_user.id,
                title=room["title"],
                description=room["description"],
                invite_code=room["invite_code"],
                status="active",
                max_participants=100,
                is_public=True
            )
            session.add(party_obj)

            participant_obj = PartyParticipant(
                id=str(uuid.uuid4()),
                party_id=room["id"],
                user_id=admin_user.id,
                is_host=True,
                can_share_screen=True,
                is_sharing=False,
                is_camera_enabled=False,
                is_audio_muted=False,
                connection_quality="excellent"
            )
            session.add(participant_obj)

            playback_obj = PlaybackState(
                id=str(uuid.uuid4()),
                party_id=room["id"],
                video_url=room["video_url"],
                video_title=room["video_title"],
                video_source_type=room["video_type"],
                current_timestamp=0,
                is_playing=True
            )
            session.add(playback_obj)

        await session.commit()

async def init_db():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with AsyncSessionLocal() as session:
        try:
            await seed_initial_cinema_halls(session)
        except Exception as e:
            print("Seed notice:", e)
