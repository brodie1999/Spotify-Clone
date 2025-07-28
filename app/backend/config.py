import os
from pathlib import Path
import secrets
from typing import Optional

from pydantic import Field, field_validator, ConfigDict
from pydantic_settings import BaseSettings


# === MANUAL ENVIRONMENT LOADING ===
def ensure_env_loaded():
    """Manually ensure .env file is loaded"""

    # Find .env file
    possible_env_paths = [
        Path.cwd() / ".env",
        Path(__file__).parent.parent / ".env",
        Path(__file__).parent.parent.parent / ".env"
    ]

    env_file = None
    for path in possible_env_paths:
        if path.exists():
            env_file = path
            break
    if not env_file:
        raise FileNotFoundError(f"No .env file in {possible_env_paths}")

    print(f"Loading .env file in {env_file}")

    # Manual parsing and loading (NOT RELYING ON PYTHON-DOTENV)
    try:
        with open(env_file, "r", encoding="utf-8") as f:
            for line_num, line in enumerate(f, 1):
                line = line.strip()

                # Skip empty lines and comments
                if not line or line.startswith("#"):
                    continue

                # Parse key=value
                if '=' not in line:
                    continue

                key, value = line.split('=', 1)
                key = key.strip()
                value = value.strip()

                # Remove quotes if present
                if value.startswith('"') and value.endswith('"'):
                    value = value[1:-1]
                elif value.startswith("'") and value.endswith("'"):
                    value = value[1:-1]

                # Set environment variable
                os.environ[key] = value
        print(f"Manually loaded .env file")

        # Verify critical variables
        required_vars = ['DATABASE_URL', 'JWT_SECRET_KEY', 'DB_NAME', 'DB_USER', 'DB_PASSWORD']
        missing = []

        for var in required_vars:
            if not os.getenv(var):
                missing.append(var)

        if missing:
            raise ValueError(f"Missing environment variables: {missing}")

        print(f"All required environment variables are set")
    except Exception as e:
        print(f"Error loading .env file: {e}")
        raise
# Load environment variables immediately
ensure_env_loaded()


class Settings(BaseSettings):
    # Configure Pydantic to ignore extra fields and specify env file
    model_config = ConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra='ignore'
    )

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

    @field_validator('jwt_secret_key')
    @classmethod
    def validate_jwt_secret(cls, v):
        if len(v) < 32:
            raise ValueError("jwt_secret_key must be at least 32 characters long")
        return v

    @field_validator('bcrypt_rounds')
    @classmethod
    def validate_bcrypt_rounds(cls, v):
        if v < 10 or v > 15:
            raise ValueError('Bcrypt rounds must be between 10 and 15')
        return v

    @classmethod
    def generate_secret_key(cls) -> str:
        """GENERATE A SECURE SECRET KEY FOR JWT"""
        return secrets.token_urlsafe(32)

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
