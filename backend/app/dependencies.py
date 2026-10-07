import time
from typing import List, Callable, Dict, Optional, Union
from fastapi import Depends, HTTPException, status, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.config import settings
from app.core.security import decode_token
from app.core.exceptions import UnauthorizedException, PermissionDeniedException
from app.models.user import User, UserRole
from app.repositories.user_repo import UserRepository

security_bearer = HTTPBearer(auto_error=False)


def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security_bearer),
    db: Session = Depends(get_db),
) -> User:
    if not credentials or not credentials.credentials:
        raise UnauthorizedException("Authentication token is required")

    try:
        payload = decode_token(credentials.credentials, settings.JWT_SECRET_KEY)
        if payload.get("type") != "access":
            raise UnauthorizedException("Invalid token type")
        user_id = int(payload.get("sub"))
    except Exception:
        raise UnauthorizedException("Invalid or expired authentication token")

    user_repo = UserRepository(db)
    user = user_repo.get_by_id(user_id)
    if not user:
        raise UnauthorizedException("User associated with this token does not exist")

    if not user.is_active:
        raise UnauthorizedException("User account has been deactivated")

    return user


def require_role(*allowed_roles: Union[UserRole, str]) -> Callable[[User], User]:
    def role_checker(current_user: User = Depends(get_current_user)) -> User:
        allowed_str = [r.value if hasattr(r, "value") else str(r) for r in allowed_roles]
        user_role_str = current_user.role.value if hasattr(current_user.role, "value") else str(current_user.role)
        if user_role_str not in allowed_str:
            role_names = ", ".join(allowed_str)
            raise PermissionDeniedException(required_role=role_names)
        return current_user
    return role_checker


def require_permission(permission_name: str) -> Callable[[User], User]:
    """Enforce a dynamic database capability permission (e.g. can_adjust_stock, can_view_audit)."""
    def perm_checker(current_user: User = Depends(get_current_user)) -> User:
        if not current_user.has_permission(permission_name):
            raise PermissionDeniedException(f"Missing required permission: {permission_name}")
        return current_user
    return perm_checker


# In-memory sliding window rate limiter for login attempts
_login_attempts: Dict[str, List[float]] = {}


def check_login_rate_limit(request: Request) -> None:
    client_ip = request.client.host if request.client else "unknown"
    now = time.time()
    window = 60.0  # 60 seconds
    max_attempts = 10  # 10 attempts per minute per IP

    # Purge old records
    attempts = [t for t in _login_attempts.get(client_ip, []) if now - t < window]
    if len(attempts) >= max_attempts:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail={"code": "RATE_LIMIT_EXCEEDED", "message": "Too many login attempts. Please wait a minute and try again."},
        )
    
    attempts.append(now)
    _login_attempts[client_ip] = attempts
