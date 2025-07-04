from pydantic import BaseModel
from sqlalchemy.orm import declarative_base

Base = declarative_base()

class Song(BaseModel):
    id : int
    title : str
    artist : str
    album : str
