
#from app.backend.models.song import Song
from sqlmodel import create_engine, Session, SQLModel

# Database credentials
DATABASE_URL = "postgresql://postgres:Potter55@localhost:5432/spotify_clone"

# Create async engine
engine = create_engine(DATABASE_URL, echo=True)


def init_db():
    SQLModel.metadata.create_all(engine)

# Dependency to get DB session
def get_db():
    with Session(engine) as session:
        yield session

