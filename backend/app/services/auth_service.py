from sqlalchemy.orm import Session
from app.core.security import verify_password, create_access_token, create_refresh_token, decode_token
from app.core.config import settings
from app.core.exceptions import UnauthorizedException
from app.repositories.user_repo import UserRepository
from app.schemas.auth import TokenResponse, UserMeResponse
from app.models.user import User


class AuthService:
    def __init__(self, db: Session):
        self.db = db
        self.user_repo = UserRepository(db)

    def login(self, email: str, password: str) -> TokenResponse:
        user = self.user_repo.get_by_email(email)
        if not user or not verify_password(password, user.hashed_password):
            raise UnauthorizedException("Incorrect email or password")

        if not user.is_active:
            raise UnauthorizedException("User account is inactive. Please contact your administrator.")

        role_str = user.role.value if hasattr(user.role, "value") else str(user.role)
        access_token = create_access_token(subject=user.id, role=role_str)
        refresh_token = create_refresh_token(subject=user.id)

        return TokenResponse(
            access_token=access_token,
            refresh_token=refresh_token,
            token_type="bearer",
            expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        )

    def refresh(self, refresh_token_str: str) -> TokenResponse:
        try:
            payload = decode_token(refresh_token_str, settings.JWT_REFRESH_SECRET_KEY)
            if payload.get("type") != "refresh":
                raise UnauthorizedException("Invalid token type")
            user_id = int(payload.get("sub"))
        except Exception:
            raise UnauthorizedException("Invalid or expired refresh token")

        user = self.user_repo.get_by_id(user_id)
        if not user or not user.is_active:
            raise UnauthorizedException("User no longer exists or is inactive")

        role_str = user.role.value if hasattr(user.role, "value") else str(user.role)
        new_access_token = create_access_token(subject=user.id, role=role_str)
        new_refresh_token = create_refresh_token(subject=user.id)

        return TokenResponse(
            access_token=new_access_token,
            refresh_token=new_refresh_token,
            token_type="bearer",
            expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        )
