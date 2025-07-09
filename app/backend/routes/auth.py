
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlmodel import Session

from app.backend.schemas.auth import UserRegister, UserLogin, Token
from app.backend.schemas.user import UserRead

from app.backend.db import get_db
from app.backend.services.dependencies import get_current_user
from app.backend.services.users import create_user, get_user_by_username
from app.backend.services.auth import verify_password, create_access_token

router = APIRouter(prefix="/auth", tags=["auth"])

@router.post("/register", response_model=UserRead, status_code=status.HTTP_201_CREATED)
def register_user(user: UserRegister, db: Session = Depends(get_db)):
    return create_user(db, username=user.username, email=user.email, password=user.password)

@router.post("/login", response_model=Token, status_code=status.HTTP_200_OK)
def login_user(db: Session = Depends(get_db), form_data: OAuth2PasswordRequestForm = Depends()):
    # Fetch user
    form_user = get_user_by_username(db, form_data.username)
    if not form_user or not verify_password(form_data.password, form_user.password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail = "Invalid username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    access_token = create_access_token(
        data={"sub": form_user.username},
        # expires_delta = timedelta(minutes=30) # Optional override
    )
    return {"access_token": access_token, "token_type": "bearer"}

@router.get("/users/me", response_model=UserRead)
def read_current_user(current_user = Depends(get_current_user)):
    return current_user
