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

class OperatorProfileCreate(BaseModel):
    badge_number: str = Field(..., min_length=3, max_length=50)
    department: Optional[str] = "Central Logistics Operations"
    clearance_level: Optional[int] = Field(2, ge=1, le=5)
    assigned_region: Optional[str] = "National Logistics Fleet"

class OperatorCreate(BaseModel):
    email: EmailStr
    username: str = Field(..., min_length=3, max_length=50)
    password: str = Field(..., min_length=6)
    badge_number: Optional[str] = Field(None, max_length=50)
    department: Optional[str] = "Central Logistics Operations"
    clearance_level: Optional[int] = Field(2, ge=1, le=5)
    assigned_region: Optional[str] = "National Logistics Fleet"

class OperatorProfileResponse(BaseModel):
    id: int
    user_id: int
    badge_number: str
    department: str
    clearance_level: int
    assigned_region: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class AdminProfileResponse(BaseModel):
    id: int
    user_id: int
    superadmin: bool
    access_scope: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class UserResponse(BaseModel):
    id: int
    email: EmailStr
    username: str
    role: UserRole
    center_id: Optional[int] = None
    is_active: bool
    created_at: datetime
    operator_profile: Optional[OperatorProfileResponse] = None
    admin_profile: Optional[AdminProfileResponse] = None

    model_config = ConfigDict(from_attributes=True)

class LoginRequest(BaseModel):
    username_or_email: str
    password: str
    role: Optional[UserRole] = None

class Token(BaseModel):
    access_token: str
    refresh_token: Optional[str] = None
    token_type: str = "bearer"
    role: UserRole
    username: str
    center_id: Optional[int] = None

class RefreshTokenRequest(BaseModel):
    refresh_token: str

class ForgotPasswordRequest(BaseModel):
    email_or_username: str

class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str = Field(..., min_length=6)

class TokenPayload(BaseModel):
    jti: Optional[str] = None
    sub: Optional[str] = None
    role: Optional[str] = None
    center_id: Optional[int] = None
    exp: Optional[int] = None
