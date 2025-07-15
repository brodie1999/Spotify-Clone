from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import select, Session

from app.backend.db import get_db
from app.backend.models.models import Song
from app.backend.schemas.song import SongRead

router = APIRouter(prefix="/api/songs", tags=["Songs"])

@router.get("", response_model=List[SongRead])
def list_songs(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return db.exec(select(Song).offset(skip).limit(limit)).all()

@router.get("/{song_id}", response_model=SongRead)
def get_song(song_id: int, db: Session = Depends(get_db)):
    song = db.get(Song, song_id)
    if not song:
        raise HTTPException(status_code=404, detail="Song not found")
    return song

