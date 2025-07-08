from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlmodel import Session

from app.backend.routes.auth import router as auth_router
from app.backend.routes import auth, users, songs, playlists
from app.backend.db import init_db, get_db

app = FastAPI(title="Spotify Clone API")

# SETUP CORS
origins = [
    "http://localhost:3000",
    # Production URLs go here later on.
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register Modules
app.include_router(auth_router)
app.include_router(users.router)
app.include_router(songs.router)
app.include_router(playlists.router)


@app.on_event("startup")
def on_startup():
    init_db()

@app.get("/")
def root():
    return {"message": "Welcome to the Spotify Clone API!"}