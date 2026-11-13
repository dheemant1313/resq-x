from datetime import timedelta
from typing import Any
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import get_db
from app.core.security import verify_password, get_password_hash, create_access_token, UserRole
from app.models.user import User
from app.models.relief_center import ReliefCenter
from app.schemas.user import UserCreate, UserResponse, Token, LoginRequest
from app.api.deps import get_current_user, require_admin

router = APIRouter()

@router.post("/login", response_model=Token)
def login(login_data: LoginRequest, db: Session = Depends(get_db)) -> Any:
    """
    Authenticate user and issue JWT access token.
    Works for Admin, Operator, and Relief Center roles.
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

    access_token = create_access_token(
        subject=user.id,
        role=user.role.value,
        center_id=user.center_id,
        expires_delta=timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    )

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "role": user.role,
        "username": user.username,
        "center_id": user.center_id
    }

@router.post("/register-relief-center", response_model=UserResponse)
def register_relief_center_user(user_in: UserCreate, db: Session = Depends(get_db)) -> Any:
    """
    Public registration strictly for NDRF / Relief Center personnel.
    Operator accounts cannot be registered here.
    """
    # Force role to RELIEF_CENTER (never trust client role)
    if user_in.role != UserRole.RELIEF_CENTER:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Public registration is restricted to RELIEF_CENTER accounts only. Operators must be provisioned by an Administrator."
        )

    # Check for existing email or username
    existing_user = db.query(User).filter(
        (User.email == user_in.email) | (User.username == user_in.username)
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

@router.post("/create-operator", response_model=UserResponse)
def create_operator_account(
    user_in: UserCreate,
    current_admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
) -> Any:
    """
    Admin-only endpoint to create Operator accounts.
    Strictly enforced RBAC requirement.
    """
    existing_user = db.query(User).filter(
        (User.email == user_in.email) | (User.username == user_in.username)
    ).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user with this email or username already exists."
        )

    new_operator = User(
        email=user_in.email,
        username=user_in.username,
        hashed_password=get_password_hash(user_in.password),
        role=UserRole.OPERATOR,
        center_id=None,
        is_active=True
    )
    db.add(new_operator)
    db.commit()
    db.refresh(new_operator)
    return new_operator

@router.post("/bootstrap-admin", response_model=UserResponse)
def bootstrap_admin(user_in: UserCreate, db: Session = Depends(get_db)) -> Any:
    """
    One-time bootstrap endpoint to initialize the primary system administrator
    if no administrators exist yet.
    """
    existing_admin = db.query(User).filter(User.role == UserRole.ADMIN).first()
    if existing_admin:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="System already initialized with an Administrator account. Login with existing admin credentials."
        )

    admin_user = User(
        email=user_in.email,
        username=user_in.username,
        hashed_password=get_password_hash(user_in.password),
        role=UserRole.ADMIN,
        center_id=None,
        is_active=True
    )
    db.add(admin_user)
    db.commit()
    db.refresh(admin_user)
    return admin_user

@router.get("/me", response_model=UserResponse)
def get_current_user_profile(current_user: User = Depends(get_current_user)) -> Any:
    """
    Get profile details and assigned role of the currently logged-in user.
    """
    return current_user
