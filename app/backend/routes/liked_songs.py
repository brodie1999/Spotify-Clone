from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session

from app.backend.db import get_db
from app.backend.services.dependencies import get_current_user
from app.backend.models.models import User, Song
from app.backend.schemas.liked import LikedSongsRead

router = APIRouter(prefix="/me/liked", tags=["liked Songs"])

@router.get("/", response_model=LikedSongsRead)
def get_liked_songs(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return current_user.liked_songs

@router.post("/{song_id}", status_code=status.HTTP_200_OK)
def liked_song(song_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    song = db.get(Song, song_id)
    if not song:
        raise HTTPException(status_code=404, detail="Song not found")
    if song in current_user.liked_songs:
        raise HTTPException(status_code=400, detail="Song already liked")
    current_user.liked_songs.append(song)
    db.add(current_user); db.commit()
    return {"detail": "Song liked"}

@router.delete("/{song_id}", status_code=status.HTTP_204_NO_CONTENT)
def unlike_song(song_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    song = db.get(Song, song_id)
    if not song or song not in current_user.liked_songs:
        raise HTTPException(status_code=404, detail="Song not found in likes!")
    current_user.liked_songs.remove(song)
    db.add(current_user); db.commit()
    return