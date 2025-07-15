// @ts-ignore
import React, { useState, useEffect} from "react";
import { Link, useNavigate } from "react-router-dom";
import {api, getProfile, Playlist} from "../api";

export function Dashboard() {
    const [user, setUser] = useState<{username: string; email?: string} | null>(null);
    const [playlists, setPlaylists] = useState<Playlist[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [selectedPlaylist, setSelectedPlaylist] = useState<number | null>(null);
    const navigate = useNavigate();

    // Fetch current user profile
    useEffect(() => {
        async function fetchProfile() {
            const token = localStorage.getItem("token");
            if (!token) {
                navigate("/");
                return;
            }
            try {
                const profile = await getProfile();
                setUser(profile);
            } catch (error: any) {
                setError(error.message || "Failed to fetch profile");
            }
        }
        fetchProfile();
    }, [navigate]);

    // fetch user Playlists
    useEffect(() => {
        async function fetchPlaylists() {
            try {
                const response = await api.get<Playlist[]>('/api/playlists');
                setPlaylists(response.data);
            } catch (error: any) {
                setError(error.message || "Failed to fetch playlists:");
            }
        }
        fetchPlaylists();
    })

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
      <aside
        style={{
          width: "250px",
          backgroundColor: "#181818",
          padding: "1rem",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <h2 style={{ margin: 0, marginBottom: "1rem", fontSize: "1.25rem" }}>
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
          {/* Placeholder items */}
          <div style={{ padding: "0.5rem", cursor: "pointer", borderRadius: "0.25rem", backgroundColor: "#282828" }}>
            Playlist 1
          </div>
          <div style={{ padding: "0.5rem", cursor: "pointer", borderRadius: "0.25rem", backgroundColor: "#282828" }}>
            Playlist 2
          </div>
          <div style={{ padding: "0.5rem", cursor: "pointer", borderRadius: "0.25rem", backgroundColor: "#282828" }}>
            Playlist 3
          </div>
        </div>
        <Link to="/playlists/new">
        <button
          style={{
            marginTop: "1rem",
            alignSelf: "center",
            width: "2.5rem",
            height: "2.5rem",
            borderRadius: "50%",
            fontSize: "1.5rem",
            backgroundColor: "#1DB954",
            border: "none",
            color: "#FFFFFF",
            cursor: "pointer",
          }}
        >
          +
        </button>
        </Link>
      </aside>

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
              width: "200px",
              padding: "0.5rem 1rem",
              borderRadius: "1rem",
              border: "none",
              outline: "none",
              backgroundColor: "#121212",
              color: "#FFFFFF",
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
            <p>Welcome back, <strong>{user.username}</strong>! Select a playlist.</p>
          ) : (
            <p>Loading your profile…</p>
          )}
        </main>
      </div>
    </div>
    );

}