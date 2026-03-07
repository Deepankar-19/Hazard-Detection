"""
Application configuration loaded from environment variables.
"""

from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    # ── Database ──
    DATABASE_URL: str = "postgresql+asyncpg://roadguard:roadguard@localhost:5432/roadguard"
    SYNC_DATABASE_URL: str = "postgresql://roadguard:roadguard@localhost:5432/roadguard"

    # ── Redis ──
    REDIS_URL: str = "redis://localhost:6379/0"

    # ── JWT ──
    JWT_SECRET_KEY: str = "change-me-to-a-random-secret"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60

    # ── S3 / MinIO ──
    S3_ENDPOINT_URL: str = "http://localhost:9000"
    S3_ACCESS_KEY: str = "minioadmin"
    S3_SECRET_KEY: str = "minioadmin"
    S3_BUCKET_NAME: str = "roadguard-images"
    S3_REGION: str = "us-east-1"

    # ── ML ──
    YOLO_MODEL_PATH: str = "yolov8n.pt"

    # ── App ──
    APP_ENV: str = "development"

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8"}


@lru_cache()
def get_settings() -> Settings:
    return Settings()
