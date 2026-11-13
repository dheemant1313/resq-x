from datetime import datetime, timedelta
from typing import Any
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import get_db
from app.core.security import (
    verify_password,
    get_password_hash,
    create_access_token,
    create_refresh_token,
    create_password_reset_token,
    hash_token,
    decode_access_token,
    UserRole
)
from app.models.user import (
    User,
    OperatorProfile,
    AdminProfile,
    RefreshToken,
    BlacklistedToken,
    PasswordResetToken
)
from app.models.relief_center import ReliefCenter
from app.schemas.user import (
    UserCreate,
    OperatorCreate,
    UserResponse,
    Token,
    LoginRequest,
    RefreshTokenRequest,
    ForgotPasswordRequest,
    ResetPasswordRequest
)
from app.api.deps import get_current_user, require_admin, oauth2_scheme
from app.middleware.rate_limiter import check_auth_rate_limit

router = APIRouter()

@router.post("/login", response_model=Token)
def login(
    login_data: LoginRequest, 
    request: Request,
    db: Session = Depends(get_db),
    _rate_limit: Any = Depends(check_auth_rate_limit)
) -> Any:
    """
    Authenticate user and issue JWT access token + secure refresh token.
    Supports role context resolution and multi-portal disambiguation.
    """
    query = db.query(User).filter(
        (User.username == login_data.username_or_email) | 
        (User.email == login_data.username_or_email)
    )
    
    if login_data.role:
        query = query.filter(User.role == login_data.role)
        
    candidates = query.all()
    user = None
    for candidate in candidates:
        if verify_password(login_data.password, candidate.hashed_password):
            user = candidate
            break
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username/email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is deactivated. Contact system administrator."
        )

    # 1. Create short-lived Access Token
    access_token = create_access_token(
        subject=user.id,
        role=user.role.value,
        center_id=user.center_id,
        expires_delta=timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    )

    # 2. Create long-lived cryptographically hashed Refresh Token
    raw_refresh_token, refresh_hash, refresh_expires_at = create_refresh_token()
    db_refresh = RefreshToken(
        user_id=user.id,
        token_hash=refresh_hash,
        expires_at=refresh_expires_at,
        revoked=False
    )
    db.add(db_refresh)
    db.commit()

    return {
        "access_token": access_token,
        "refresh_token": raw_refresh_token,
        "token_type": "bearer",
        "role": user.role,
        "username": user.username,
        "center_id": user.center_id
    }

