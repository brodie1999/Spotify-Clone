import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { api, getSongs, createPlaylist, addSongToPlaylist } from "../api";

interface Song {
    id: number;
    title : string;
    artist: string;
    album: string;
}

export default function PlaylistBuilder() {
    const [songs, setSongs] = useState<Song[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedSongs, setSelectedSongs] = useState<number[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [playlistName, setPlaylistName] = useState('');
    const [error, setError] = useState<string  | null>(null);
    const navigate = useNavigate();

    // Fetch songs on mount
    useEffect(() => {
        loadSongs();
    }, []);

    const loadSongs = async () => {
        try {
            setIsLoading(true);
            const fetchedSongs = await getSongs();
            setSongs(fetchedSongs);
        } catch (err) {
            setError("Failed to load Songs");
            console.error("Error Loading Songs: ", err)
        } finally {
            setIsLoading(false);
        }
    };

    const handleSongToggle = (songId: number) => {
        setSelectedSongs(prev =>
        prev.includes(songId)
            ? prev.filter(id => id !== songId)
            : [...prev, songId]
        );
    };

    const handleCreatePlaylist = async () => {
        if (!playlistName.trim()) {
            setError("Please enter a playlist name");
            return;
        }

        if (selectedSongs.length === 0) {
            setError("Please select at least one song");
            return;
        }

        try {
            setIsLoading(true);
            setError(null);

            // Create the playlist
            const newPlaylist = await createPlaylist(playlistName);

            // Add selected songs to the playlist
            await Promise.all(
                selectedSongs.map(song_Id =>
                    addSongToPlaylist(newPlaylist.id, song_Id.toString())
                )
            );
            // Navigate back to the dashboard
            navigate('/dashboard');
        } catch (err) {
            setError("Failed to create Playlist");
            console.error("Error creating Playlist: ", err);
        } finally {
            setIsLoading(false);
        }
    };

    const filteredSongs = songs.filter(song =>
        song.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        song.artist.toLowerCase().includes(searchTerm.toLowerCase()) ||
        song.album.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#121212',
      color: '#FFFFFF',
      padding: '2rem',
      fontFamily: 'sans-serif'
    }}>
      <div style={{
        maxWidth: '800px',
        margin: '0 auto'
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '2rem'
        }}>
          <h1 style={{
            fontSize: '2rem',
            fontWeight: 'bold',
            margin: 0
          }}>
            Create Playlist
          </h1>
          <button
            onClick={() => navigate('/dashboard')}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: '#3E3E3E',
              border: 'none',
              borderRadius: '0.5rem',
              color: '#FFFFFF',
              cursor: 'pointer'
            }}
          >
            Back to Dashboard
          </button>
        </div>

        {/* Error display */}
        {error && (
          <div style={{
            backgroundColor: '#B91C1C',
            color: '#FFFFFF',
            padding: '1rem',
            borderRadius: '0.5rem',
            marginBottom: '1rem'
          }}>
            {error}
          </div>
        )}

        {/* Playlist name input */}
        <div style={{ marginBottom: '2rem' }}>
          <label style={{
            display: 'block',
            marginBottom: '0.5rem',
            fontWeight: '500'
          }}>
            Playlist Name
          </label>
          <input
            type="text"
            value={playlistName}
            onChange={(e) => setPlaylistName(e.target.value)}
            placeholder="Enter playlist name..."
            style={{
              width: '100%',
              padding: '0.75rem',
              backgroundColor: '#282828',
              border: '1px solid #3E3E3E',
              borderRadius: '0.5rem',
              color: '#FFFFFF',
              fontSize: '1rem'
            }}
          />
        </div>

        {/* Search */}
        <div style={{ marginBottom: '2rem' }}>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search songs..."
            style={{
              width: '100%',
              padding: '0.75rem',
              backgroundColor: '#282828',
              border: '1px solid #3E3E3E',
              borderRadius: '0.5rem',
              color: '#FFFFFF',
              fontSize: '1rem'
            }}
          />
        </div>

        {/* Selected songs counter */}
        <div style={{
          marginBottom: '1rem',
          padding: '0.75rem',
          backgroundColor: '#1DB954',
          borderRadius: '0.5rem',
          textAlign: 'center'
        }}>
          {selectedSongs.length} songs selected
        </div>

        {/* Songs list */}
        {isLoading ? (
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            Loading songs...
          </div>
        ) : (
          <div style={{
            backgroundColor: '#181818',
            borderRadius: '0.5rem',
            padding: '1rem'
          }}>
            <h2 style={{
              fontSize: '1.25rem',
              marginBottom: '1rem',
              color: '#FFFFFF'
            }}>
              Available Songs
            </h2>

            {filteredSongs.length === 0 ? (
              <p style={{ color: '#B3B3B3', textAlign: 'center', padding: '2rem' }}>
                No songs found
              </p>
            ) : (
              <div style={{
                display: 'grid',
                gap: '0.5rem',
                maxHeight: '400px',
                overflowY: 'auto'
              }}>
                {filteredSongs.map(song => (
                  <div
                    key={song.id}
                    onClick={() => handleSongToggle(song.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      padding: '0.75rem',
                      backgroundColor: selectedSongs.includes(song.id) ? '#1DB954' : '#282828',
                      borderRadius: '0.5rem',
                      cursor: 'pointer',
                      transition: 'background-color 0.2s'
                    }}
                  >
                    <div style={{
                      width: '20px',
                      height: '20px',
                      backgroundColor: selectedSongs.includes(song.id) ? '#FFFFFF' : 'transparent',
                      border: '2px solid #FFFFFF',
                      borderRadius: '0.25rem',
                      marginRight: '1rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      {selectedSongs.includes(song.id) && (
                        <span style={{ color: '#1DB954', fontSize: '0.75rem' }}>✓</span>
                      )}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: '500', marginBottom: '0.25rem' }}>
                        {song.title}
                      </div>
                      <div style={{ color: '#B3B3B3', fontSize: '0.875rem' }}>
                        {song.artist} • {song.album}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Create button */}
        <div style={{
          marginTop: '2rem',
          display: 'flex',
          justifyContent: 'center'
        }}>
          <button
            onClick={handleCreatePlaylist}
            disabled={isLoading || !playlistName.trim() || selectedSongs.length === 0}
            style={{
              padding: '0.75rem 2rem',
              backgroundColor: (!playlistName.trim() || selectedSongs.length === 0) ? '#3E3E3E' : '#1DB954',
              border: 'none',
              borderRadius: '2rem',
              color: '#FFFFFF',
              fontSize: '1rem',
              fontWeight: '500',
              cursor: (!playlistName.trim() || selectedSongs.length === 0) ? 'not-allowed' : 'pointer',
              opacity: isLoading ? 0.7 : 1
            }}
          >
            {isLoading ? 'Creating...' : 'Create Playlist'}
          </button>
        </div>
      </div>
    </div>
  );
}

