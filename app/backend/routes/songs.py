from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import select, Session

from app.backend.db import get_db
from app.backend.models.models import Song, Playlist
from app.backend.schemas.song import SongRead
from backend.schemas.playlist import PlaylistRead, PlaylistCreate, PlaylistDetail, PlaylistUpdate
from backend.services.dependencies import get_current_user

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

@router.post("", response_model=PlaylistRead, status_code=status.HTTP_201_CREATED)
def create_playlist(
        playlist_in: PlaylistCreate,
        db: Session = Depends(get_db),
        current_user = Depends(get_current_user())
):
    pl = Playlist(name=playlist_in.name, user_id=current_user.id)
    db.add(pl)
    db.commit()
    db.refresh(pl)
    return pl

@router.get("/{playlist_id}", response_model=PlaylistDetail)
def get_playlist(playlist_id: int, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    pl = db.get(Playlist, playlist_id)
    if not pl or pl.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Playlist not found")
    return pl

@router.put("/{playlist_id}", response_model=PlaylistDetail)
def rename_playlist(playlist_id: int, update: PlaylistUpdate, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    pl = db.get(Playlist, playlist_id)
    if not pl or pl.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Playlist not found")
    pl.name = update.name
    db.add(pl); db.commit(); db.refresh(pl)
    return pl

@router.delete("/{playlist_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_playlist(playlist_id: int, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    pl = db.get(Playlist, playlist_id)
    if not pl or pl.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Playlist not found")
    db.delete(pl); db.commit(); db.refresh(pl)
    return

@router.post("/{playlist_id}/tracks", status_code=status.HTTP_200_OK)
def add_track_to_playlist(
        playlist_id: int,
        song_id: int,
        db: Session = Depends(get_db),
        current_user = Depends(get_current_user),
):
    pl = db.get(Playlist, playlist_id)
    if not pl or pl.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Playlist not found")
    song = db.get(Song, song_id)
    if not song:
        raise HTTPException(status_code=404, detail="Song not found")
    pl.songs.append(song)
    db.add(pl); db.commit(); db.refresh(pl)
    return {"detail": "Track added"}


