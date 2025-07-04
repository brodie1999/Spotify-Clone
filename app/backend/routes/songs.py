from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.declarative import declarative_base

#from app.backend.db import get_song_repository # Repo layer


router = APIRouter(prefix="/api/songs", tags=["Songs"])

# Mock database


def list_songs():
    return get_song_repository().all()