from pydantic import BaseModel

class Song(BaseModel):
    id : int
    title : str
    artist : str
    album : str
