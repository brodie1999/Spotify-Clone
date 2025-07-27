from typing import Optional
import secrets
from typing import Optional

from pydantic import Field
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # Database settings
    database_url: str = Field(..., env="DATABASE_URL")
    db_host: str = Field(default="localhost", env="DB_HOST")
    db_port: int = Field(default=5432, env="DB_PORT")
    db_name: str = Field(..., env="DB_NAME")
    db_user: str = Field(..., env="DB_USER")
    db_password: str = Field(..., env="DB_PASSWORD")

    # JWT Settings
    jwt_secret_key: str = Field(..., env="JWT_SECRET_KEY")
    jwt_algorithm: str = Field(default="HS256", env="JWT_ALGORITHM")
    jwt_access_token_expire_minutes: int = Field(default=30, env="JWT_ACCESS_TOKEN_EXPIRE_MINUTES")

    # External API keys
    youtube_api_key: Optional[str] = Field(None, env="YOUTUBE_API_KEY")

    # Application Settings
    debug: bool = Field(default=False, env="DEBUG")
    environment: str = Field(default="development", env="ENVIRONMENT")
    api_host: str = Field(default="localhost", env="API_HOST")
    api_port: int = Field(default=8002, env="API_PORT")

    # Security Settings
    bcrypt_rounds: int = Field(default=12, env="BCRYPT_ROUNDS")
    min_password_length: int = Field(default=8, env="MIN_PASSWORD_LENGTH")
    max_password_length: int = Field(default=128, env="MAX_PASSWORD_LENGTH")

    @classmethod
    def validate_jwt_secret(cls, v):
        if len(v) < 32:
            raise ValueError("jwt_secret_key must be at least 32 characters long")
        return v

    @classmethod
    def validate_bcrypt_rounds(cls, v):
        if v < 10 or v > 15:
            raise ValueError('Bcrypt rounds must be between 10 and 15')
        return v

    @classmethod
    def generate_secret_key(cls) -> str:
        """GENERATE A SECURE SECRET KEY FOR JWT"""
        return secrets.token_urlsafe(32)

    class Config:
        env_file = ".env"
        case_sensitive = False

settings = Settings()

# Validate critical settings on startup
def validate_settings():
    """VALIDATE CRITICAL SETTINGS AND PROVIDE HELPFUL ERROR MESSAGES"""
    errors = []

    if not settings.database_url:
        errors.append("DATABASE_URL must be set")

    if not settings.jwt_secret_key:
        errors.append("JWT_SECRET_KEY must be set")

    if not settings.youtube_api_key and len(settings.youtube_api_key) < 10:
        errors.append("YOUTUBE_API_KEY appears to be invalid")

    if errors:
        raise ValueError(f"Configuration error: {errors}")

# Validate on import
validate_settings()