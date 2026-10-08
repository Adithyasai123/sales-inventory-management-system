from decimal import Decimal
from typing import List, Union
from pydantic import AnyHttpUrl, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    PROJECT_NAME: str = "Sales & Inventory Management System (SIMS)"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    ENVIRONMENT: str = "development"

    # Database
    DATABASE_URL: str = "mysql+pymysql://sims_user:sims_password@localhost:3306/sims_db"

    # Security & JWT
    JWT_SECRET_KEY: str = "09d25e094faa6ca2556c818166b7a9563b93f7099f6f0f4caa6cf63b88e8d3e7"
    JWT_REFRESH_SECRET_KEY: str = "87b9201f114c0a52f9543e33fbe4d9b23a54b38d381014e7811dc31f8b4d89e2"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 15
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # CORS
    BACKEND_CORS_ORIGINS: str = "http://localhost:3000,http://localhost:5173,http://127.0.0.1:5173,http://localhost:80"

    @property
    def cors_origins(self) -> List[str]:
        if not self.BACKEND_CORS_ORIGINS:
            return ["*"]
        val = str(self.BACKEND_CORS_ORIGINS).strip()
        if val.startswith("[") and val.endswith("]"):
            import json
            try:
                parsed = json.loads(val)
                if isinstance(parsed, list):
                    return parsed
            except Exception:
                pass
        return [i.strip() for i in val.split(",") if i.strip()]

    # SMTP Configuration (Live Gmail SMTP defaults so emails deliver reliably in cloud environments)
    SMTP_HOST: str = "smtp.gmail.com"
    SMTP_PORT: int = 587
    SMTP_USER: str = "adithyasainulu@gmail.com"
    SMTP_PASSWORD: str = "cfzmyefbbtxfjjkd"
    SMTP_TLS: bool = True
    SMTP_SSL: bool = False
    EMAILS_FROM_EMAIL: str = "adithyasainulu@gmail.com"
    EMAILS_FROM_NAME: str = "SIMS Notifications"
    RESEND_API_KEY: str = ""

    # Frontend URL for email action links & redirection
    FRONTEND_URL: str = "https://sales-inventory-management-system-lyart.vercel.app"

    # Default Business Rules
    DEFAULT_APPROVAL_THRESHOLD: Decimal = Decimal("75000.00")
    CURRENCY_CODE: str = "INR"
    CURRENCY_LOCALE: str = "en-IN"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore",
    )


settings = Settings()
