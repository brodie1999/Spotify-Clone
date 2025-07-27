# Implement Auth Utility Functions
import os
from datetime import timedelta, timezone, datetime
from typing import Optional

from jose import jwt
from passlib.context import CryptContext

from app.backend.config import settings
from app.backend.services.password_validator import password_validator, PasswordValidationResult

# Load from env or .env
SECRET_KEY = settings.jwt_secret_key
ALGORITHM = settings.jwt_algorithm
ACCESS_TOKEN_EXPIRE_MINUTES = settings.jwt_access_token_expire_minutes

pwd_context = CryptContext(
    schemes=["bcrypt"],
    deprecated="auto",
    bcrypt__rounds = settings.bcrypt_rounds
)

def validate_password_strength(password: str) -> PasswordValidationResult:
    """Validate password length and requirements"""
    return password_validator.validate_password(password)

# Password hashing
def hashing_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

# JWT token creation
def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    try:
        to_encode = data.copy()
        expire = datetime.now(timezone.utc) + (
                expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        )
        to_encode.update({"exp": expire})
        return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    except Exception as e:
        return print("ERROR: CREATING TOKEN FAILED: ", str(e))
def decode_access_token(token: str) -> dict:
    """Decode and validate JWT token"""
    try:
        return jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    except jwt.ExpiredSignatureError:
        raise ValueError("Expired token")
    except jwt.JWTError:
        raise ValueError("Invalid token")
