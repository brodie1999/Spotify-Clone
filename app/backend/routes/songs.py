from fastapi import APIRouter, Depends, HTTPException

router = APIRouter(prefix="/api/songs", tags=["Songs"])

# Mock database

#
# def list_songs():
#     return get_song_repository().all()