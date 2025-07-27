
#from app.backend.models.song import Song
from sqlmodel import create_engine, Session, SQLModel
from app.backend.config import settings
import logging

logger = logging.getLogger(__name__)

# Database credentials
DATABASE_URL = settings.database_url

# Create async engine
engine = create_engine(
    DATABASE_URL,
    echo=settings.debug,
    pool_pre_ping=True,  # Validate connections
    pool_recycle=300,    # Recycle connections every 5 mins
)


def init_db():
    """INITIALISE DATABASE TABLES"""
    try:
        SQLModel.metadata.create_all(engine)
        logger.info(f"Database initialized successfully")
    except Exception as e:
        logger.error(f"Database initialization failed: {e}")
        raise

# Dependency to get DB session
def get_db():
    with Session(engine) as session:
        yield session

