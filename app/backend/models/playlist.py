from typing import List
from pydantic import BaseModel
from sqlalchemy.ext.declarative import declarative_base

from app.backend.models.song import Song

Base = declarative_base()

class Playlist(BaseModel):
    id : int
    name : str
    user_id : int
    songs : List[Song] = []