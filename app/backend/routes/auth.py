from fastapi import APIRouter, Depends, status
from sqlmodel import Session

from app.backend.schemas.auth import UserRegister, UserLogin
from app.backend.schemas.user import UserRead
from app.backend.db import get_db
from app.backend.services.users import create_user

router = APIRouter(prefix="/auth", tags=["auth"])

@router.post("/register", response_model=UserRead, status_code=status.HTTP_201_CREATED)
def register_user(user: UserRegister, db: Session = Depends(get_db)):
    return create_user(db, username=user.username, email=user.email, password=user.password)

@router.post("/login", response_model=UserLogin, status_code=status.HTTP_200_OK)
def login_user(user: UserLogin, db: Session = Depends(get_db)):
    return None