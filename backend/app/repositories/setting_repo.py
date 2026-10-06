from decimal import Decimal
from typing import Optional, List
from sqlalchemy.orm import Session
from app.models.setting import SystemSetting
from app.core.config import settings
from app.repositories.base import BaseRepository


class SettingRepository(BaseRepository[SystemSetting]):
    def __init__(self, db: Session):
        super().__init__(SystemSetting, db)

    def get_by_key(self, key: str) -> Optional[SystemSetting]:
        return (
            self.db.query(SystemSetting)
            .filter(SystemSetting.key == key.strip())
            .first()
        )

    def get_approval_threshold(self) -> Decimal:
        setting = self.get_by_key("approval_threshold")
        if setting and setting.value:
            try:
                return Decimal(setting.value)
            except Exception:
                return settings.DEFAULT_APPROVAL_THRESHOLD
        return settings.DEFAULT_APPROVAL_THRESHOLD

    def set_value(self, key: str, value: str, description: Optional[str] = None) -> SystemSetting:
        setting = self.get_by_key(key)
        if setting:
            setting.value = value
            if description:
                setting.description = description
        else:
            setting = SystemSetting(key=key, value=value, description=description)
            self.db.add(setting)
        self.db.flush()
        return setting

    def list_all(self) -> List[SystemSetting]:
        # Ensure default currency and threshold settings exist
        if not self.get_by_key("currency_code"):
            self.set_value("currency_code", settings.CURRENCY_CODE, "ISO 4217 currency code used for formatting monetary values.")
        if not self.get_by_key("currency_locale"):
            self.set_value("currency_locale", settings.CURRENCY_LOCALE, "BCP 47 locale tag used for Intl.NumberFormat currency formatting.")
        if not self.get_by_key("approval_threshold"):
            self.set_value("approval_threshold", str(settings.DEFAULT_APPROVAL_THRESHOLD), "Orders with total_amount exceeding this threshold require manager approval.")
        self.db.commit()
        return self.db.query(SystemSetting).order_by(SystemSetting.key.asc()).all()
