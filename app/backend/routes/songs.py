from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.declarative import declarative_base

router = APIRouter(prefix="/api/songs", tags=["Songs"])

# Mock database


def list_songs():
    return get_song_repository().all()