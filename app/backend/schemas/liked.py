from typing import List
from pydantic import BaseModel
from app.backend.schemas.song import SongRead

LikedSongsRead = List[SongRead]