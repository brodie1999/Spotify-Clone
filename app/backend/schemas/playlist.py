from typing import List
from pydantic import BaseModel
from app.backend.schemas.song import SongRead

class PlaylistBase(BaseModel):
    name: str

class PlaylistCreate(PlaylistBase):
    name: str

class PlaylistUpdate(PlaylistBase):
    name: str

class PlaylistRead(PlaylistBase):
    id : int

    class Config:
        from_attributes = True

class PlaylistDetail(PlaylistRead):
    songs: List[SongRead] 