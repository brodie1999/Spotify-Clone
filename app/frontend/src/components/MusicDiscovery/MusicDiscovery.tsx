// @ts-ignore
import React,  { useState, useEffect } from "react";
import { useMusicPlayer } from "../../contexts/MusicPlayerContext";
import {Song} from "../../api";

interface YouTubeTrack {
    youtube_id: string;
    title: string;
    artist: string;
    album: string;
    duration: number;
    youtube_url: string;
    thumbnail_url: string;
    view_count: number;
    channel_name: string;
}

export default function MusicDiscovery() {
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState<YouTubeTrack[]>([]);
    const [trendingMusic, setTrendingMusic] = useState<YouTubeTrack[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const { playSong } = useMusicPlayer()

    useEffect(() => {
        loadTrendingMusic();
    }, []);

    const loadTrendingMusic = async () => {
        try {
            const response = await fetch('http://localhost:8002/api/discover/youtube/trending', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                }
            });

            if (response.ok) {
                const trending = await response.json();
                setTrendingMusic(trending);
            }
        } catch (error) {
            console.error("Failed to load trending music: ", error);
        }
    };

    const handleSearch = async () => {
        if (!searchQuery.trim()) return;

        setIsLoading(true);
        try {
            const response  = await fetch(`/api/discover/youtube/search?query=${encodeURIComponent(searchQuery)}&limit=20`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                }
            });

            if (response.ok) {
                const data = await response.json();
                setSearchResults(data);
            }
        } catch (error) {
            console.error("Failed to load search result: ", error);
        } finally {
            setIsLoading(false);
        }
    };

    const playYoutubeTrack = async (track: YouTubeTrack) => {
        try {
            // Get the audio stream URL
            const response = await fetch(`/api/discover/youtube/audio/${track.youtube_id}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                }
            });

            if (response.ok) {
                const { audio_url } = await response.json();

                //convert to our song format
                const song: Song = {
                    id: Date.now(),
                    title: track.title,
                    artist: track.artist,
                    album: track.album,
                    duration: track.duration,
                    artwork_path: track.thumbnail_url,
                    youtube_audio_url: audio_url,
                    youtube_id: track.youtube_id,
                    source: 'youtube'
                };

                playSong(song);
            } else {
                // Fallback: open in Youtube
                window.open(track.youtube_url, '_blank');
            }
        } catch (error) {
            console.error("Failed to play track: ", error);
            window.open(track.youtube_url, '_blank');
        }
    };

    // Rest of your component with updated UI for YouTube tracks
    return (
        <div style={{ padding: '2rem', backgroundColor: '#121212', color: '#FFFFFF', minHeight: '100vh' }}>
            {/* Search and trending music UI */}
            {searchResults.map((track) => (
                <div key={track.youtube_id} style={{/* your styling */}}>
                    {/* Track info */}
                    <button
                        onClick={() => playYoutubeTrack(track)}
                        style={{
                            padding: '0.5rem 1rem',
                            backgroundColor: '#FF0000', // YouTube red
                            border: 'none',
                            borderRadius: '20px',
                            color: '#FFFFFF',
                            cursor: 'pointer'
                        }}
                    >
                        ▶ Play
                    </button>
                </div>
            ))}
        </div>
    );

}