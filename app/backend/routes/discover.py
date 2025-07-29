from typing import List

from fastapi import Depends, APIRouter, HTTPException, status
from pydantic import BaseModel
from sqlmodel import Session

from app.backend.services.youtube_audio import youtube_audio_service
from app.backend.services.dependencies import get_current_user
from app.backend.services.youtube_service import youtube_service
from app.backend.services.youtube_song_service import youtube_song_service
from app.backend.models.models import User, Song, Playlist
from app.backend import get_db

router = APIRouter(prefix="/api/discover", tags=["Music Discovery"])

# Request models
class AddYouTubeTrackRequest(BaseModel):
    youtube_id: str
    title: str
    artist: str
    album: str = "YouTube"
    youtube_url: str
    description: str = ""
    youtube_audio_url: str
    thumbnail_url: str
    view_count: int = 0
    channel_name: str = ""
    duration: float = 0

class AddToPlaylistRequest(BaseModel):
    youtube_track: AddYouTubeTrackRequest
    playlist_id: int

@router.post("/youtube/add-to-playlist", status_code = status.HTTP_200_OK)
async def add_youtube_song_to_playlist(
        request: AddToPlaylistRequest,
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_user)
):
    try:
        """Add a YT track to specific playlist """
        playlist = db.get(Playlist, request.playlist_id)
        if not playlist or playlist.user_id != current_user.id:
            raise HTTPException(status_code=404, detail="Playlist not found")

        # Get audio url first
        audio_url = await youtube_audio_service.get_audio_url(request.youtube_track.youtube_id)

        # Create or get the YouTube song
        youtube_track_dict = request.youtube_track.model_dump()
        song = youtube_song_service.create_or_get_youtube_song(
            db, youtube_track_dict, current_user, audio_url
        )

        # Check if song is already in playlist
        if song in playlist.songs:
            raise HTTPException(status_code=400, detail="Song already in playlist")

        # Add song to playlist
        playlist.songs.append(song)
        db.add(playlist)
        db.commit()

        return {
            "message": f"Added '{song.title}' to playlist '{playlist.name}'",
            "song_id": song.id,
            "playlist_id": playlist.id
        }
    except HTTPException as e:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to add song to playlist {str(e)}")

@router.post("/youtube/add-to-liked", status_code = status.HTTP_200_OK)
async def add_youtube_song_to_liked(
        youtube_track: AddYouTubeTrackRequest,
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_user)
):
    """Add a YouTube song to liked songs"""
    try:

        # Get audio URL first
        audio_url = await youtube_audio_service.get_audio_url(youtube_track.youtube_id)

        # Create or get YouTube song
        youtube_track_dict = youtube_track.model_dump()
        song = youtube_song_service.create_or_get_youtube_song(
            db, youtube_track_dict, current_user, audio_url
        )

        # Check if song is already in liked songs
        if song in current_user.liked_songs:
            raise HTTPException(status_code=400, detail="Song already in liked")

        # Add song to liked songs
        current_user.liked_songs.append(song)
        db.add(current_user)
        db.commit()

        return {
            "message": f"Added '{song.title}' to liked songs",
            "song_id": song.id,
        }

    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to add song to liked {str(e)}")

@router.get("/youtube/search", response_model=List[dict])
async def search_youtube_music(
        query: str,
        limit: int = 24,
        current_user = Depends(get_current_user)
) :
    """SEARCH YOUTUBE MUSIC"""
    try:
        results = await youtube_service.search_music(query.strip(), limit)
        return results
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Youtube search failed: {str(e)}")

@router.get("/youtube/trending")
async def get_trending_music(
        region: str = "US",
        current_user = Depends(get_current_user)
) :
    try:
        trending = await youtube_service.get_trending_music(region)
        print(f"Trending music data: {trending}")
        return trending
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get trending: {str(e)}")

@router.get("/youtube/audio/{youtube_id}")
async def get_youtube_audio_url(
        youtube_id: str,
        current_user = Depends(get_current_user)
) :
    try:
        audio_url = await youtube_audio_service.get_audio_url(youtube_id)
        if audio_url:
            return {"audio_url" : audio_url}
        else:
            raise HTTPException(status_code=404, detail="Audio stream not found")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get audio from: {str(e)}")



@router.get("/debug")
async def debug_youtube():
    import os
    return {
        "youtube_api_key_exists": bool(os.getenv("YOUTUBE_API_KEY")),
        "youtube_api_key_length": len(os.getenv("YOUTUBE_API_KEY", "")),
        "aiohttp_available": True,
    }