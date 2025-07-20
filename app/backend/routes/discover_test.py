# Add this to your discover routes or create a separate test file

import os
import logging
from fastapi import APIRouter, HTTPException, Depends
from app.backend.services.dependencies import get_current_user

logger = logging.getLogger(__name__)

# Create a simple test router
test_router = APIRouter(prefix="/api/test", tags=["Test"])


@test_router.get("/youtube-config")
async def test_youtube_config():
    """Test YouTube configuration without making API calls"""
    try:
        api_key = os.getenv("YOUTUBE_API_KEY")
        logger.info(f"YouTube API Key exists: {bool(api_key)}")

        return {
            "youtube_api_key_exists": bool(api_key),
            "youtube_api_key_length": len(api_key) if api_key else 0,
            "environment_vars": {
                key: "***" if "KEY" in key or "SECRET" in key else value
                for key, value in os.environ.items()
                if key.startswith(("YOUTUBE", "SECRET", "DATABASE"))
            }
        }
    except Exception as e:
        logger.error(f"Error in youtube config test: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@test_router.get("/simple-trending")
async def test_simple_trending(current_user=Depends(get_current_user)):
    """Test trending with minimal logic"""
    try:
        import aiohttp
        import os

        api_key = os.getenv("YOUTUBE_API_KEY")
        if not api_key:
            raise HTTPException(status_code=503, detail="YouTube API key not configured")

        logger.info("Making simple YouTube API request...")

        params = {
            "part": "snippet",
            "chart": "mostPopular",
            "videoCategoryId": "10",
            "regionCode": "US",
            "maxResults": 5,
            "key": api_key,
        }

        async with aiohttp.ClientSession() as session:
            async with session.get(
                    "https://www.googleapis.com/youtube/v3/videos",
                    params=params
            ) as response:
                if response.status == 200:
                    data = await response.json()
                    logger.info(f"YouTube API success, got {len(data.get('items', []))} items")
                    return {
                        "status": "success",
                        "items_count": len(data.get("items", [])),
                        "sample_item": data.get("items", [{}])[0].get("snippet", {}).get("title",
                                                                                         "No title") if data.get(
                            "items") else "No items"
                    }
                else:
                    error_text = await response.text()
                    logger.error(f"YouTube API error: {response.status} - {error_text}")
                    raise HTTPException(status_code=response.status, detail=f"YouTube API error: {error_text}")

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in simple trending test: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))