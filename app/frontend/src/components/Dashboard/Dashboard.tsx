// @ts-ignore
import React, { useState, useEffect} from "react";
import { Link, useNavigate } from "react-router-dom";
import { getPlaylists, getProfile, getPlaylistDetails, Playlist, YouTubeTrack } from "../../api";
import AudioUpload from "../Audio/AudioUpload";
import YouTubeTrackCard from "../YouTube/YouTubeCardTrack";

import { useMusicPlayer } from "../../contexts/MusicPlayerContext";

export function Dashboard() {
    const [user, setUser] = useState<{username: string; email?: string} | null>(null);
    const [playlists, setPlaylists] = useState<Playlist[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [selectedPlaylist, setSelectedPlaylist] = useState<number | null>(null)
    const [searchTerm, setSearchTerm] = useState("");
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);
    const [trendingMusic, setTrendingMusic] = useState<YouTubeTrack[]>([]);

    const { currentSong, clearPlayer, playSong, isPlaying, pauseMusic, resumeMusic, setPlaylist } = useMusicPlayer();
    const navigate = useNavigate();

    // Fetch current user profile data
    useEffect(() => {
        async function fetchProfileData() {
            const token = localStorage.getItem("token");
            if (!token) {
                navigate("/");
                return;
            }
            try {
                setIsLoading(true);
                const profile = await getProfile();
                setUser(profile);

                // Get Playlist first
                const playlists = await getPlaylists();

                const playlist_count = await Promise.all(
                    playlists.map(async (playlist) => {
                        try {
                            const details = await getPlaylistDetails(playlist.id);
                            return {
                                ...playlist,
                                songCount: details.songs?.length || 0
                            };
                        } catch (error) {
                            // If we can't get details, just return basic info
                            return {
                                ...playlist,
                                songCount: 0
                            };
                        }
                    })
                )

                setPlaylists(playlist_count);

                // Load trending music from YouTube
                try {
                    const response = await fetch('http://localhost:8002/api/discover/youtube/trending', {
                        headers: {
                            'Authorization': `Bearer ${token}`
                        }
                    });
                    if (response.ok) {
                        const trending = await response.json();
                        console.log('Trending data recieved: ', trending);

                        setTrendingMusic(trending)
                    } else {
                        console.error("Response not ok: ", response.status, await response.text());
                    }
                } catch (error) {
                    console.log('Failed to load trending music: ', error);
                }

            } catch (error: any) {
                setError(error.message || "Failed to fetch profile");
            } finally {
                setIsLoading(false);
            }
        }
        fetchProfileData();
    }, [navigate]);

    // Add function to play YouTube tracks
    const playYouTubeTrack = async (track: YouTubeTrack, trackIndex?: number, fromTrending: boolean = false) => {
        try {
            const response = await fetch(`http://localhost:8002/api/discover/youtube/audio/${track.youtube_id}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            if (response.ok) {
                const { audio_url } = await response.json();
                const song = {
                    id: Date.now(),
                    title: track.title,
                    artist: track.artist,
                    album: track.album,
                    duration: track.duration,
                    artwork_path: track.thumbnail_url,
                    youtube_audio_url: audio_url,
                    youtube_id: track.youtube_id,
                    source: 'youtube' as const
                };

                // Convert trending track to a playlist
                if (fromTrending && trendingMusic.length > 0) {
                    const allTrendingSongs = trendingMusic.map((t, index) => ({
                        id: Date.now() + index + Math.random(),
                        title: t.title,
                        artist: t.artist,
                        album: t.album,
                        duration: t.duration,
                        artwork_path: t.thumbnail_url,
                        youtube_audio_url: index === trackIndex ? audio_url : "",
                        youtube_id: t.youtube_id,
                        source: 'youtube' as const
                    }));
                    const currentIndex = trackIndex ?? 0;
                    setPlaylist(allTrendingSongs, currentIndex);
                }

                playSong(song);

            } else {
                 window.open(`https://www.youtube.com/watch?v=${track.youtube_id}`, '_blank');
            }
        } catch (error) {
            console.error('Failed to play track: ', error);
        }
    }

    const handlePlaylistClick = (playlistId: number) => {
        navigate(`/playlists/${playlistId}`);
    }

    const handleLogout = () => {
        clearPlayer();
        localStorage.removeItem("token");
        navigate("/login");
    };

    const handleUploadSuccess = (song: any) => {
        setUploadSuccess(`Successfully uploaded "${song.title}" by ${song.artist}`);
        setError(null);
        // Clear success message after 5 seconds
        setTimeout(() => setUploadSuccess(null), 5000);
    };

    const handleUploadError = (errorMessage: string) => {
        setError(errorMessage);
        setUploadSuccess(null);
    };

    const filteredPlaylists = searchTerm.trim()
        ? playlists.filter(playlist =>
            playlist.name.toLowerCase().includes(searchTerm.toLowerCase().trim())
          )
        : playlists;

    // @ts-ignore
    return (
        <>
        <div style={{
            display: "flex",
            height: "100vh",
            backgroundColor: "#000000",
            color: "#FFFFFF",
            fontFamily: "system-ui, -apple-system, sans-serif",
        }}>
            {/* Modern Sidebar */}
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
                            onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = "#404040";
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = "#282828";
                            }}
                        >
                            <span>🏠</span> Home
                        </button>

                        {/* DISCOVER BUTTON */}
                        <button
                            onClick={() => navigate('/discover')}
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
                            <span>🔍</span>Discover
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

                    {/* Search Input */}
                    <div style={{
                        marginBottom: "1rem",
                        position: "relative"
                    }}>
                        <input
                            type="text"
                            placeholder="Search playlists..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={{
                                width: "100%",
                                padding: "0.75rem 1rem",
                                backgroundColor: "#1a1a1a",
                                border: "1px solid #282828",
                                borderRadius: "8px",
                                color: "#FFFFFF",
                                fontSize: "0.875rem",
                                outline: "none",
                                transition: "all 0.2s ease",
                                boxSizing: "border-box"
                            }}
                            onFocus={(e) => {
                                e.target.style.borderColor = "#1DB954";
                                e.target.style.backgroundColor = "#282828";
                            }}
                            onBlur={(e) => {
                                e.target.style.borderColor = "#282828";
                                e.target.style.backgroundColor = "#1a1a1a";
                            }}
                        />
                    </div>

                    {/* Playlists List */}
                    <div style={{
                        flex: 1,
                        overflowY: "auto",
                        display: "flex",
                        flexDirection: "column",
                        gap: "0.5rem",
                        paddingRight: "0.5rem"
                    }}>
                        {isLoading ? (
                            <div style={{
                                color: "#B3B3B3",
                                textAlign: "center",
                                padding: "2rem 1rem",
                                fontSize: "0.875rem"
                            }}>
                                <div style={{
                                    width: "24px",
                                    height: "24px",
                                    border: "2px solid #282828",
                                    borderTop: "2px solid #1DB954",
                                    borderRadius: "50%",
                                    animation: "spin 1s linear infinite",
                                    margin: "0 auto 0.5rem"
                                }} />
                                Loading playlists...
                            </div>
                        ) : playlists.length === 0 ? (
                            <div style={{
                                color: "#B3B3B3",
                                textAlign: "center",
                                padding: "2rem 1rem",
                                fontSize: "0.875rem"
                            }}>
                                No playlists yet
                                <div style={{
                                    marginTop: "1rem"
                                }}>
                                    <Link
                                        to="/playlists/new"
                                        style={{
                                            color: "#1DB954",
                                            textDecoration: "none",
                                            fontSize: "0.8rem",
                                            fontWeight: "500"
                                        }}
                                    >
                                        Create your first playlist
                                    </Link>
                                </div>
                            </div>
                        ) : filteredPlaylists.length === 0 ? (
                            <div style={{
                                color: "#B3B3B3",
                                textAlign: "center",
                                padding: "2rem 1rem",
                                fontSize: "0.875rem"
                            }}>
                                No playlists match "{searchTerm}"
                                <div style={{
                                    marginTop: "1rem"
                                }}>
                                    <button
                                        onClick={() => setSearchTerm("")}
                                        style={{
                                            color: "#1DB954",
                                            background: "none",
                                            border: "none",
                                            fontSize: "0.8rem",
                                            fontWeight: "500",
                                            cursor: "pointer",
                                            textDecoration: "underline"
                                        }}
                                    >
                                        Clear search
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <>
                                {filteredPlaylists.map((playlist) => (
                                    <div
                                        key={playlist.id}
                                        onClick={() => handlePlaylistClick(playlist.id)}
                                        style={{
                                            padding: "0.75rem",
                                            backgroundColor: selectedPlaylist === playlist.id ? "#282828" : "transparent",
                                            borderRadius: "8px",
                                            cursor: "pointer",
                                            transition: "all 0.2s ease",
                                            border: playlist.is_liked_songs ? "1px solid rgba(29, 185, 84, 0.3)" : "1px solid transparent"
                                        }}
                                        onMouseEnter={(e) => {
                                            if (selectedPlaylist !== playlist.id) {
                                                e.currentTarget.style.backgroundColor = "#1a1a1a";
                                            }
                                        }}
                                        onMouseLeave={(e) => {
                                            if (selectedPlaylist !== playlist.id) {
                                                e.currentTarget.style.backgroundColor = "transparent";
                                            }
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
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* Main Content Area */}
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

                {/* Main Content */}
                <main style={{
                    flex: 1,
                    padding: "2rem",
                    paddingBottom: currentSong ? "120px" : "2rem",
                    background: "linear-gradient(180deg, #1a1a1a 0%, #121212 100%)",
                    overflowY: "auto",
                    marginHeight: "calc(100vh - 80px)"
                }}>
                    {error && (
                        <div style={{
                            backgroundColor: "rgba(185, 28, 28, 0.15)",
                            border: "1px solid rgba(185, 28, 28, 0.3)",
                            borderRadius: "12px",
                            padding: "1rem",
                            marginBottom: "2rem",
                            color: "#FCA5A5",
                            fontSize: "0.875rem",
                            display: "flex",
                            alignItems: "center",
                            gap: "0.5rem"
                        }}>
                            <span>⚠️</span>
                            {error}
                        </div>
                    )}

                    {uploadSuccess && (
                        <div style={{
                            backgroundColor: "rgba(29, 185, 84, 0.15)",
                            border: "1px solid rgba(29, 185, 84, 0.3)",
                            borderRadius: "12px",
                            padding: "1rem",
                            marginBottom: "2rem",
                            color: "#4ADE80",
                            fontSize: "0.875rem",
                            display: "flex",
                            alignItems: "center",
                            gap: "0.5rem"
                        }}>
                            <span>✅</span>
                            {uploadSuccess}
                        </div>
                    )}

                    {user ? (
                        <div>
                            {/* Welcome Section */}
                            <div style={{
                                marginBottom: "3rem"
                            }}>
                                <h1 style={{
                                    fontSize: "2.5rem",
                                    fontWeight: "700",
                                    margin: "0 0 0.5rem 0",
                                    background: "linear-gradient(45deg, #FFFFFF, #B3B3B3)",
                                    WebkitBackgroundClip: "text",
                                    WebkitTextFillColor: "transparent",
                                    backgroundClip: "text"
                                }}>
                                    Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 18 ? 'afternoon' : 'evening'}, {user.username}
                                </h1>
                                <p style={{
                                    color: "#B3B3B3",
                                    fontSize: "1.1rem",
                                    margin: 0
                                }}>
                                    Ready to dive into your music?
                                </p>
                            </div>

                            {/* Quick Actions */}
                            <div style={{
                                display: "grid",
                                gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
                                gap: "1.5rem",
                                marginBottom: "3rem"
                            }}>
                                {/* Create Playlist Card */}
                                <Link
                                    to="/playlists/new"
                                    style={{
                                        textDecoration: "none",
                                        color: "inherit"
                                    }}
                                >
                                    <div style={{
                                        background: "linear-gradient(135deg, #1DB954 0%, #1ed760 100%)",
                                        borderRadius: "16px",
                                        padding: "2rem",
                                        cursor: "pointer",
                                        transition: "all 0.3s ease",
                                        position: "relative",
                                        overflow: "hidden"
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.transform = "translateY(-4px)";
                                        e.currentTarget.style.boxShadow = "0 20px 40px rgba(29, 185, 84, 0.3)";
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.transform = "translateY(0)";
                                        e.currentTarget.style.boxShadow = "none";
                                    }}
                                    >
                                        <div style={{
                                            fontSize: "2.5rem",
                                            marginBottom: "2.5rem"
                                        }}>
                                            ➕
                                        </div>
                                        <h3 style={{
                                            fontSize: "1.25rem",
                                            fontWeight: "600",
                                            margin: "0 0 0.5rem 0",
                                            color: "#000000"
                                        }}>
                                            Create Playlist
                                        </h3>
                                        <p style={{
                                            color: "rgba(0, 0, 0, 0.7)",
                                            marginBottom: "1rem",
                                            fontSize: "0.9rem"
                                        }}>
                                            Start building your perfect collection
                                        </p>
                                    </div>
                                </Link>
                                {/* Liked Songs Card */}
                                <div
                                    onClick={() => {
                                        const likedPlaylist = playlists.find(p => p.is_liked_songs);
                                        if (likedPlaylist) {
                                            navigate(`/playlists/${likedPlaylist.id}`);
                                        } else {
                                            // If no liked playlist exists, navigate to the special endpoint
                                            navigate('/playlists/special/liked-songs');
                                        }
                                    }}
                                    style={{
                                        background: "linear-gradient(135deg, #6B46C1 0%, #9333EA 50%, #EC4899 100%)",
                                        borderRadius: "16px",
                                        padding: "2rem",
                                        cursor: "pointer",
                                        transition: "all 0.3s ease",
                                        position: "relative",
                                        overflow: "hidden"
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.transform = "translateY(-4px)";
                                        e.currentTarget.style.boxShadow = "0 20px 40px rgba(147, 51, 234, 0.3)";
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.transform = "translateY(0)";
                                        e.currentTarget.style.boxShadow = "none";
                                    }}
                                >
                                    <div style={{
                                        fontSize: "2.5rem",
                                        marginBottom: "1rem"
                                    }}>
                                        💚
                                    </div>
                                    <h3 style={{
                                        fontSize: "1.25rem",
                                        fontWeight: "600",
                                        margin: "0 0 0.5rem 0",
                                        color: "#FFFFFF"
                                    }}>
                                        Liked Songs
                                    </h3>
                                    <p style={{
                                        color: "rgba(255, 255, 255, 0.8)",
                                        margin: 0,
                                        fontSize: "0.9rem"
                                    }}>
                                        {(() => {
                                            const likedPlaylist = playlists.find(p => p.is_liked_songs);
                                            const songCount = likedPlaylist?.songCount || 0;
                                            return `${songCount} liked song${songCount !== 1 ? 's' : ''}`;
                                        })()}
                                    </p>
                                </div>

                                {/* Upload Music Card */}
                                <AudioUpload
                                    onUploadSuccess={handleUploadSuccess}
                                    onUploadError={handleUploadError}
                                />

                                {/* Library Stats Card */}
                                <div style={{
                                    backgroundColor: "#181818",
                                    borderRadius: "16px",
                                    padding: "2rem",
                                    border: "1px solid #282828"
                                }}>
                                    <div style={{
                                        fontSize: "2.5rem",
                                        marginBottom: "1rem"
                                    }}>
                                        📊
                                    </div>
                                    <h3 style={{
                                        fontSize: "1.25rem",
                                        fontWeight: "600",
                                        margin: "0 0 0.5rem 0"
                                    }}>
                                        Your Library
                                    </h3>
                                    <p style={{
                                        color: "#B3B3B3",
                                        margin: "0 0 1rem 0",
                                        fontSize: "0.9rem"
                                    }}>
                                        {playlists.length} playlist{playlists.length !== 1 ? 's' : ''}, {playlists.reduce((acc, p) => acc + (p.songCount || 0), 0)} total songs
                                    </p>
                                </div>
                            </div>

                            {/* Recently Played/Featured */}
                            <div style={{
                                backgroundColor: "#181818",
                                borderRadius: "16px",
                                padding: "2rem",
                                textAlign: "center"
                            }}>
                                <div style={{
                                    fontSize: "4rem",
                                    marginBottom: "1.5rem",
                                    opacity: 0.7
                                }}>
                                    🎵
                                </div>
                                <h2 style={{
                                    fontSize: "1.75rem",
                                    fontWeight: "600",
                                    margin: "0 0 1rem 0"
                                }}>
                                    Your Music Awaits
                                </h2>
                                <p style={{
                                    color: "#B3B3B3",
                                    margin: "0 0 2rem 0",
                                    fontSize: "1rem",
                                    lineHeight: "1.5",
                                    maxWidth: "600px",
                                    marginLeft: "auto",
                                    marginRight: "auto"
                                }}>
                                    Select a playlist from the sidebar to start listening, upload new music, or create a new playlist to organize your favorite tracks.
                                </p>
                                <Link to="/playlists/new">
                                    <button style={{
                                        padding: "0.875rem 2rem",
                                        background: "linear-gradient(45deg, #1DB954, #1ed760)",
                                        border: "none",
                                        borderRadius: "50px",
                                        color: "#FFFFFF",
                                        fontSize: "1rem",
                                        fontWeight: "600",
                                        cursor: "pointer",
                                        transition: "all 0.3s ease",
                                        boxShadow: "0 8px 25px rgba(29, 185, 84, 0.3)"
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.transform = "scale(1.05)";
                                        e.currentTarget.style.boxShadow = "0 12px 35px rgba(29, 185, 84, 0.4)";
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.transform = "scale(1)";
                                        e.currentTarget.style.boxShadow = "0 8px 25px rgba(29, 185, 84, 0.3)";
                                    }}
                                    >
                                        Get Started
                                    </button>
                                </Link>
                            </div>
                        </div>
                    ) : (
                        <div style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            height: "100%",
                            flexDirection: "column",
                            gap: "1rem"
                        }}>
                            <div style={{
                                width: "40px",
                                height: "40px",
                                border: "3px solid #282828",
                                borderTop: "3px solid #1DB954",
                                borderRadius: "50%",
                                animation: "spin 1s linear infinite"
                            }} />
                            <p style={{
                                color: "#B3B3B3",
                                fontSize: "1.1rem"
                            }}>
                                Loading your profile...
                            </p>
                        </div>
                    )}
                    {trendingMusic.length > 0 && (
                       <div style={{
                        backgroundColor: "#181818",
                        borderRadius: "16px",
                        padding: "2rem",
                        marginBottom: "2rem"
                    }}>
                        <div style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            marginBottom: "1.5rem"
                        }}>
                            <h2 style={{
                                fontSize: "1.75rem",
                                fontWeight: "600",
                                margin: 0,
                                display: "flex",
                                alignItems: "center",
                                gap: "0.5rem"
                            }}>
                                🔥 Trending Music
                            </h2>
                            <Link to="/discover" style={{
                                color: "#1DB954",
                                textDecoration: "none",
                                fontSize: "0.9rem",
                                fontWeight: "500",
                                borderRadius: "20px",
                                border: "1px solid #1DB954",
                                transition: "all 0.2s ease"
                            }}>
                                View All →
                            </Link>
                        </div>

                        <div style={{
                            display: "grid",
                            gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
                            gap: "1rem"
                        }}>
                            {trendingMusic.map((track: YouTubeTrack, trackIndex: number) => (
                                <YouTubeTrackCard
                                    id={track.youtube_id}
                                    track={track}
                                    trackIndex={trackIndex}
                                    onPlay={playYouTubeTrack}
                                    playlists={playlists}
                                    currentSong={currentSong}
                                    isPlaying={isPlaying}
                                    pauseMusic={pauseMusic}
                                    resumeMusic={resumeMusic}
                                    fromTrending={true}
                                />
                            ))}
                        </div>
                    </div>
                )}
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
            </>
    );
}