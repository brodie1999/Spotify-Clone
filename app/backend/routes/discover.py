from http.client import HTTPException
from typing import List

from fastapi import Depends

from app.backend.services.youtube_service import youtube_service
from app.backend.services.youtube_audio import youtube_audio_service
from backend.routes.auth import router
from backend.services.dependencies import get_current_user


@router.get("/youtube/search", response_model=List[dict])
async def search_youtube_music(
        query: str,
        limit: int = 20,
        current_user = Depends(get_current_user)
) :
    """SEARCH YOUTUBE MUSIC"""
    try:
        results = await youtube_service.search_music(query, limit)
        return {
            "results": results,
            "source" : "youtube",
            "total": len(results),
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Youtube search failed: {str(e)}")

@router.get("/youtube/trending")
async def get_trending_music(
        current_user = Depends(get_current_user)
) :
    try:
        trending = await youtube_service.trending_music()
        return trending
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get trending music: {str(e)}")

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
