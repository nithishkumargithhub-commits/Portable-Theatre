from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from passlib.context import CryptContext
from jose import JWTError, jwt
import uuid
import bcrypt

from app.database import get_db
from app.models import User
from app.schemas import UserRegister, UserLogin, GuestLogin, UserResponse, TokenResponse
from app.config import SECRET_KEY, ALGORITHM, ACCESS_TOKEN_EXPIRE_MINUTES, ENABLE_DEMO_ADMIN, ENVIRONMENT

router = APIRouter(prefix="/api/auth", tags=["Auth"])
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))
    except Exception:
        try:
            return pwd_context.verify(plain_password, hashed_password)
        except Exception:
            return False

def get_password_hash(password: str) -> str:
    try:
        pwd_bytes = password.encode('utf-8')
        salt = bcrypt.gensalt()
        return bcrypt.hashpw(pwd_bytes, salt).decode('utf-8')
    except Exception:
        return pwd_context.hash(password)

def create_access_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

async def get_current_user(token: str = Depends(oauth2_scheme), db: AsyncSession = Depends(get_db)) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalars().first()
    if user is None:
        raise credentials_exception
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is deactivated. Please contact an administrator."
        )

    # Touch activity timestamp
    user.last_active_at = datetime.utcnow()
    await db.commit()
    await db.refresh(user)

    return user

@router.post("/register", response_model=TokenResponse)
async def register(user_in: UserRegister, db: AsyncSession = Depends(get_db)):
    try:
        # Check existing user
        result = await db.execute(select(User).where((User.username == user_in.username) | (User.email == user_in.email)))
        if result.scalars().first():
            raise HTTPException(status_code=400, detail="Username or email already registered")

        now = datetime.utcnow()
        user_id = str(uuid.uuid4())
        new_user = User(
            id=user_id,
            username=user_in.username,
            email=user_in.email,
            role="user",
            password_hash=get_password_hash(user_in.password),
            avatar_url=f"https://api.dicebear.com/7.x/bottts/svg?seed={user_in.username}",
            is_active=True,
            created_at=now,
            last_active_at=now
        )
        db.add(new_user)
        await db.commit()
        await db.refresh(new_user)

        access_token = create_access_token({"sub": new_user.id})
        return TokenResponse(access_token=access_token, user=UserResponse.model_validate(new_user))
    except HTTPException:
        raise
    except Exception as e:
        print("REGISTRATION EXCEPTION:", e)
        raise HTTPException(status_code=500, detail=f"Registration failed: {str(e)}")

@router.post("/demo-admin", response_model=TokenResponse)
async def demo_admin(db: AsyncSession = Depends(get_db)):
    if not ENABLE_DEMO_ADMIN or ENVIRONMENT == "production":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Demo admin mode is disabled in production environment."
        )
    # Check existing admin user
    result = await db.execute(select(User).where(User.username == "admin"))
    user = result.scalars().first()
    now = datetime.utcnow()
    if not user:
        user = User(
            id=str(uuid.uuid4()),
            username="admin",
            email="admin@portabletheatre.io",
            role="admin",
            password_hash=get_password_hash("admin123"),
            avatar_url="https://api.dicebear.com/7.x/bottts/svg?seed=admin",
            is_active=True,
            created_at=now,
            last_active_at=now
        )
        db.add(user)
    else:
        user.last_active_at = now
        user.is_active = True

    await db.commit()
    await db.refresh(user)

    access_token = create_access_token({"sub": user.id})
    return TokenResponse(access_token=access_token, user=UserResponse.model_validate(user))

@router.post("/login", response_model=TokenResponse)
async def login(user_in: UserLogin, db: AsyncSession = Depends(get_db)):
    try:
        result = await db.execute(
            select(User).where((User.username == user_in.username_or_email) | (User.email == user_in.username_or_email))
        )
        user = result.scalars().first()
        if not user or not verify_password(user_in.password, user.password_hash):
            raise HTTPException(status_code=400, detail="Incorrect username or password")

        if not user.is_active:
            raise HTTPException(status_code=403, detail="Account is deactivated. Please contact an administrator.")

        user.last_active_at = datetime.utcnow()
        await db.commit()
        await db.refresh(user)

        access_token = create_access_token({"sub": user.id})
        return TokenResponse(access_token=access_token, user=UserResponse.model_validate(user))
    except HTTPException:
        raise
    except Exception as e:
        print("LOGIN EXCEPTION:", e)
        raise HTTPException(status_code=500, detail=f"Login failed: {str(e)}")

@router.post("/guest", response_model=TokenResponse)
async def guest_login(guest_in: GuestLogin, db: AsyncSession = Depends(get_db)):
    guest_username = f"{guest_in.username}_{str(uuid.uuid4())[:4]}"
    guest_email = f"{guest_username}@guest.local"
    now = datetime.utcnow()
    new_user = User(
        id=str(uuid.uuid4()),
        username=guest_username,
        email=guest_email,
        password_hash=get_password_hash(str(uuid.uuid4())),
        avatar_url=f"https://api.dicebear.com/7.x/bottts/svg?seed={guest_username}",
        is_active=True,
        created_at=now,
        last_active_at=now
    )
    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)

    access_token = create_access_token({"sub": new_user.id})
    return TokenResponse(access_token=access_token, user=UserResponse.model_validate(new_user))

@router.get("/me", response_model=UserResponse)
async def get_me(current_user: User = Depends(get_current_user)):
    return current_user

@router.delete("/reset-user/{username}")
async def reset_user(username: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.username == username))
    user = result.scalars().first()
    if user:
        await db.delete(user)
        await db.commit()
        return {"status": f"User {username} deleted successfully"}
    return {"status": "User not found"}
