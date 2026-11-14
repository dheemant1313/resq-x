import uuid
import secrets
import hashlib
from datetime import datetime, timedelta
from typing import Any, Union, Optional
from enum import Enum
import bcrypt

# Robust compatibility fix for bcrypt >= 4.0 with passlib
# Modern bcrypt forbids passwords > 72 bytes and removed __about__, causing passlib's
# legacy wrap bug detection to throw ValueError unless truncated to 72 bytes.
_orig_hashpw = bcrypt.hashpw
def _safe_hashpw(password, salt):
    if isinstance(password, (bytes, bytearray)) and len(password) > 72:
        password = password[:72]
    elif isinstance(password, str) and len(password.encode('utf-8')) > 72:
        password = password.encode('utf-8')[:72]
    return _orig_hashpw(password, salt)
bcrypt.hashpw = _safe_hashpw

from jose import jwt, JWTError, ExpiredSignatureError
from passlib.context import CryptContext
from fastapi import HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from app.core.config import settings

class UserRole(str, Enum):
    ADMIN = "ADMIN"
    OPERATOR = "OPERATOR"
    RELIEF_CENTER = "RELIEF_CENTER"

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl=f"{settings.API_V1_STR}/auth/login")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)

def hash_token(token: str) -> str:
    """Cryptographically hash a refresh or reset token with SHA-256 for secure storage."""
    return hashlib.sha256(token.encode("utf-8")).hexdigest()

def create_access_token(
    subject: Union[str, Any], 
    role: str, 
    center_id: Optional[int] = None, 
    expires_delta: Optional[timedelta] = None
) -> str:
    """Generate signed JWT access token with JTI and user claims."""
    now = datetime.utcnow()
    if expires_delta:
        expire = now + expires_delta
    else:
        expire = now + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    
    jti = str(uuid.uuid4())
    to_encode = {
        "jti": jti,
        "sub": str(subject),
        "role": role,
        "center_id": center_id,
        "iat": now,
        "exp": expire
    }
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt

def create_refresh_token() -> tuple[str, str, datetime]:
    """
    Generate a cryptographically secure random refresh token.
    Returns: (raw_token, sha256_hash, expires_at)
    """
    raw_token = secrets.token_urlsafe(48)
    token_hash = hash_token(raw_token)
    expires_at = datetime.utcnow() + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    return raw_token, token_hash, expires_at

def create_password_reset_token() -> tuple[str, str, datetime]:
    """
    Generate a time-limited (1 hour) single-use password reset token.
    Returns: (raw_token, sha256_hash, expires_at)
    """
    raw_token = secrets.token_urlsafe(32)
    token_hash = hash_token(raw_token)
    expires_at = datetime.utcnow() + timedelta(hours=1)
    return raw_token, token_hash, expires_at

def decode_access_token(token: str, db: Optional[Session] = None) -> dict:
    """
    Decode and validate a JWT access token.
    Checks signature, expiration, and database blacklist.
    """
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
    except ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has expired. Please refresh your session.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Check token revocation / blacklist if DB session is provided
    jti = payload.get("jti")
    if db is not None and jti:
        from app.models.user import BlacklistedToken
        is_blacklisted = db.query(BlacklistedToken).filter(BlacklistedToken.jti == jti).first()
        if is_blacklisted:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token has been revoked/logged out. Please log in again.",
                headers={"WWW-Authenticate": "Bearer"},
            )
            
    return payload
