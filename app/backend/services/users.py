from pydantic import EmailStr
from sqlmodel import Session, select
from fastapi import HTTPException

from app.backend.models.models import User, Playlist
from app.backend.services.auth import hashing_password

def get_user_by_username(db: Session, username: str):
    statement = select(User).where(User.username == username)
    return db.exec(statement).first()

def get_user_by_email(db: Session, email: EmailStr):
    statement = select(User).where(User.email == email)
    return db.exec(statement).first()

def create_user(db: Session, username: str, email: EmailStr, password: str):
    # Ensure uniqueness at service level
    if get_user_by_username(db, username) or get_user_by_email(db, email):
        raise HTTPException(status_code=400, detail="Email already registered")

    hashed = hashing_password(password)
    user = User(username=username, email=email, password=hashed)
    db.add(user)
    db.commit()
    db.refresh(user)

    # create liked songs for the user
    liked_songs_playlist = Playlist(
        name="liked Songs",
        user_id=user.id,
        is_liked_songs=True,
    )

    db.add(liked_songs_playlist)
    db.commit()
    db.refresh(liked_songs_playlist)
    return user
