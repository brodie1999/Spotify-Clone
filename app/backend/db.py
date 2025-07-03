from typing import List
from app.backend.models.song import Song

songs = [
    Song(id=1, title="Little Black Submarines", artist="The Black Keys", album="El Camino"),
    Song(id=2, title="Zephyer Song", artist="Red Hot Chilli Peppers", album="By The Way")
]

class SongRepository:
    def all(self) -> List[Song]:
        return songs

def get_song_repository() -> SongRepository:
    return SongRepository()