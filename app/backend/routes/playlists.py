from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import select, Session

from app.backend.db import get_db
from app.backend.models.models import Song, Playlist, User
from app.backend.schemas.playlist import PlaylistRead, PlaylistCreate, PlaylistUpdate, PlaylistDetail
from app.backend.services.dependencies import get_current_user

router = APIRouter(prefix="/api/playlists", tags=["Playlists"])

@router.get("", response_model=List[PlaylistRead])
def list_user_playlists( current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    try:
        stmt = select(Playlist).where(Playlist.user_id == current_user.id)
        playlists = db.exec(stmt).all()
        return playlists
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))



@router.post("", response_model=PlaylistRead, status_code=status.HTTP_201_CREATED)
def create_playlist(
        playlist_in: PlaylistCreate,
        db: Session = Depends(get_db),
        current_user = Depends(get_current_user)
):

    # Prevent the creation of another Like Songs playlist
    if playlist_in.name.lower() == "Liked Songs":
        raise HTTPException(status_code=400, detail="Cannot create another playlist called 'Liked Songs' ")

    pl = Playlist(name=playlist_in.name, user_id=current_user.id, is_liked_songs=False)
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

    # Prevent renaming Liked Songs playlist
    if pl.is_liked_songs:
        raise HTTPException(status_code=400, detail="Cannot rename to 'Liked Songs'")

    # Prevent renaming to "Liked Songs"
    if update.name.lower() == "Liked Songs":
        raise HTTPException(status_code=400, detail="Cannot rename to 'Liked Songs'")

    pl.name = update.name
    db.add(pl); db.commit(); db.refresh(pl)
    return pl

@router.delete("/{playlist_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_playlist(playlist_id: int, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    pl = db.get(Playlist, playlist_id)
    if not pl or pl.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Playlist not found")

    # Prevent the deletion of "Liked Songs"
    if pl.is_liked_songs:
        raise HTTPException(status_code=400, detail="Cannot delete 'Liked Songs'")

    db.delete(pl); db.commit();
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

@router.delete("/{playlist_id}/tracks/{song_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_track_from_playlist(
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

    if song not in pl.songs:
        raise HTTPException(status_code=404, detail="Song not found in playlist")

    pl.songs.remove(song)
    db.add(pl); db.commit(); db.refresh(pl)
    return {"detail": "Track removed"}

# Get liked songs of the user
@router.get("/special/liked-songs", response_model= PlaylistDetail)
def get_liked_songs_playlist(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    stmt = select(Playlist).where(
        Playlist.user_id == current_user.id,
        Playlist.is_liked_songs == True,
    )
    liked_playlist = db.exec(stmt).first()

    if not liked_playlist:
        # Create a liked playlist if it doesn't exist
        liked_playlist = Playlist(
            name="Liked Songs",
            user_id=current_user.id,
            is_liked_songs=True,
        )
        db.add(liked_playlist); db.commit(); db.refresh(liked_playlist)

    return liked_playlist