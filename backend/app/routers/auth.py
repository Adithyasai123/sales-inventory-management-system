from typing import Optional
from fastapi import APIRouter, Depends, Request, Response
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.config import settings
from app.core.exceptions import UnauthorizedException
from app.dependencies import get_current_user, check_login_rate_limit
from app.models.user import User
from app.schemas.auth import LoginRequest, LoginResponse, RefreshResponse, RefreshTokenRequest, UserMeResponse
from app.services.auth_service import AuthService

from app.core.security import encrypt_token

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/login", response_model=LoginResponse, dependencies=[Depends(check_login_rate_limit)])
def login(payload: LoginRequest, response: Response, db: Session = Depends(get_db)):
    """Authenticate with email and password, setting secure encrypted HttpOnly cookies without exposing tokens."""
    service = AuthService(db)
    user = service.user_repo.get_by_email(payload.email)
    tokens = service.login(payload.email, payload.password)
    
    encrypted_access_token = encrypt_token(tokens.access_token)
    encrypted_refresh_token = encrypt_token(tokens.refresh_token)

    # Store encrypted tokens in secure HttpOnly cookies ONLY
    response.set_cookie(
        key="access_token",
        value=encrypted_access_token,
        httponly=True,
        samesite="lax",
        secure=settings.ENVIRONMENT == "production",
        max_age=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        path="/",
    )
    response.set_cookie(
        key="refresh_token",
        value=encrypted_refresh_token,
        httponly=True,
        samesite="lax",
        secure=settings.ENVIRONMENT == "production",
        max_age=settings.REFRESH_TOKEN_EXPIRE_DAYS * 86400,
        path="/",
    )
    return LoginResponse(
        message="Login successful",
        user=user,
    )


@router.post("/refresh", response_model=RefreshResponse)
def refresh_token(
    request: Request,
    response: Response,
    payload: Optional[RefreshTokenRequest] = None,
    db: Session = Depends(get_db),
):
    """Exchange a valid refresh token (from encrypted HttpOnly cookie or body) for a fresh pair in cookies."""
    token_str: Optional[str] = None
    if payload and payload.refresh_token:
        token_str = payload.refresh_token
    elif "refresh_token" in request.cookies:
        token_str = request.cookies.get("refresh_token")

    if not token_str:
        raise UnauthorizedException("Refresh token is required")

    service = AuthService(db)
    tokens = service.refresh(token_str)
    
    encrypted_access_token = encrypt_token(tokens.access_token)
    encrypted_refresh_token = encrypt_token(tokens.refresh_token)

    response.set_cookie(
        key="access_token",
        value=encrypted_access_token,
        httponly=True,
        samesite="lax",
        secure=settings.ENVIRONMENT == "production",
        max_age=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        path="/",
    )
    response.set_cookie(
        key="refresh_token",
        value=encrypted_refresh_token,
        httponly=True,
        samesite="lax",
        secure=settings.ENVIRONMENT == "production",
        max_age=settings.REFRESH_TOKEN_EXPIRE_DAYS * 86400,
        path="/",
    )
    return RefreshResponse(
        message="Token refreshed successfully",
    )


@router.post("/logout")
def logout(response: Response):
    """Clear HttpOnly authentication cookies to securely end the session."""
    response.delete_cookie(
        key="access_token",
        path="/",
        samesite="lax",
    )
    response.delete_cookie(
        key="refresh_token",
        path="/",
        samesite="lax",
    )
    return {"message": "Logged out successfully"}


@router.get("/me", response_model=UserMeResponse)
def get_current_user_profile(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get details of the currently authenticated user including manager name."""
    manager_name = None
    if current_user.manager_id:
        mgr = db.query(User).filter(User.id == current_user.manager_id).first()
        if mgr:
            manager_name = mgr.full_name

    res = UserMeResponse.model_validate(current_user)
    res.manager_name = manager_name
    return res
