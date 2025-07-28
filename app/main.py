import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.backend.config import settings

from app.backend.routes.auth import router as auth_router
from app.backend.routes import users, songs, playlists, discover, discover_test, liked_songs
from app.backend.db import init_db

# Configure logging
logging.basicConfig(
    level=logging.DEBUG if settings.debug else logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    logger.info(f"Starting application in {settings.environment} mode")
    try:
        init_db()
        logger.info("Database initialized successfully")
    except Exception as e:
        logger.error(f"Database initialization failed: {e}")
        raise

    yield

    # Shutdown
    logger.info("Application ended successfully")

app = FastAPI(
    title="Spotify Clone API",
    lifespan=lifespan,
)

# SETUP CORS
origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://192.168.56.1:3000",
    "http://172.29.160.1:3000",
    "http://localhost:8002",
    f"https//{settings.api_host}:{settings.api_port}",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,      # [*] - DANGEROUS, Do not want to allow for different origins
    allow_credentials=True,     # If we need to send cookie/auth headers
    allow_methods=["*"],        # GET, POST, OPTIONS, DELETE... I may change this to just GET & POST
    allow_headers=["*"],        # "Content-Type", "Authorization"
)

# Register Modules
app.include_router(auth_router)
app.include_router(users.router)
app.include_router(songs.router)
app.include_router(playlists.router)
app.include_router(liked_songs.router)
app.include_router(discover.router)
app.include_router(discover_test.test_router)


@app.get("/")
def root():
    return {"message": "Welcome to the Spotify Clone API!"}

#Add a simple debug route
@app.get("/debug/health")
def health_check():
    return {
        "status": "ok",
        "environment":settings.environment,
        "youtube_api_key_exists": bool(settings.youtube_api_key),
        "debug_mode": settings.debug,
    }