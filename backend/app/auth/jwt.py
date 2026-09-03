from datetime import datetime, timedelta
from typing import Any
from jose import jwt, JWTError
from app.config import settings


def _create_token(subject: Any, expires_delta: timedelta, token_type: str) -> str:
    expire = datetime.utcnow() + expires_delta
    payload = {
        "sub": str(subject),
        "exp": expire,
        "iat": datetime.utcnow(),
        "type": token_type,
    }
    return jwt.encode(payload, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)


def create_access_token(user_id: int) -> str:
    return _create_token(
        user_id,
        timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES),
        "access",
    )


def create_refresh_token(user_id: int) -> str:
    return _create_token(
        user_id,
        timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS),
        "refresh",
    )


def decode_token(token: str) -> dict:
    """Decode and validate a JWT. Raises JWTError on failure."""
    return jwt.decode(token, settings.JWT_SECRET_KEY, algorithms=[settings.JWT_ALGORITHM])
