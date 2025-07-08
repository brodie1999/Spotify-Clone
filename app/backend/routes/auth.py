from http.client import HTTPException

from fastapi import APIRouter, Depends, status
from sqlmodel import Session

from app.backend.schemas.auth import UserRegister, UserLogin, Token
from app.backend.schemas.user import UserRead
from app.backend.db import get_db
from app.backend.services.users import create_user, get_user_by_username
from app.backend.services.auth import verify_password, create_access_token

router = APIRouter(prefix="/auth", tags=["auth"])

@router.post("/register", response_model=UserRead, status_code=status.HTTP_201_CREATED)
def register_user(user: UserRegister, db: Session = Depends(get_db)):
    return create_user(db, username=user.username, email=user.email, password=user.password)

@router.post("/login", response_model=Token, status_code=status.HTTP_200_OK)
def login_user(user: UserLogin, db: Session = Depends(get_db)):
    # Fetch user
    db_user = get_user_by_username(db, username=user.username)
    if not db_user or not verify_password(user.password, db_user.password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail = "Invalid username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    access_token = create_access_token(
        data={"sub": user.username},
        # expires_delta = timedelta(minutes=30) # Optional override
    )
    return {"access_token": access_token, "token_type": "bearer"}
