from datetime import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr, Field, ConfigDict
from app.core.security import UserRole

class UserBase(BaseModel):
    email: EmailStr
    username: str = Field(..., min_length=3, max_length=50)
    role: UserRole = UserRole.RELIEF_CENTER
    center_id: Optional[int] = None
    is_active: bool = True

class UserCreate(BaseModel):
    email: EmailStr
    username: str = Field(..., min_length=3, max_length=50)
    password: str = Field(..., min_length=6)
    role: UserRole = UserRole.RELIEF_CENTER
    center_id: Optional[int] = None

class UserResponse(BaseModel):
    id: int
    email: EmailStr
    username: str
    role: UserRole
    center_id: Optional[int] = None
    is_active: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class LoginRequest(BaseModel):
    username_or_email: str
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: UserRole
    username: str
    center_id: Optional[int] = None

class TokenPayload(BaseModel):
    sub: Optional[str] = None
    role: Optional[str] = None
    center_id: Optional[int] = None
    exp: Optional[int] = None
