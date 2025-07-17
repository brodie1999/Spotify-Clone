// @ts-ignore
import React, { useState, useEffect} from "react";
import { Link, useNavigate } from "react-router-dom";
import { getPlaylists, getProfile, getPlaylistDetails, Playlist} from "../api";

export function Dashboard() {
    const [user, setUser] = useState<{username: string; email?: string} | null>(null);
    const [playlists, setPlaylists] = useState<Playlist[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [selectedPlaylist, setSelectedPlaylist] = useState<number | null>(null)
    const [isLoading, setIsLoading] = useState<boolean>(false);
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


            } catch (error: any) {
                setError(error.message || "Failed to fetch profile");
            } finally {
                setIsLoading(false);
            }
        }
        fetchProfileData();
    }, [navigate]);



    const handlePlaylistClick = (playlistId: number) => {
        navigate(`/playlists/${playlistId}`);
    }



    const handleLogout = () => {
        localStorage.removeItem("token");
        navigate("/login");
    };


    return (
    <div
      style={{
        display: "flex",
        height: "100vh",
        backgroundColor: "#121212",
        color: "#FFFFFF",
        fontFamily: "sans-serif",
      }}
    >
      {/* Sidebar */}
      <div
        style={{
          width: "250px",
          backgroundColor: "#181818",
          padding: "1rem",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <h2 style={{ display: "flex", margin: 0, marginBottom: "1rem", fontSize: "1.25rem", justifyContent: "center" }}>
          Playlists
        </h2>

        <div
          style={{
            flex: 1,
            overflowY: "auto",
            display: "flex",
            flexDirection: "column",
            gap: "0.5rem",
          }}
        >
            {/* DISPLAY PLAYLISTS THE USER HAS */}
            {isLoading ? (
                <div style={{ color: "#B3B3B3", textAlign: "center" , padding: "1rem" }}>
                    Loading Playlists...
                </div>

            ) : playlists.length === 0 ? (
                <div style={{ color: "#B3B3B3", textAlign: "center", padding: "1rem" }}>
                    No Playlists Yet
                </div>
            ) : (
                playlists.map((playlist) => (
                    <div
                        key={playlist.id}
                        onClick={() => handlePlaylistClick(playlist.id)}
                        style={{
                            padding: "0.75",
                            background: selectedPlaylist === playlist.id ? "#282828" : "transparent",
                            borderRadius: "0.5rem",
                            cursor: "pointer",
                            transition: "background-color 0.2s",
                            color: "#FFFFFF",
                            border: playlist.is_liked_songs ? "1px solid #1DB954" : "none"
                        }}
                    onMouseEnter={(e) => {
                        if (selectedPlaylist !== playlist.id) {
                            e.currentTarget.style.backgroundColor = "1a1a1a";
                        }
                    }}
                    onMouseLeave={(e) => {
                        if (selectedPlaylist !== playlist.id) {
                            e.currentTarget.style.backgroundColor = "transparent";
                        }
                    }}
                    >
                        <div style={{
                            fontSize: "1rem",
                            fontWeight: "500",
                            marginBottom: "0.25rem",
                        }}>
                            {playlist.is_liked_songs && "💚"}  {playlist.name}
                        </div>
                    <div style={{
                        fontSize: "0.875rem",
                        color: "#b3b3b3",
                    }}>
                    {playlist.songCount || 0} song{(playlist.songCount || 0) !== 1 ? 's' : ''}
                    </div>
                </div>
                ))
            )}

        </div>
        <Link to="/playlists/new" style={{ display: "flex", justifyContent: "center" }}>
        <button
          style={{
              marginTop: "1rem",
              width: "2.5rem",
              height: "2.5rem",
              borderRadius: "50%",
              backgroundColor: "#1DB954",
              border: "none",
              color: "#FFFFFF",
              cursor: "pointer",
          }}
        >
          +
        </button>
        </Link>
    </div> {/* END OF SIDEBAR */}
      {/* Main area */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        {/* Top bar */}
        <header
          style={{
            height: "60px",
            backgroundColor: "#282828",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0 1rem",
          }}
        >
          <input
            type="text"
            placeholder="Search..."
            style={{
              display: "flex",
              width: "200px",
              padding: "0.5rem 1rem",
              borderRadius: "1rem",
              border: "none",
              outline: "none",
              backgroundColor: "#121212",
              color: "#FFFFFF",
              justifyContent: "center",
            }}
          />

          <div style={{ display: "flex", gap: "0.5rem" }}>
            <button
              onClick={() => alert("Settings clicked")}
              style={{
                padding: "0.5rem 1rem",
                borderRadius: "1rem",
                backgroundColor: "#3E3E3E",
                border: "none",
                color: "#FFFFFF",
                cursor: "pointer",
              }}
            >
              Settings
            </button>
            <button
              onClick={handleLogout}
              style={{
                padding: "0.5rem 1rem",
                borderRadius: "1rem",
                backgroundColor: "#B91C1C",
                border: "none",
                color: "#FFFFFF",
                cursor: "pointer",
              }}
            >
              Logout
            </button>
          </div>
        </header>

        {/* Content placeholder */}
        <main style={{ flex: 1, padding: "1rem", backgroundColor: "#121212" }}>
          {error && (
            <p style={{ color: "#F87171", marginBottom: "1rem" }}>{error}</p>
          )}
          {user ? (
            <div>
              <p style={{ fontSize: "1.2rem", marginBottom: "1rem" }}>
                Welcome back, <strong>{user.username}</strong>!
              </p>
              <div style={{
                backgroundColor: "#181818",
                padding: "2rem",
                borderRadius: "0.5rem",
                textAlign: "center"
              }}>
                <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>🎵</div>
                <h2 style={{ fontSize: "1.5rem", marginBottom: "1rem" }}>Your Music Library</h2>
                <p style={{ color: "#B3B3B3", marginBottom: "1.5rem" }}>
                  Select a playlist from the sidebar to view and manage your songs, or create a new playlist to get started.
                </p>
                <Link to="/playlists/new">
                  <button style={{
                    padding: "0.75rem 1.5rem",
                    backgroundColor: "#1DB954",
                    border: "none",
                    borderRadius: "2rem",
                    color: "#FFFFFF",
                    fontSize: "1rem",
                    cursor: "pointer",
                    fontWeight: "500"
                  }}>
                    Create Your First Playlist
                  </button>
                </Link>
              </div>
            </div>
          ) : (
            <p>Loading your profile…</p>
          )}
        </main>
      </div>
    </div>
    );
}