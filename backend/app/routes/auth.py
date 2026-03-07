"""
Authentication routes — register and login.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.user import User
from app.schemas.user import UserCreate, UserLogin, UserOut, TokenResponse
from app.utils.security import hash_password, verify_password, create_access_token

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/register", response_model=UserOut, status_code=status.HTTP_201_CREATED)
async def register(payload: UserCreate, db: AsyncSession = Depends(get_db)):
    """Register a new citizen account."""
    # Check existing
    existing = await db.execute(
        select(User).where((User.email == payload.email) | (User.username == payload.username))
    )
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Username or email already taken")

    user = User(
        username=payload.username,
        email=payload.email,
        hashed_password=hash_password(payload.password),
        city=payload.city,
    )
    db.add(user)
    await db.flush()
    return user


@router.post("/login", response_model=TokenResponse)
async def login(payload: UserLogin, db: AsyncSession = Depends(get_db)):
    """Authenticate and return a JWT access token."""
    result = await db.execute(select(User).where(User.email == payload.email))
    user = result.scalar_one_or_none()
    if not user or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    token = create_access_token(user.id)
    return TokenResponse(access_token=token)
