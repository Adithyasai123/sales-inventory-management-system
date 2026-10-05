from fastapi import APIRouter, Depends, Request
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.dependencies import get_current_user, check_login_rate_limit
from app.models.user import User
from app.schemas.auth import LoginRequest, TokenResponse, RefreshTokenRequest, UserMeResponse
from app.services.auth_service import AuthService

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/login", response_model=TokenResponse, dependencies=[Depends(check_login_rate_limit)])
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    """Authenticate with email and password to receive JWT access and refresh tokens."""
    service = AuthService(db)
    return service.login(payload.email, payload.password)


@router.post("/refresh", response_model=TokenResponse)
def refresh_token(payload: RefreshTokenRequest, db: Session = Depends(get_db)):
    """Exchange a valid refresh token for a fresh access and refresh token pair."""
    service = AuthService(db)
    return service.refresh(payload.refresh_token)


@router.get("/me", response_model=UserMeResponse)
def get_current_user_profile(current_user: User = Depends(get_current_user)):
    """Get details of the currently authenticated user."""
    return current_user
