from __future__ import annotations

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    database_url: str = "sqlite:///./fitlog.db"
    secret_key: str = "change-me-in-production"
    access_token_expire_days: int = 7
    cors_origins: list[str] = ["http://localhost:5173", "http://localhost:3000"]

    model_config = SettingsConfigDict(env_file=".env", env_prefix="FITLOG_")


settings = Settings()
