from typing import List
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import get_db
from app.core.security import decode_access_token, UserRole
from app.models.user import User

oauth2_scheme = OAuth2PasswordBearer(tokenUrl=f"{settings.API_V1_STR}/auth/login")

def get_current_user(
    db: Session = Depends(get_db),
    token: str = Depends(oauth2_scheme)
) -> User:
    payload = decode_access_token(token, db=db)
    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication token: missing user identifier",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    user = db.query(User).filter(User.id == int(user_id)).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User account no longer exists"
        )
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Inactive user account"
        )
    return user

get_current_active_user = get_current_user

class RoleChecker:
    def __init__(self, allowed_roles: List[UserRole]):
        self.allowed_roles = allowed_roles

    def __call__(self, current_user: User = Depends(get_current_user)) -> User:
        if current_user.role not in self.allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Operation not permitted. Required role: {[r.value for r in self.allowed_roles]}, your role: {current_user.role.value}"
            )
        return current_user

# Predefined role dependencies
require_admin = RoleChecker([UserRole.ADMIN])
require_operator = RoleChecker([UserRole.ADMIN, UserRole.OPERATOR])
require_relief_center = RoleChecker([UserRole.ADMIN, UserRole.OPERATOR, UserRole.RELIEF_CENTER])
require_relief_center_only = RoleChecker([UserRole.RELIEF_CENTER])

def verify_center_access(target_center_id: int, current_user: User):
    """
    Prevents unauthorized cross-center data tampering.
    Admins and Operators have global jurisdiction.
    Relief Center users can only access their own center's data.
    """
    if current_user.role in [UserRole.ADMIN, UserRole.OPERATOR]:
        return True
    if current_user.role == UserRole.RELIEF_CENTER:
        if current_user.center_id != target_center_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied: You are not authorized to view or modify data for Center #{target_center_id}."
            )
        return True
    raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied.")
