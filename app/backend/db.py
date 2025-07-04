
#from app.backend.models.song import Song
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker, declarative_base

# Database credentials
DATABASE_URL = "postgresql+asyncpg://postgres:Potter55@localhost:5432/spotify_clone"

# Create async engine
engine = create_async_engine(DATABASE_URL, echo=True)

# Configure session maker
AsyncSessionLocal = sessionmaker(
    bind=engine,
    class_= AsyncSession,
    expire_on_commit = False,
)

# Base class for models
Base = declarative_base()

# Dependency to get DB session
async def get_df():
    async with AsyncSessionLocal() as session:
        yield session

# songs = [
#     Song(id=1, title="Little Black Submarines", artist="The Black Keys", album="El Camino"),
#     Song(id=2, title="Zephyer Song", artist="Red Hot Chilli Peppers", album="By The Way")
# ]
#
# class SongRepository:
#     def all(self) -> List[Song]:
#         return songs
#
# def get_song_repository() -> SongRepository:
#     return SongRepository()