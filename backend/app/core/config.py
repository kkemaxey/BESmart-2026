from functools import lru_cache

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings, loaded from environment variables (and `.env` locally)."""

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    PROJECT_NAME: str = "BESmart API"
    ENVIRONMENT: str = "local"  # local | staging | production
    API_V1_PREFIX: str = "/api/v1"

    # Async SQLAlchemy URL. Locally this points at the docker-compose MySQL container.
    # On Cloud Run with Cloud SQL, use the unix socket form, e.g.
    #   mysql+asyncmy://USER:PASS@/DB_NAME?unix_socket=/cloudsql/PROJECT:REGION:INSTANCE
    DATABASE_URL: str = "mysql+asyncmy://besmart:besmart@localhost:3306/besmart"
    DB_ECHO: bool = False

    # Comma-separated list of allowed frontend origins.
    CORS_ORIGINS: list[str] = ["http://localhost:3000"]

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def split_origins(cls, v: str | list[str]) -> list[str]:
        if isinstance(v, str) and not v.startswith("["):
            return [origin.strip() for origin in v.split(",") if origin.strip()]
        return v


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