@router.post("/register", response_model=UserResponse)
@router.post("/register-relief-center", response_model=UserResponse)
def register_relief_center_user(
    user_in: UserCreate, 
    request: Request,
    db: Session = Depends(get_db),
    _rate_limit: Any = Depends(check_auth_rate_limit)
) -> Any:
    """
    Public registration strictly for NDRF / Relief Center personnel.
    Operator and Admin accounts cannot be self-registered.
    """
    # Strict Role Guard: Prevent privilege escalation
    if user_in.role != UserRole.RELIEF_CENTER:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Public registration is restricted to RELIEF_CENTER accounts only. Operators and Administrators must be provisioned by an Administrator."
        )

    # Check for existing email or username within the same role
    existing_user = db.query(User).filter(
        (User.email == user_in.email) | 
        ((User.username == user_in.username) & (User.role == UserRole.RELIEF_CENTER))
    ).first()
    
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user with this email or username already exists in the system."
        )

    # Validate center if center_id provided
    if user_in.center_id:
        center = db.query(ReliefCenter).filter(ReliefCenter.id == user_in.center_id).first()
        if not center:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Relief Center with ID #{user_in.center_id} not found."
            )

    new_user = User(
        email=user_in.email,
        username=user_in.username,
        hashed_password=get_password_hash(user_in.password),
        role=UserRole.RELIEF_CENTER,
        center_id=user_in.center_id,
        is_active=True
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

@router.post("/refresh", response_model=Token)
def refresh_session(
    refresh_data: RefreshTokenRequest,
    db: Session = Depends(get_db)
) -> Any:
    """
    Exchange a valid refresh token for a new access token and rotated refresh token.
    Enforces single-use token rotation strategy.
    """
    req_hash = hash_token(refresh_data.refresh_token)
    db_token = db.query(RefreshToken).filter(RefreshToken.token_hash == req_hash).first()

    if not db_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    if db_token.revoked:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token has already been revoked. Please sign in again.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if db_token.expires_at < datetime.utcnow():
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token has expired. Please sign in again.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user = db.query(User).filter(User.id == db_token.user_id).first()
    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User associated with refresh token is inactive or not found.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # 1. Rotate Token: revoke current refresh token
    db_token.revoked = True

    # 2. Issue new Access Token & new Refresh Token
    new_access = create_access_token(
        subject=user.id,
        role=user.role.value,
        center_id=user.center_id,
        expires_delta=timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    )

    new_raw_refresh, new_refresh_hash, new_refresh_exp = create_refresh_token()
    new_db_refresh = RefreshToken(
        user_id=user.id,
        token_hash=new_refresh_hash,
        expires_at=new_refresh_exp,
        revoked=False
    )
    db.add(new_db_refresh)
    db.commit()

    return {
        "access_token": new_access,
        "refresh_token": new_raw_refresh,
        "token_type": "bearer",
        "role": user.role,
        "username": user.username,
        "center_id": user.center_id
    }

@router.post("/logout")
def logout(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    token: str = Depends(oauth2_scheme)
) -> Any:
    """
    Logout the authenticated user.
    1. Blacklists current JWT access token JTI to prevent reuse.
    2. Revokes all active refresh tokens for the user.
    """
    payload = decode_access_token(token, db=db)
    jti = payload.get("jti")
    exp_ts = payload.get("exp")

    # Blacklist current access token JTI until its expiration
    if jti and exp_ts:
        exp_dt = datetime.utcfromtimestamp(exp_ts)
        existing = db.query(BlacklistedToken).filter(BlacklistedToken.jti == jti).first()
        if not existing:
            blacklisted = BlacklistedToken(jti=jti, expires_at=exp_dt)
            db.add(blacklisted)

    # Revoke all active refresh tokens for the user
    db.query(RefreshToken).filter(
        RefreshToken.user_id == current_user.id,
        RefreshToken.revoked == False
    ).update({"revoked": True})

    db.commit()
    return {"detail": "Successfully logged out. Access token invalidated and refresh tokens revoked."}

@router.get("/me", response_model=UserResponse)
def get_current_user_profile(
    current_user: User = Depends(get_current_user)
) -> Any:
    """
    Fetch the currently authenticated user's profile and credentials.
    Verified on backend via cryptographic JWT claims.
    """
    return current_user

@router.post("/create-operator", response_model=UserResponse)
def create_operator_user(
    operator_in: OperatorCreate,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
) -> Any:
    """
    Admin-only endpoint to create verified Operator accounts with OperatorProfile.
    Operators have command authority over regional allocations and vehicle routing.
    """
    existing_user = db.query(User).filter(
        (User.email == operator_in.email) | 
        ((User.username == operator_in.username) & (User.role == UserRole.OPERATOR))
    ).first()
    
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An Operator with this email or username already exists in the system."
        )

    badge_number = operator_in.badge_number or f"OP-BADGE-{operator_in.username.upper()}"
    existing_badge = db.query(OperatorProfile).filter(OperatorProfile.badge_number == badge_number).first()
    if existing_badge:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Badge number '{badge_number}' is already assigned to another Operator."
        )

    new_operator = User(
        email=operator_in.email,
        username=operator_in.username,
        hashed_password=get_password_hash(operator_in.password),
        role=UserRole.OPERATOR,
        center_id=None,
        is_active=True
    )
    db.add(new_operator)
    db.flush()

    profile = OperatorProfile(
        user_id=new_operator.id,
        badge_number=badge_number,
        department=operator_in.department or "Central Logistics Operations",
        clearance_level=operator_in.clearance_level or 2,
        assigned_region=operator_in.assigned_region or "National Logistics Fleet"
    )
    db.add(profile)
    db.commit()
    db.refresh(new_operator)
    return new_operator

@router.post("/forgot-password")
def forgot_password(
    req: ForgotPasswordRequest,
    request: Request,
    db: Session = Depends(get_db),
    _rate_limit: Any = Depends(check_auth_rate_limit)
) -> Any:
    """
    Generate a time-limited (1-hour) single-use password reset token.
    """
    user = db.query(User).filter(
        (User.email == req.email_or_username) | 
        (User.username == req.email_or_username)
    ).first()

    if not user:
        # Avoid user enumeration in public responses
        return {"detail": "If the account exists, a time-limited password reset token has been issued."}

    raw_token, token_hash, expires_at = create_password_reset_token()
    db_token = PasswordResetToken(
        user_id=user.id,
        token_hash=token_hash,
        expires_at=expires_at,
        used=False
    )
    db.add(db_token)
    db.commit()

    return {
        "detail": "If the account exists, a time-limited password reset token has been issued.",
        "reset_token": raw_token
    }

@router.post("/reset-password")
def reset_password(
    req: ResetPasswordRequest,
    db: Session = Depends(get_db)
) -> Any:
    """
    Reset password using a valid, single-use, time-limited token.
    """
    req_hash = hash_token(req.token)
    db_token = db.query(PasswordResetToken).filter(PasswordResetToken.token_hash == req_hash).first()

    if not db_token or db_token.used:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired password reset token."
        )

    if db_token.expires_at < datetime.utcnow():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password reset token has expired."
        )

    user = db.query(User).filter(User.id == db_token.user_id).first()
    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Account associated with token is not active."
        )

    user.hashed_password = get_password_hash(req.new_password)
    db_token.used = True
    db.commit()

    return {"detail": "Password has been successfully updated. You can now log in with your new credentials."}
