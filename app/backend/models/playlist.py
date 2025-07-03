from typing import List
from pydantic import BaseModel
from app.backend.models.song import Song

class Playlist(BaseModel):
    id : int
    name : str
    user_id : int
    songs : List[Song] = []