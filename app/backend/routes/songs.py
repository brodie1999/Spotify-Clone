import os
import shutil
from io import BytesIO
from pathlib import Path

from typing import List, Optional

from django.http import FileResponse
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, BackgroundTasks, Form
import aiofiles
from PIL import Image
from sqlmodel import select, Session

from app.backend.db import get_db
from app.backend.models.models import Song, User
from app.backend.schemas.song import SongRead
from app.backend.services.dependencies import get_current_user

from app.backend.services.audio_processing import audio_service, logger
from app.backend.routes.auth import router

# Upload configuration
UPLOAD_DIR = Path("uploads/audio")
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

IMAGE_DIR = Path("uploads/images")
IMAGE_DIR.mkdir(parents=True, exist_ok=True)

ALLOWED_IMAGE_EXTENSIONS = {"png", "jpg", "jpeg", "gif", ".webp"}
MAX_IMAGE_SIZE = 10 * 1024 * 1024 # 10 MB MAY INCREASE THIS!

ALLOWED_EXTENSIONS = {"mp3", "wav", ".flac", ".m4a", ".ogg", ".mp4"}
MAX_FILE_SIZE = 50 * 1024 * 1024 # 50MB

router = APIRouter(prefix="/api/songs", tags=["Songs"])

@router.post("/upload", response_model=SongRead)
async def upload_audio_file(
        background_tasks: BackgroundTasks,
        file: UploadFile = File(...), # Audio file
        artwork: Optional[UploadFile] = File(None),
        title: Optional[str] = Form(None),
        artist: Optional[str] = Form(None),
        album: Optional[str] = Form(None),
        current_user: User = Depends(get_current_user),
        db: Session = Depends(get_db),
) :
    # Validate the file
    if not file.filename:
        raise HTTPException(status_code=400, detail="No filename provided")

    file_extension = Path(file.filename).suffix.lower()
    if file_extension not in ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=400, detail=f"Unsupported file type. Allowed: {', '.join(ALLOWED_EXTENSIONS)}")

    # Check file size
    contents = await file.read()
    if len(contents) > MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail="File too large (max 50mb)")

    # Generate unique filename
    import uuid
    unqiue_filename = f"{uuid.uuid4()}.{file_extension}"
    file_path = UPLOAD_DIR / unqiue_filename

    # Save file
    async with aiofiles.open(file_path, "wb") as f:
        await f.write(contents)

    # Handle artwork upload
    artwork_path = None
    if artwork and artwork.filename:
        artwork_extension = Path(artwork.filename).suffix.lower()
        if artwork_extension not in ALLOWED_IMAGE_EXTENSIONS:
            raise HTTPException(status_code=400, detail=f"Unsupported image type. Allowed {', '.join(ALLOWED_IMAGE_EXTENSIONS)}")

        artwork_contents = await artwork.read()
        if len(artwork_contents) > MAX_IMAGE_SIZE:
            raise HTTPException(status_code=400, detail="Image too large (max 10mb)")

        # Save and resize artwork
        artwork_filename = f"{uuid.uuid4()}.{artwork_extension}"
        artwork_path = IMAGE_DIR / artwork_filename

        # Resize to standard size (500X500)
        try:
            image = Image.open(BytesIO(artwork_contents))
            image = image.convert("RGB")
            image = image.resize((500, 500), Image.Resampling.LANCZOS)
            image.save(artwork_path, 'JPEG', quality=85)
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Invalid image file: {str(e)}")

    # Extract metadata from audio file if no manual data provided
    if not title or not artist or not album:
        metadata = audio_service.extract_metadata(str(file_path))
        title = title or metadata.get('title', Path(file_path.name).stem)
        artist = artist or metadata.get('artist', 'Unknown Artist')
        album = album or metadata.get('album', 'Unknown Album')
        duration = metadata.get('duration', 0)


    # Create song record
    song = Song(
        title = title,
        artist = artist,
        album = album,
        file_path = str(file_path),
        uploaded_by = current_user.id,
        duration = duration,
    )

    db.add(song)
    db.commit()
    db.refresh(song)

    # Process audio in background
    background_tasks.add_task(process_audio_analysis, song.id, str(file_path), db)

    return song

async def process_audio_analysis(song_id: int, file_path: str, db: Session):
    """Background task to analyze audio and update database"""
    try:
        # Perform audio analysis
        analysis_result = await audio_service.analyze_audio_async(file_path)

        if analysis_result['success']:
            features = analysis_result['features']

            # Update song with analysis results
            song = db.get(Song, song_id)

            if song:
                song.tempo = features.get('tempo')
                song.musical_key = features.get('musical_key')
                song.genre = features.get('genre')
                song.mood = features.get('mood')
                song.energy = features.get('energy')
                song.danceability = features.get('danceability')
                song.duration = features.get('duration')

                db.add(song)
                db.commit()

                logger.info(f"Analysis result for {song_id}: {str(analysis_result)}")
            else:
                logger.error(f"Audio analysis failed for song {song_id}: {str(analysis_result)}")
    except Exception as e:
        logger.error(f"Error in background audio processing for song {song_id}: {str(e)}")


@router.get("/{song_id/analysis", response_model=dict)
def get_song_analysis(song_id: int, db: Session = Depends(get_db)):
    """Get audio analysis for a specific song"""
    song = db.get(Song, song_id)
    if not song: raise HTTPException(status_code=404, detail="Song not found")

    return {
        "song_id": song.id,
        "tempo": song.tempo,
        "musical_key": song.musical_key,
        "genre": song.genre,
        "mood": song.mood,
        "energy": song.energy,
        "danceability": song.danceability,
        "duration": song.duration,
    }


@router.get("/{song_id}/artwork")
async def get_song_artwork(song_id: int, db: Session = Depends(get_db)):
    song = db.get(Song, song_id)
    if not song or not song.artwork_path:
        raise HTTPException(status_code=404, detail="Artwork not found")

    if not os.path.exists(song.artwork_path):
        raise HTTPException(status_code=404, detail="Artwork file not found")

    return FileResponse(song.song.artwork_path, media_type='image/jpeg')

@router.get("", response_model=List[SongRead])
def list_songs(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return db.exec(select(Song).offset(skip).limit(limit)).all()

@router.get("/{song_id}", response_model=SongRead)
def get_song(song_id: int, db: Session = Depends(get_db)):
    song = db.get(Song, song_id)
    if not song:
        raise HTTPException(status_code=404, detail="Song not found")
    return song

