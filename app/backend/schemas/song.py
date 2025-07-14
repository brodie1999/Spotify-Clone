from pydantic import BaseModel

class SongBase(BaseModel):
    title: str
    artist: str
    album: str

class SongCreate(SongBase):
    pass

class SongRead(SongBase):
    id: int

    class Config:
        orm_mode = True

