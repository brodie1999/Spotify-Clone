import logging
from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlmodel import Session
import os

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


from app.backend.routes.auth import router as auth_router
from app.backend.routes import auth, users, songs, playlists, discover_test
from app.backend.db import init_db, get_db
from app.backend.routes import liked_songs
from app.backend.routes import discover


app = FastAPI(title="Spotify Clone API")

# SETUP CORS
origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://192.168.56.1:3000",
    "http://172.29.160.1:3000",
    "http://localhost:8002",
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


@app.on_event("startup")
def on_startup():
    logger.info("Starting up Application")
    try:
        init_db()
        logger.info("Database initialized successfully")
    except Exception as e:
        logger.error(f"Failed to initialize database: {e}")
@app.get("/")
def root():
    return {"message": "Welcome to the Spotify Clone API!"}

#Add a simple debug route
@app.get("/debug/health")
def health_check():
    import os
    return {
        "status": "ok",
        "youtube_api_key_exists": bool(os.getenv("YOUTUBE_API_KEY")),
        "environment_loaded": True
    }