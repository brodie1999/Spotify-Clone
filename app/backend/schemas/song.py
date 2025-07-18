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
    tempo: Optional[float] = None
    musical_key: Optional[str] = None
    genre: Optional[str] = None
    mood: Optional[str] = None
    energy: Optional[float] = None
    danceability: Optional[float] = None
    duration: Optional[float] = None

    class Config:
        orm_mode = True

class AudioAnalysis(BaseModel):
    song_id: int
    tempo: Optional[float] = None
    musical_key: Optional[str] = None
    genre: Optional[str] = None
    mood: Optional[str] = None
    energy: Optional[float] = None
    danceability: Optional[float] = None
    duration: Optional[float] = None
