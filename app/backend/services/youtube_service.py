import aiohttp
import os
from typing import Dict, List, Optional
import logging
import re

logger = logging.getLogger(__name__)

class YouTubeService:
    def __init__(self):
        self.api_key = "AIzaSyA3PtWdS2x1Mv7CVDE5TJPGI9uUVkFIPJA"
        self.base_url = "https://www.googleapis.com/youtube/v3"

    async def search_music(self, query: str, max_results: int=20) -> List[Dict]:
        """Search for music videos on YouTube"""
        if not self.api_key:
            raise ValueError("YouTube API key not set/configured")

        # Add "music" to query for better music results
        search_query = f"{query} music"

        params = {
            "part" : "snippet",
            "q" : search_query,
            "type" : "video",
            "videoCategoryId" : "10", # Music category
            "maxResults" : max_results,
            "key" : self.api_key,
            "order" : "relevance"
        }
        async with aiohttp.ClientSession() as session:
            async with session.get(f"{self.base_url}/search", params=params) as response:
                if response.status == 200:
                    data = await response.json()
                    video_ids = [item["id"]["videoId"] for item in data["items"]]
                    return await self.get_video_details(video_ids)
                else:
                    error_text = await response.text()
                    logger.error(f"YouTube search failed: {response.status} - {error_text}")
                    raise Exception(f"YouTube search failed: {response.status}")


    async def get_video_details(self, video_ids: List[str]) -> List[Dict]:
        params = {
            "part" : "snippet,contentDetails,statistics",
            "id" : ",".join(video_ids),
            "key" : self.api_key,
        }

        async with aiohttp.ClientSession() as session:
            async with session.get(f"{self.base_url}/videos", params=params) as response:
                if response.status == 200:
                    data = await response.json()
                    return self.format_videos(data["items"])
                else:
                    return []

    async def get_trending_music(self, region_code: str = "US") -> List[Dict]:
        """GET TRENDING MUSIC VIDEOS"""
        print(f"API KEY EXISTS: {bool(self.api_key)}")
        print(f"API KEY FOUND: {len(self.api_key) if self.api_key else 0}")
        params = {
            "part" : "snippet,contentDetails,statistics",
            "chart" : "mostPopular",
            "videoCategoryId" : "10",
            "regionCode" : region_code,
            "maxResults" : 20,
            "key" : self.api_key,
        }

        print(f"Request URL: {self.base_url}/videos")
        print(f"Request params: {params}")

        async with aiohttp.ClientSession() as session:
            async with session.get(f"{self.base_url}/videos", params=params) as response:
                print(f"Response status: {response.status}")
                if response.status == 200:
                    data = await response.json()
                    return self.format_videos(data["items"])
                else:
                    return []

    def format_videos(self, videos: List[Dict]) -> List[Dict]:
        formatted_videos = []

        for video in videos:
            title_parts = self.parse_title(video["snippet"]["title"])

            formatted_video = {
                "youtube_id" : video["id"],
                "title" : title_parts["title"],
                "artist" : title_parts["artist"],
                "album" : "Youtube", # YT doesn't have album info
                "duration" : self.parse_duration(video["contentDetails"]["duration"]),
                "youtube_url": f"https://www.youtube.com/watch?v={video['id']}",
                "thumbnail_url" : self.get_best_thumbnail(video["snippet"]["thumbnails"]),
                "view_count" : int(video["statistics"].get("viewCount", 0)),
                "channel_name": video["snippet"]["channelTitle"],
                "description" : video["snippet"]["description"][:200] + "..." if len(video["snippet"]["description"]) > 200 else video["snippet"]["description"],
            }

            formatted_videos.append(formatted_video)
        return formatted_videos

    def parse_title(self, title:str) -> Dict[str, str]:

        """Parse YouTube title to exact artist and song name"""
        # Common patterns for music videos
        patterns = [
            r"^(.+?)\s*[-–—]\s*(.+?)(?:\s*\(.*\))?$",  # Artist - Title
            r"^(.+?)\s*:\s*(.+?)(?:\s*\(.*\))?$",  # Artist: Title
            r"^(.+?)\s+by\s+(.+?)(?:\s*\(.*\))?$",  # Title by Artist
        ]

        for pattern in patterns:
            match = re.match(pattern, title, re.IGNORECASE)
            if match:
                return {
                    "artist" : match.group(1).strip(),
                    "title" : match.group(2).strip(),
                }
        return {
            "artist" : "Unknown Artist",
            "title" : title,
        }

    def parse_duration(self, duration_str: str) -> float:
        """Parse ISO 8601 duration into seconds"""
        # PT4M13S -> 253 Seconds
        pattern = r'PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?'
        match = re.match(pattern, duration_str)

        if not match:
            return 0.0

        hours = int(match.group(1) or 0)
        minutes = int(match.group(2) or 0)
        seconds = int(match.group(3) or 0)

        return hours * 3600 + minutes * 60 + seconds

    def get_best_thumbnail(self, thumbnails: Dict) -> str:
        for quality in ["maxresdefault", "hqdefault", "mqdefault", "default"]:
            if quality in thumbnails:
                return thumbnails[quality]["url"]

        return thumbnails.get("default", {}).get("url", "")

# Global instance
youtube_service = YouTubeService()

