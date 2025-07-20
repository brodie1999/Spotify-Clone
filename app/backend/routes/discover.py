from typing import List

from fastapi import Depends, APIRouter, HTTPException

from app.backend.services.youtube_audio import youtube_audio_service
from app.backend.services.dependencies import get_current_user
from app.backend.services.youtube_service import youtube_service

router = APIRouter(prefix="/api/discover", tags=["Music Discovery"])

@router.get("/youtube/search", response_model=List[dict])
async def search_youtube_music(
        query: str,
        limit: int = 20,
        current_user = Depends(get_current_user)
) :
    """SEARCH YOUTUBE MUSIC"""
    try:
        results = await youtube_service.search_music(query.strip(), limit)
        return {
            "results": results,
            "source" : "youtube",
            "total": len(results),
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Youtube search failed: {str(e)}")

@router.get("/youtube/trending")
async def get_trending_music(
        region: str = "US",
        current_user = Depends(get_current_user)
) :
    try:
        trending = await youtube_service.get_trending_music(region)
        print(f"Trending music data: {trending}")
        return trending
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get trending: {str(e)}")

@router.get("/youtube/audio/{youtube_id}")
async def get_youtube_audio_url(
        youtube_id: str,
        current_user = Depends(get_current_user)
) :
    try:
        audio_url = await youtube_audio_service.get_audio_url(youtube_id)
        if audio_url:
            return {"audio_url" : audio_url}
        else:
            raise HTTPException(status_code=404, detail="Audio stream not found")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get audio from: {str(e)}")

@router.get("/debug")
async def debug_youtube():
    import os
    return {
        "youtube_api_key_exists": bool(os.getenv("YOUTUBE_API_KEY")),
        "youtube_api_key_length": len(os.getenv("YOUTUBE_API_KEY", "")),
        "aiohttp_available": True,
    }