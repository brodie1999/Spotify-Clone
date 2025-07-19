import os
import re
import shutil
import token
from io import BytesIO
from pathlib import Path

from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, BackgroundTasks, Form, Request
from fastapi.responses import FileResponse, StreamingResponse
import aiofiles
from PIL import Image
from sqlmodel import select, Session

from app.backend.db import get_db
from app.backend.models.models import Song, User
from app.backend.schemas.song import SongRead
from app.backend.services.dependencies import get_current_user

from app.backend.services.audio_processing import audio_service, logger

# Upload configuration
UPLOAD_DIR = Path("uploads/audio")
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

IMAGE_DIR = Path("uploads/images")
IMAGE_DIR.mkdir(parents=True, exist_ok=True)

ALLOWED_IMAGE_EXTENSIONS = {".png", ".jpg", ".jpeg", ".gif", ".webp"}
MAX_IMAGE_SIZE = 10 * 1024 * 1024 # 10 MB MAY INCREASE THIS!

ALLOWED_EXTENSIONS = {".mp3", ".wav", ".flac", ".m4a", ".ogg", ".mp4", ".aac"}
MAX_FILE_SIZE = 50 * 1024 * 1024 # 50MB

router = APIRouter(prefix="/api/songs", tags=["Songs"])


@router.get("/{song_id}/stream")
async def stream_audio(song_id: int, request: Request, db: Session = Depends(get_db)):
    """Stream audio file with support for range requests (seeking)"""

    song = db.get(Song, song_id)
    if not song or not song.file_path:
        raise HTTPException(status_code=404, detail="Song/Audio not found")

    file_path = Path(song.file_path)
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="Audio file not found on disk")

    # Get file info
    file_size = file_path.stat().st_size

    # Handle range requests for audio seeking
    range_header = request.headers.get("Range")
    # Parse range header (e.g., "bytes=0-1023)
    range_match = re.match(r"bytes=(\d+)-(\d*)", range_header)
    if range_match:
        start = int(range_match.group(1))
        end = int(range_match.group(2)) if range_match.group(2) else file_size - 1

        if start > file_size:
            raise HTTPException(status_code=400, detail="Range out of range")

        end = min(end, file_size - 1)
        content_length = end - start + 1

        def iter_file():
            with open(file_path, "rb") as f:
                f.seek(start)
                remaining = content_length
                chunk_size = 8192
                while remaining:
                    chunk = f.read(min(chunk_size, remaining))
                    if not chunk:
                        break
                    remaining -= len(chunk)
                    yield chunk
        headers ={
            "Content-Range": f"bytes {start}-{end}/{file_size}",
            "Accept-Ranges": "bytes",
            "Content-Length": str(content_length),
            "Content-Type": get_audio_mime_type(file_path.suffix)
        }

        return StreamingResponse(iter_file(), status_code=200, headers=headers)

    def iter_file():
        with open(file_path, "rb") as f:
            chunk_size = 8192
            while chunk := f.read(chunk_size):
                yield chunk
    headers = {
        "Accept-Ranges": "bytes",
        "Content-Length": str(file_size),
        "Content-Type": get_audio_mime_type(file_path.suffix)
    }

    return StreamingResponse(iter_file(), headers=headers)

def get_audio_mime_type(extension: str) -> str:
    """Get appropriate MIME type for audio files"""
    mime_types = {
        '.mp3': 'audio/mpeg',
        '.wav': 'audio/wav',
        '.flac': 'audio/flac',
        '.m4a': 'audio/mp4',
        '.ogg': 'audio/ogg',
        '.mp4': 'audio/mp4',
        '.aac': 'audio/aac'
    }
    return mime_types.get(extension.lower(), "audio/mpeg")

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
    unique_filename = f"{uuid.uuid4()}{file_extension}"
    file_path = UPLOAD_DIR / unique_filename

    # Save file
    async with aiofiles.open(file_path, "wb") as f:
        await f.write(contents)

    # Handle artwork upload
    artwork_path = None
    if artwork and artwork.filename:
        artwork_extension = Path(artwork.filename).suffix.lower()
        if artwork_extension not in ALLOWED_IMAGE_EXTENSIONS:
            if file_path.exists():
                file_path.unlink()
            raise HTTPException(status_code=400, detail=f"Unsupported image type. Allowed {', '.join(ALLOWED_IMAGE_EXTENSIONS)}")

        artwork_contents = await artwork.read()
        if len(artwork_contents) > MAX_IMAGE_SIZE:
            if file_path.exists():
                file_path.unlink()
            raise HTTPException(status_code=400, detail="Image too large (max 10mb)")

        # Save and resize artwork
        artwork_filename = f"{uuid.uuid4()}{artwork_extension}"
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
    duration = 0
    if not title or not artist or not album:
        try:
            metadata = audio_service.extract_metadata(str(file_path))
            title = title or metadata.get('title', Path(file.filename).stem)
            artist = artist or metadata.get('artist', 'Unknown Artist')
            album = album or metadata.get('album', 'Unknown Album')
            duration = metadata.get('duration', 0)
        except Exception as e:
            logger.warning(f"Could not extract metadata: {e}")
            title = title or Path(file.filename).stem
            artist = artist or 'Unknown Artist'
            album = album or 'Unknown Album'

    # Create song record
    song = Song(
        title=title,
        artist=artist,
        album=album,
        file_path=str(file_path),
        uploaded_by=current_user.id,
        artwork_path=str(artwork_path) if artwork_path else None,
        duration=duration,
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
                if not song.duration:
                    song.duration = features.get('duration')

                db.add(song)
                db.commit()

                logger.info(f"Analysis result for {song_id}: {str(analysis_result)}")
            else:
                logger.error(f"Audio analysis failed for song {song_id}: {str(analysis_result)}")
    except Exception as e:
        logger.error(f"Error in background audio processing for song {song_id}: {str(e)}")


@router.get("/{song_id}/analysis", response_model=dict)
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

    return FileResponse(song.artwork_path, media_type='image/jpeg')

@router.get("", response_model=List[SongRead])
def list_songs(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return db.exec(select(Song).offset(skip).limit(limit)).all()

@router.get("/{song_id}", response_model=SongRead)
def get_song(song_id: int, db: Session = Depends(get_db)):
    song = db.get(Song, song_id)
    if not song:
        raise HTTPException(status_code=404, detail="Song not found")
    return song

