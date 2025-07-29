from typing import Optional

from pydantic import BaseModel

class SongBase(BaseModel):
    title: str
    artist: str
    album: str

class SongCreate(SongBase):
    pass

class SongRead(SongBase):
    id: int
    file_path: Optional[str] = None
    artwork_path: Optional[str] = None
    uploaded_by: Optional[int] = None

    # Youtube fields
    youtube_id: Optional[str] = None
    youtube_url: Optional[str] = None
    youtube_audio_url: Optional[str] = None
    thumbnail_url: Optional[str] = None
    view_count: Optional[int] = None
    channel_name: Optional[str] = None
    source: Optional[str] = None

    # Audio analysis fields
    tempo: Optional[float] = None
    musical_key: Optional[str] = None
    genre: Optional[str] = None
    mood: Optional[str] = None
    energy: Optional[float] = None
    danceability: Optional[float] = None
    duration: Optional[float] = None

    class Config:
        from_attributes = True

class AudioAnalysis(BaseModel):
    song_id: int
    tempo: Optional[float] = None
    musical_key: Optional[str] = None
    genre: Optional[str] = None
    mood: Optional[str] = None
    energy: Optional[float] = None
    danceability: Optional[float] = None
    duration: Optional[float] = None
