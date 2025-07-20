import yt_dlp
import asyncio
from concurrent.futures import ThreadPoolExecutor
import tempfile
import os
from typing import Optional, Dict
import logging

from app.backend.services.youtube_service import YouTubeService

logger = logging.getLogger(__name__)

class YouTubeAudioService:
    def __init__(self):
        self.executor = ThreadPoolExecutor(max_workers=3)

    async def get_audio_url(self, youtube_id: str) -> Optional[str]:
        loop = asyncio.get_event_loop()
        return await loop.run_in_executor(
            self.executor,
            self.extract_audio_url,
            youtube_id
        )

    def extract_audio_url(self, youtube_id: str) -> Optional[str]:
        try:
            ydl_opts = {
                'format': 'bestaudio/best',
                'noplaylist': True,
                'extractaudio' : True,
                'audioformat': 'mp3',
                'quiet': True,
                'no_warnings': True,
            }

            url = f"https://www.youtube.com/watch?v={youtube_id}"

            with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                info = ydl.extract_info(url, download=False)

                # Get the best audio format
                formats = info.get('formats', [])
                audio_formats = [f for f in formats if f.get('acodec') != 'none']

                if audio_formats:
                    # Sort by quality and get the best one
                    best_audio = max(audio_formats, key=lambda x: x.get('abr', 0) or 0)
                    return best_audio.get('url')
            return None
        except Exception as e:
            logger.error(f"Failed to extract audio url for {youtube_id}: {e}")
            return None
# Global instance
youtube_audio_service = YouTubeAudioService()