from typing import Optional, Dict
from sqlmodel import Session, select
from app.backend.models.models import Song, User
import logging

logger = logging.getLogger(__name__)

class YouTubeSongService:
    """SERVICE FOR MANAGING YOUTUBE SONGS IN THE DATABASE"""

    def __init__(self):
        pass

    def create_or_get_youtube_song(self,
                                   db: Session,
                                   youtube_track: Dict,
                                   user: User,
                                   audio_url: Optional[str] = None) -> Song:

        """Create a new YouTube Song in database or return existing one"""
        try:
            # Check if song already exists by YouTube ID
            stmt = select(Song).where(Song.youtube_id == youtube_track['youtube_id'])
            existing_song = db.exec(stmt).first()

            if existing_song:
                # Update audio URL if provided and not already set
                if audio_url and not existing_song.youtube_audio_url:
                    existing_song.youtube_audio_url = audio_url
                    db.add(existing_song)
                    db.commit()
                    db.refresh(existing_song)
                #logger.info(f"YouTube song already exists: {existing_song.song.id}")
                return existing_song

            # Create new song from YouTube track data
            new_song = Song(
                title = youtube_track['title'],
                artist = youtube_track['artist'],
                album = youtube_track.get("album", "YouTube"),
                youtube_id = youtube_track['youtube_id'],
                youtube_url = youtube_track.get('youtube_url'),
                youtube_audio_url = audio_url,
                thumbnail_url = youtube_track.get('thumbnail_url'),
                view_count = youtube_track.get('view_count', 0),
                channel_name = youtube_track.get('channel_name'),
                duration = youtube_track.get('duration', 0),
                source = "youtube",
                uploaded_by = user.id
            )

            db.add(new_song)
            db.commit()
            db.refresh(new_song)

            logger.info(f"Created new YouTube Song: {new_song.id} - {new_song.title}")
            return new_song
        except Exception as e:
            logger.error(f"Error creating YouTube song: {str(e)}")
            db.rollback()
            raise

    def get_song_by_youtube_id(self, db: Session, youtube_id: str) -> Optional[Song]:
        """Get song by YouTube ID"""
        try:
            stmt = select(Song).where(Song.youtube_id == youtube_id)
            return db.exec(stmt).first()
        except Exception as e:
            logger.error(f"Error getting YouTube song: {str(e)}")
            return None

# Global instance
youtube_song_service = YouTubeSongService()