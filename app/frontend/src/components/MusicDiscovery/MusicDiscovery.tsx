// @ts-ignore
import React, {useState, useEffect, ReactNode} from "react";
import { useMusicPlayer } from "../../contexts/MusicPlayerContext";
import { getProfile, Playlist, getPlaylists } from "../../api";
import {useNavigate} from "react-router-dom";

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
    repeatMode: 'off' | 'one' | 'all';
    toggleRepeat: () => void;
}

interface Song {
    id: number;
    title: string;
    artist: string;
    album: string;
    artwork_url?: string;
    duration?: number;
    preview_url?: string;
    youtube_audio_url?: string;
    youtube_id?: string;
    source?: 'local' | 'spotify' | 'youtube';
}

export default function MusicDiscovery({ children }: { children: ReactNode }) {
    const [searchQuery, setSearchQuery] = useState("");

    const [searchResults, setSearchResults] = useState<YouTubeTrack[]>([]);
    const [trendingMusic, setTrendingMusic] = useState<YouTubeTrack[]>([]);

    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [user, setUser] = useState<{username: string; email?: string} | null>(null);
    const [playlists, setPlaylists] = useState<Playlist[]>([]);

    const [isPlaying, setIsPlaying] = useState(false);

    const [repeatMode, setRepeatMode] = useState<'off' | 'one' | 'all'>('off');

    const { playSong, currentSong, clearPlayer, setPlaylist } = useMusicPlayer()

    const navigate = useNavigate();

    useEffect(() => {
        loadTrendingMusic();
        loadUserData();
    }, []);

    const loadUserData = async () => {
        try {
            const profile = await getProfile();
            setUser(profile);
            const userPlaylists = await getPlaylists();
            setPlaylists(userPlaylists);
        } catch (err) {
            console.error("Failed to load user data from MusicDiscovery.tsx", err);
        }
    }

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
            const response  = await fetch(`http://localhost:8002/api/discover/youtube/search?query=${encodeURIComponent(searchQuery)}&limit=24`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                }
            });

            if (response.ok) {
                const data = await response.json();
                console.log('Search Response: ', data)

                if (data.results && Array.isArray(data.results)) {
                    setSearchResults(data.results);
                } else if (Array.isArray(data)) {
                    setSearchResults(data);
                } else {
                    console.error("Unexpected response format:", data)
                    setSearchResults([]);
                }
            } else {
                console.error("Unexpected response format: ", response.status, await response.text());
                setSearchResults([]);
            }
        } catch (error) {
            console.error("Failed to load search result: ", error);
        } finally {
            setIsLoading(false);
        }
    };

    const playYoutubeTrack = async (track: YouTubeTrack, trackIndex?: number, isFromTrending: boolean=false) => {
        try {
            // Get the audio stream URL
            const response = await fetch(`http://localhost:8002/api/discover/youtube/audio/${track.youtube_id}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                }
            });

            if (response.ok) {
                const { audio_url } = await response.json();
                //convert to our song format
                const song: Song = {
                    id: Date.now() + Math.random(), // Ensure unique ID
                    title: track.title,
                    artist: track.artist,
                    album: track.album,
                    duration: track.duration,
                    artwork_url: track.thumbnail_url,
                    youtube_audio_url: audio_url,
                    youtube_id: track.youtube_id,
                    source: 'youtube'
                };

                // Convert all trending tracks to a playlist
                if (isFromTrending) {
                    const allTrendingSongs: Song[] = trendingMusic.map((t, index) => ({
                        id: Date.now() + index + Math.random(),
                        title: t.title,
                        artist: t.artist,
                        album: t.album,
                        duration: t.duration,
                        artwork_path: t.thumbnail_url,
                        youtube_audio_url: '', // Will be loaded when needed
                        youtube_id: t.youtube_id,
                        source: 'youtube'
                    }));

                    const currentIndex = trackIndex ?? trendingMusic.findIndex(t => t.youtube_id === track.youtube_id);
                    // Update the current song in the playlist with the loaded audio url
                    if (currentIndex !== -1 && currentIndex < allTrendingSongs.length) {
                        allTrendingSongs[currentIndex] = song;
                    }
                    setPlaylist(allTrendingSongs, currentIndex);
                } else if (searchResults.length > 0) {
                    // if playing from search results, set up search playlist
                    const allSearchSongs : Song[] = searchResults.map((t, index) => ({
                        id: Date.now() + index + Math.random(),
                        title: t.title,
                        artist: t.artist,
                        album: t.album,
                        duration: t.duration,
                        artwork_url: t.thumbnail_url,
                        youtube_audio_url: '', // Will be loaded when needed
                        youtube_id: t.youtube_id,
                        source: 'youtube'
                    }));

                    const currentIndex = trackIndex ?? searchResults.findIndex(t => t.youtube_id === track.youtube_id);
                    //Update the current song in the playlist with the loaded audio URL
                    if (currentIndex !== -1 && currentIndex < allSearchSongs.length) {
                        allSearchSongs[currentIndex] = song;
                    }
                    setPlaylist(allSearchSongs, currentIndex);
                }
                playSong(song);
            } else {
                // Fallback: open in YouTube
                window.open(track.youtube_url, '_blank');
            }
        } catch (error) {
            console.error("Failed to play track: ", error);
            window.open(track.youtube_url, '_blank');
        }
    };

    const toggleRepeat = () => {
        setRepeatMode(prev => {
            switch (prev) {
                case 'off': return 'one';
                case'one': return 'all';
                case 'all': return 'off';
                default: return 'off';
            }
        });
    }

    const handleLogout = () => {
        clearPlayer();
        localStorage.removeItem('token');
        navigate('/login');
    }

    // Rest of your component with updated UI for YouTube tracks
   return (
        <div style={{
            display: "flex",
            height: "100vh",
            backgroundColor: "#000000",
            color: "#FFFFFF",
            fontFamily: "system-ui, -apple-system, sans-serif",
        }}>
            {/* Sidebar - Copy from Dashboard */}
            <div style={{
                width: "280px",
                backgroundColor: "#000000",
                display: "flex",
                flexDirection: "column",
                borderRight: "1px solid #282828",
            }}>
                {/* Logo/Brand Section */}
                <div style={{
                    padding: "1.5rem",
                    borderBottom: "1px solid #282828",
                }}>
                    <div style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.75rem",
                        marginBottom: "0.5rem"
                    }}>
                        <div style={{
                            width: "32px",
                            height: "32px",
                            borderRadius: "8px",
                            background: "linear-gradient(45deg, #1DB954, #1ed760)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: "1rem"
                        }}>
                            🎵
                        </div>
                        <span style={{
                            fontSize: "1.25rem",
                            fontWeight: "700",
                            letterSpacing: "-0.01em"
                        }}>
                            Music App
                        </span>
                    </div>
                    {user && (
                        <p style={{
                            color: "#B3B3B3",
                            fontSize: "0.875rem",
                            margin: 0
                        }}>
                            Welcome back, {user.username}
                        </p>
                    )}
                </div>

                {/* Navigation Links */}
                <div style={{
                    padding: "1rem 1.5rem",
                    borderBottom: "1px solid #282828"
                }}>
                    <div style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "0.5rem"
                    }}>
                        <button
                            onClick={() => navigate('/dashboard')}
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "0.75rem",
                                padding: "0.75rem 1rem",
                                backgroundColor: "transparent",
                                border: "none",
                                borderRadius: "8px",
                                color: "#B3B3B3",
                                fontSize: "0.875rem",
                                fontWeight: "500",
                                cursor: "pointer",
                                transition: "all 0.2s ease",
                                width: "100%",
                                textAlign: "left"
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = "#1a1a1a";
                                e.currentTarget.style.color = "#FFFFFF";
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = "transparent";
                                e.currentTarget.style.color = "#B3B3B3";
                            }}
                        >
                            <span>🏠</span> Home
                        </button>

                        <button
                            onClick={() => navigate('/discover')}
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "0.75rem",
                                padding: "0.75rem 1rem",
                                backgroundColor: "#282828",
                                border: "none",
                                borderRadius: "8px",
                                color: "#FFFFFF",
                                fontSize: "0.875rem",
                                fontWeight: "500",
                                cursor: "pointer",
                                transition: "all 0.2s ease",
                                width: "100%",
                                textAlign: "left"
                            }}
                        >
                            <span>🔍</span> Discover
                        </button>

                        <button
                            onClick={() => navigate('/playlists/new')}
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "0.75rem",
                                padding: "0.75rem 1rem",
                                backgroundColor: "transparent",
                                border: "none",
                                borderRadius: "8px",
                                color: "#B3B3B3",
                                fontSize: "0.875rem",
                                fontWeight: "500",
                                cursor: "pointer",
                                transition: "all 0.2s ease",
                                width: "100%",
                                textAlign: "left"
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = "#1a1a1a";
                                e.currentTarget.style.color = "#FFFFFF";
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = "transparent";
                                e.currentTarget.style.color = "#B3B3B3";
                            }}
                        >
                            <span>➕</span> Create Playlist
                        </button>
                    </div>
                </div>

                {/* Playlists Section */}
                <div style={{
                    flex: 1,
                    padding: "1rem 1.5rem",
                    display: "flex",
                    flexDirection: "column",
                    minHeight: 0
                }}>
                    <div style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        marginBottom: "1rem"
                    }}>
                        <h2 style={{
                            fontSize: "1rem",
                            fontWeight: "600",
                            margin: 0,
                            color: "#B3B3B3",
                            textTransform: "uppercase",
                            letterSpacing: "0.05em"
                        }}>
                            Your Playlists
                        </h2>
                        <span style={{
                            fontSize: "0.75rem",
                            color: "#535353",
                            backgroundColor: "#1a1a1a",
                            padding: "0.25rem 0.5rem",
                            borderRadius: "12px"
                        }}>
                            {playlists.length}
                        </span>
                    </div>

                    <div style={{
                        flex: 1,
                        overflowY: "auto",
                        display: "flex",
                        flexDirection: "column",
                        gap: "0.5rem",
                        paddingRight: "0.5rem"
                    }}>
                        {playlists.map((playlist) => (
                            <div
                                key={playlist.id}
                                onClick={() => navigate(`/playlists/${playlist.id}`)}
                                style={{
                                    padding: "0.75rem",
                                    backgroundColor: "transparent",
                                    borderRadius: "8px",
                                    cursor: "pointer",
                                    transition: "all 0.2s ease",
                                    border: playlist.is_liked_songs ? "1px solid rgba(29, 185, 84, 0.3)" : "1px solid transparent"
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.backgroundColor = "#1a1a1a";
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.backgroundColor = "transparent";
                                }}
                            >
                                <div style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "0.75rem"
                                }}>
                                    <div style={{
                                        width: "48px",
                                        height: "48px",
                                        borderRadius: "6px",
                                        backgroundColor: playlist.is_liked_songs ? "#1DB954" : "#282828",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        fontSize: "1.2rem",
                                        flexShrink: 0
                                    }}>
                                        {playlist.is_liked_songs ? "💚" : "🎵"}
                                    </div>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{
                                            fontSize: "0.875rem",
                                            fontWeight: "500",
                                            color: "#FFFFFF",
                                            marginBottom: "0.25rem",
                                            overflow: "hidden",
                                            textOverflow: "ellipsis",
                                            whiteSpace: "nowrap"
                                        }}>
                                            {playlist.name}
                                        </div>
                                        <div style={{
                                            fontSize: "0.75rem",
                                            color: "#B3B3B3"
                                        }}>
                                            {playlist.songCount || 0} song{(playlist.songCount || 0) !== 1 ? 's' : ''}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
                {/* Top Navigation Bar */}
                <header style={{
                    height: "80px",
                    backgroundColor: "rgba(0, 0, 0, 0.8)",
                    backdropFilter: "blur(20px)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "0 2rem",
                    borderBottom: "1px solid #282828",
                    position: "sticky",
                    top: 0,
                    zIndex: 10
                }}>
                    {/* Navigation buttons */}
                    <div style={{
                        display: "flex",
                        gap: "0.5rem"
                    }}>
                        <button
                            onClick={() => window.history.back()}
                            style={{
                                width: "40px",
                                height: "40px",
                                borderRadius: "50%",
                                backgroundColor: "#0a0a0a",
                                border: "none",
                                color: "#FFFFFF",
                                cursor: "pointer",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontSize: "1.2rem",
                                transition: "all 0.2s ease"
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = "#282828";
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = "#0a0a0a";
                            }}
                        >
                            ←
                        </button>
                        <button
                            onClick={() => window.history.forward()}
                            style={{
                                width: "40px",
                                height: "40px",
                                borderRadius: "50%",
                                backgroundColor: "#0a0a0a",
                                border: "none",
                                color: "#FFFFFF",
                                cursor: "pointer",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontSize: "1.2rem",
                                transition: "all 0.2s ease"
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = "#282828";
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = "#0a0a0a";
                            }}
                        >
                            →
                        </button>
                    </div>

                    {/* User actions */}
                    <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                        <button
                            onClick={() => alert("Settings clicked")}
                            style={{
                                padding: "0.5rem 1rem",
                                borderRadius: "25px",
                                backgroundColor: "transparent",
                                border: "1px solid #535353",
                                color: "#FFFFFF",
                                cursor: "pointer",
                                fontSize: "0.875rem",
                                fontWeight: "500",
                                transition: "all 0.2s ease"
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = "#282828";
                                e.currentTarget.style.borderColor = "#FFFFFF";
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = "transparent";
                                e.currentTarget.style.borderColor = "#535353";
                            }}
                        >
                            Settings
                        </button>
                        <button
                            onClick={handleLogout}
                            style={{
                                padding: "0.5rem 1rem",
                                borderRadius: "25px",
                                backgroundColor: "#FFFFFF",
                                border: "none",
                                color: "#000000",
                                cursor: "pointer",
                                fontSize: "0.875rem",
                                fontWeight: "600",
                                transition: "all 0.2s ease"
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = "#B3B3B3";
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = "#FFFFFF";
                            }}
                        >
                            Log out
                        </button>
                    </div>
                </header>

                {/* Discover Content */}
                <main style={{
                    flex: 1,
                    padding: "2rem",
                    paddingBottom: currentSong ? "120px" : "2rem",
                    background: "linear-gradient(180deg, #1a1a1a 0%, #121212 100%)",
                    overflowY: "auto"
                }}>
                    {/* Search Section */}
                    <div style={{
                        marginBottom: "3rem"
                    }}>
                        <h1 style={{
                            fontSize: "2.5rem",
                            fontWeight: "700",
                            margin: "0 0 1rem 0",
                            background: "linear-gradient(45deg, #FFFFFF, #B3B3B3)",
                            WebkitBackgroundClip: "text",
                            WebkitTextFillColor: "transparent",
                            backgroundClip: "text"
                        }}>
                            Discover Music
                        </h1>

                        <div style={{
                            display: "flex",
                            gap: "1rem",
                            marginBottom: "2rem"
                        }}>
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search for songs, artists, or albums..."
                                style={{
                                    flex: 1,
                                    padding: "1rem 1.5rem",
                                    backgroundColor: "#282828",
                                    border: "2px solid transparent",
                                    borderRadius: "50px",
                                    color: "#FFFFFF",
                                    fontSize: "1rem",
                                    outline: "none",
                                    transition: "all 0.2s ease"
                                }}
                                onFocus={(e) => {
                                    e.target.style.borderColor = "#1DB954";
                                    e.target.style.backgroundColor = "#333333";
                                }}
                                onBlur={(e) => {
                                    e.target.style.borderColor = "transparent";
                                    e.target.style.backgroundColor = "#282828";
                                }}
                                onKeyPress={(e) => {
                                    if (e.key === 'Enter') {
                                        handleSearch();
                                    }
                                }}
                            />
                            <button
                                onClick={handleSearch}
                                disabled={isLoading || !searchQuery.trim()}
                                style={{
                                    padding: "1rem 2rem",
                                    background: (!searchQuery.trim() || isLoading)
                                        ? "linear-gradient(45deg, #404040, #505050)"
                                        : "linear-gradient(45deg, #1DB954, #1ed760)",
                                    border: "none",
                                    borderRadius: "50px",
                                    color: "#FFFFFF",
                                    fontSize: "1rem",
                                    fontWeight: "600",
                                    cursor: (!searchQuery.trim() || isLoading) ? "not-allowed" : "pointer",
                                    transition: "all 0.3s ease",
                                    minWidth: "120px"
                                }}
                                onMouseEnter={(e) => {
                                    if (searchQuery.trim() && !isLoading) {
                                        e.currentTarget.style.transform = "scale(1.05)";
                                    }
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.transform = "scale(1)";
                                }}
                            >
                                {isLoading ? "Searching..." : "Search"}
                            </button>
                        </div>
                    </div>

                    {/* Search Results */}
                    {searchResults.length > 0 && (
                        <div style={{
                            backgroundColor: "#181818",
                            borderRadius: "16px",
                            padding: "2rem",
                            marginBottom: "3rem"
                        }}>
                            <h2 style={{
                                fontSize: "1.75rem",
                                fontWeight: "600",
                                margin: "0 0 1.5rem 0",
                                display: "flex",
                                alignItems: "center",
                                gap: "0.5rem"
                            }}>
                                🔍 Search Results
                            </h2>

                            <div style={{
                                display: "grid",
                                gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
                                gap: "1rem"
                            }}>
                                {searchResults.map((track, trackIndex) => (
                                    <div
                                        key={track.youtube_id}
                                        style={{
                                            backgroundColor: "#282828",
                                            borderRadius: "12px",
                                            padding: "1rem",
                                            display: "flex",
                                            alignItems: "center",
                                            gap: "1rem",
                                            transition: "all 0.2s ease",
                                            cursor: "pointer"
                                        }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.backgroundColor = "#404040";
                                            e.currentTarget.style.transform = "translateY(-2px)";
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.backgroundColor = "#282828";
                                            e.currentTarget.style.transform = "translateY(0)";
                                        }}
                                        onClick={() => playYoutubeTrack(track, trackIndex, false)}
                                    >
                                        <img
                                            src={track.thumbnail_url}
                                            alt={track.title}
                                            style={{
                                                width: "64px",
                                                height: "64px",
                                                borderRadius: "8px",
                                                objectFit: "cover",
                                                flexShrink: 0
                                            }}
                                        />
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{
                                                fontWeight: "500",
                                                marginBottom: "0.25rem",
                                                overflow: "hidden",
                                                textOverflow: "ellipsis",
                                                whiteSpace: "nowrap",
                                                fontSize: "0.95rem"
                                            }}>
                                                {track.title}
                                            </div>
                                            <div style={{
                                                color: "#B3B3B3",
                                                fontSize: "0.875rem",
                                                overflow: "hidden",
                                                textOverflow: "ellipsis",
                                                whiteSpace: "nowrap",
                                                marginBottom: "0.25rem"
                                            }}>
                                                {track.artist}
                                            </div>
                                            <div style={{
                                                color: "#727272",
                                                fontSize: "0.75rem",
                                                display: "flex",
                                                alignItems: "center",
                                                gap: "0.5rem"
                                            }}>
                                                <span>👁️ {(track.view_count || 0).toLocaleString()}</span>
                                                <span>⏱️ {Math.floor((track.duration || 0) / 60)}:{String(Math.floor((track.duration || 0) % 60)).padStart(2, '0')}</span>
                                            </div>
                                        </div>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                playYoutubeTrack(track, trackIndex, false);
                                            }}
                                            style={{
                                                width: "44px",
                                                height: "44px",
                                                borderRadius: "50%",
                                                background: "linear-gradient(45deg, #FF0000, #FF4444)",
                                                border: "none",
                                                color: "#FFFFFF",
                                                cursor: "pointer",
                                                fontSize: "16px",
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "center",
                                                transition: "all 0.2s ease",
                                                boxShadow: "0 4px 12px rgba(255, 0, 0, 0.3)"
                                            }}
                                            onMouseEnter={(e) => {
                                                e.currentTarget.style.transform = "scale(1.1)";
                                                e.currentTarget.style.boxShadow = "0 6px 16px rgba(255, 0, 0, 0.4)";
                                            }}
                                            onMouseLeave={(e) => {
                                                e.currentTarget.style.transform = "scale(1)";
                                                e.currentTarget.style.boxShadow = "0 4px 12px rgba(255, 0, 0, 0.3)";
                                            }}
                                        >
                                            ▶️
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Trending Music */}
                    <div style={{
                        backgroundColor: "#181818",
                        borderRadius: "16px",
                        padding: "2rem"
                    }}>
                        <h2 style={{
                            fontSize: "1.75rem",
                            fontWeight: "600",
                            margin: "0 0 1.5rem 0",
                            display: "flex",
                            alignItems: "center",
                            gap: "0.5rem"
                        }}>
                            🔥 Trending Music
                        </h2>

                        {trendingMusic.length === 0 ? (
                            <div style={{
                                textAlign: "center",
                                padding: "3rem",
                                color: "#B3B3B3"
                            }}>
                                <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>🎵</div>
                                <p>Loading trending music...</p>
                            </div>
                        ) : (
                            <div style={{
                                display: "grid",
                                gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
                                gap: "1rem"
                            }}>
                                {trendingMusic.map((track, trackIndex) => (
                                    <div
                                        key={track.youtube_id}
                                        style={{
                                            backgroundColor: "#282828",
                                            borderRadius: "12px",
                                            padding: "1rem",
                                            display: "flex",
                                            alignItems: "center",
                                            gap: "1rem",
                                            transition: "all 0.2s ease",
                                            cursor: "pointer"
                                        }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.backgroundColor = "#404040";
                                            e.currentTarget.style.transform = "translateY(-2px)";
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.backgroundColor = "#282828";
                                            e.currentTarget.style.transform = "translateY(0)";
                                        }}
                                        onClick={() => playYoutubeTrack(track, trackIndex, false)}
                                    >
                                        <img
                                            src={track.thumbnail_url}
                                            alt={track.title}
                                            style={{
                                                width: "64px",
                                                height: "64px",
                                                borderRadius: "8px",
                                                objectFit: "cover",
                                                flexShrink: 0
                                            }}
                                        />
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{
                                                fontWeight: "500",
                                                marginBottom: "0.25rem",
                                                overflow: "hidden",
                                                textOverflow: "ellipsis",
                                                whiteSpace: "nowrap",
                                                fontSize: "0.95rem"
                                            }}>
                                                {track.title}
                                            </div>
                                            <div style={{
                                                color: "#B3B3B3",
                                                fontSize: "0.875rem",
                                                overflow: "hidden",
                                                textOverflow: "ellipsis",
                                                whiteSpace: "nowrap",
                                                marginBottom: "0.25rem"
                                            }}>
                                                {track.artist}
                                            </div>
                                            <div style={{
                                                color: "#727272",
                                                fontSize: "0.75rem",
                                                display: "flex",
                                                alignItems: "center",
                                                gap: "0.5rem"
                                            }}>
                                                <span>👁️ {(track.view_count || 0).toLocaleString()}</span>
                                                <span>⏱️ {Math.floor((track.duration || 0) / 60)}:{String(Math.floor((track.duration || 0) % 60)).padStart(2, '0')}</span>
                                            </div>
                                        </div>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                playYoutubeTrack(track, trackIndex, false);
                                            }}
                                            style={{
                                                width: "44px",
                                                height: "44px",
                                                borderRadius: "50%",
                                                background: "linear-gradient(45deg, #FF0000, #FF4444)",
                                               border: "none",
                                               color: "#FFFFFF",
                                               cursor: "pointer",
                                               fontSize: "16px",
                                               display: "flex",
                                               alignItems: "center",
                                               justifyContent: "center",
                                               transition: "all 0.2s ease",
                                               boxShadow: "0 4px 12px rgba(255, 0, 0, 0.3)"
                                           }}
                                           onMouseEnter={(e) => {
                                               e.currentTarget.style.transform = "scale(1.1)";
                                               e.currentTarget.style.boxShadow = "0 6px 16px rgba(255, 0, 0, 0.4)";
                                           }}
                                           onMouseLeave={(e) => {
                                               e.currentTarget.style.transform = "scale(1)";
                                               e.currentTarget.style.boxShadow = "0 4px 12px rgba(255, 0, 0, 0.3)";
                                           }}
                                       >
                                           ▶️
                                       </button>
                                   </div>
                               ))}
                           </div>
                       )}
                   </div>
               </main>
           </div>

           {/* Add CSS animations */}
           <style>{`
               @keyframes spin {
                   0% { transform: rotate(0deg); }
                   100% { transform: rotate(360deg); }
               }
               
               /* Custom scrollbar */
               ::-webkit-scrollbar {
                   width: 8px;
               }
               
               ::-webkit-scrollbar-track {
                   background: transparent;
               }
               
               ::-webkit-scrollbar-thumb {
                   background: #535353;
                   border-radius: 4px;
               }
               
               ::-webkit-scrollbar-thumb:hover {
                   background: #727272;
               }
           `}</style>
       </div>
   );

}