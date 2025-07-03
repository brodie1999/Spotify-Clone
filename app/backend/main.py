from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.backend.routes import auth, users, songs, playlists

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
app.include_router(auth.router)
app.include_router(users.router)
app.include_router(songs.router)
app.include_router(playlists.router)

@app.get("/")
def root():
    return {"message": "Welcome to the Spotify Clone API!"}