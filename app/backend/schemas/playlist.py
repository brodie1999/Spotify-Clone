from typing import List
from pydantic import BaseModel
from app.backend.schemas.song import SongRead

class PlaylistBase(BaseModel):
    name: str

class PlaylistCreate(PlaylistBase):
    name: str
    songs: List[SongRead]

class PlaylistUpdate(PlaylistBase):
    name: str

class PlaylistRead(PlaylistBase):
    id : int

    class Config:
        orm_mode = True

class PlaylistDetail(PlaylistRead):
    songs: List[SongRead] 