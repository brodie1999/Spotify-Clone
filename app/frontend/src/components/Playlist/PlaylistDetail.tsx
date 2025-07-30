//@ts-ignore
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
    getPlaylistDetails,
    updatePlaylist,
    deletePlaylist,
    getSongs,
    addSongToPlaylist,
    deleteSongFromPlaylist,
    Song,
    PlaylistDetail as PlaylistDetailType
} from "../../api";
import LikeButton from "../LikeButton";
import { useMusicPlayer } from "../../contexts/MusicPlayerContext";

export default function PlaylistDetail() {
    const { playlistId } = useParams<{ playlistId: string }>();
    const navigate = useNavigate();
    const { playSong, currentSong, isPlaying, pauseMusic, resumeMusic, setPlaylist } = useMusicPlayer();

    const [playlist, setIsPlaylist] = useState<PlaylistDetailType | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [editName, setEditName] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showAddSongs, setShowAddSongs] = useState(false);
    const [availableSongs, setAvailableSongs] = useState<Song[]>([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [openDropdown, setOpenDropdown] = useState<number | null>(null);
    const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
    const [hoveredSong, setHoveredSong] = useState<number | null>(null);
    // Added a key to force LikeButton re-render when songs change
    const [likeButtonKey , setLikeButtonKey] = useState(0);

    useEffect(() => {
        if (playlistId) {
            loadPlaylistDetails();
        }
    }, [playlistId]);

    const loadPlaylistDetails = async () => {
        try {
            setIsLoading(true);
            setError(null);

            const details = await getPlaylistDetails(Number(playlistId));

            console.log('Playlist details recieved:', details);
            console.log('Songs in playlist:', details.songs?.map(song => ({
                id: song.id,
                title: song.title,
                source: song.source,
                youtube_id: song.youtube_id,
                youtube_audio_url: song.youtube_audio_url,
            })));

            const playlistDetail: PlaylistDetailType = {
                ...details,
                songs: details.songs || [] // provide empty array if song is undefined.
            }

            setIsPlaylist(playlistDetail);
            setEditName(details.name);
        } catch (err: any) {
            setError(err.message || "Failed to load playlist details");
        } finally {
            setIsLoading(false);
        }
    }; // End of loadPlaylistDetails

    const loadAvailableSongs = async () => {
        try {
            const songs = await getSongs();
            // filter out any songs in the playlist
            const playlistSongIds = playlist?.songs?.map(s => s.id) || [];
            const filtered = songs.filter(song => !playlistSongIds.includes(song.id));
            setAvailableSongs(filtered);
        } catch (err: any) {
            setError(err.message || "Failed to load songs");
        }
    }; // End of loadAvailable Songs

    const handleEditName = async () => {
        if (!playlist || !editName.trim()) return;

        try {
            const updated_playlist = await updatePlaylist(playlist.id, editName.trim());
            setIsPlaylist({
                ...updated_playlist,
                songs: playlist.songs // Keep existing songs
            });
            setIsEditing(false);
            setError(null);
        } catch (err: any) {
            setError(err.message || "Failed to update playlist");
        }
    }; // End of handleEditName

    const handleDeletePlaylist = async () => {
        if (!playlist) return;

        try {
            await deletePlaylist(playlist.id);
            navigate('/dashboard');
        } catch (err: any) {
            setError(err.message || "Failed to delete playlist");
        }
    }; // End of handleDeletePlaylist

    const handleDeleteClick = () => {
        setShowDeleteConfirmation(true);
    }

    const handleCancelDelete = () => {
        setShowDeleteConfirmation(false);
    }

    // Using string literals to help with determining a songs source
    const determineSource = (song: Song): "local" | "spotify" | "youtube" => {
        if (song.source) {
            return song.source;
        }

        if (song.youtube_id && song.youtube_id.length > 0) {
            return 'youtube'
        }
        return 'local'
    }

    const handlePlaySong = (song: Song) => {

        // Set the current playlist context with ORIGINAL sources preserved
        if (playlist?.songs) {
            const songsSource = playlist.songs.map(s => ({
                ...s,
                source: determineSource(s)
            }));

            console.log('Playlist songs with preserved sources:', songsSource);
            setPlaylist(songsSource, songsSource.findIndex(s => s.id === song.id));
        }

        const songToPlay = {
            ...song,
            source: determineSource(song)
        };

        if (currentSong?.id === song.id && isPlaying) {
            pauseMusic();
        } else if (currentSong?.id === song.id && !isPlaying) {
            resumeMusic();
        } else {
            playSong(songToPlay);
        }
    };

    const handleAddSong = async (songId: number) => {
        if (!playlist) return;

        try {
            await addSongToPlaylist(playlist.id, songId);
            // Reload the playlist to show the new song being added
            await loadPlaylistDetails();
            // Remove the added song from the available songs
            setAvailableSongs(prev => prev.filter(song => song.id !== songId));
            setError(null)
        } catch (err: any) {
            setError(err.message || "Failed to add song");
        }
    }; // End of handleAddSong

    const handleRemoveSong = async (songId: number) => {
        if (!playlist) return;

        try {
            // Call API to remove song from playlist
            await deleteSongFromPlaylist(playlist.id, songId);
            // Update local state to remove the song
            setIsPlaylist(prev => prev ? {
                ...prev,
                songs: prev.songs.filter(song => song.id !== songId)
            } : null);
            setOpenDropdown(null)
            setError(null)
        } catch (err: any) {
            setError(err.message || `Failed to delete song from ${playlist.id}`);
        }
    };

    const handleLikeChange = (songId: number, liked:boolean) => {
        if (!liked && playlist?.is_liked_songs) {
            setIsPlaylist(prev => prev ? {
                ...prev,
                songs: prev.songs.filter(song => song.id !== songId)
            } : null);
        }
    };

    // Close Dropdown when clicking outside the area
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            setOpenDropdown(null);
            setShowDeleteConfirmation(false);
        }

        if (openDropdown !== null || showDeleteConfirmation) {
            document.addEventListener("click", handleClickOutside);
            return () => document.removeEventListener("click", handleClickOutside);
        }
    }, [openDropdown, showDeleteConfirmation]);

    const handleShowAddSongs = () => {
        setShowAddSongs(true)
        loadAvailableSongs();
    };

    const filteredAvailableSongs = availableSongs.filter(song =>
        song.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        song.artist.toLowerCase().includes(searchTerm.toLowerCase()) ||
        song.album.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const formatDuration = (duration?: number) => {
        if (!duration) return '--:--';
        const minutes = Math.floor(duration / 60);
        const seconds = Math.floor(duration % 60);
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    };

    if (isLoading) {
        return (
            <div style={{
                minHeight: "100vh",
                backgroundColor: "#121212",
                color: '#FFFFFF',
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
            }}>
                <div style={{ fontSize: '1.2rem' }}>Loading playlist...</div>
            </div>
        );
    } // End of isLoading

    if (!playlist) {
        return (
            <div style={{
                minHeight: "100vh",
                backgroundColor: "#121212",
                color: '#FFFFFF',
                display: "flex",
                alignItems: "center",
                justifyContent: "center"

            }}>
                <div style={{ fontSize: '1.2rem', color: '#B91C1C'}}>Playlist not found</div>
            </div>
        );
    }// End of playlist

  return (
      <div style={{
          minHeight: '100vh',
          backgroundColor: '#121212',
          color: '#FFFFFF',
          fontFamily: 'sans-serif',
          paddingBottom: currentSong ? '120px' : '2rem', // Space for bottom music player
          display: 'flex',
          flexDirection: 'column'
        }}>
          {/* Header - Fixed */}
          <div style={{
            backgroundColor: '#282828',
            padding: '1rem 2rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexShrink: 0 // Prevent shrinking
          }}>
            <button
              onClick={() => navigate('/dashboard')}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: '#3E3E3E',
                border: 'none',
                borderRadius: '0.5rem',
                color: '#FFFFFF',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
            >
              ← Back to Dashboard
            </button>

            <div style={{ position: 'relative' }}>
              {!playlist.is_liked_songs && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteClick();
                  }}
                  style={{
                    padding: '0.5rem 1rem',
                    backgroundColor: '#B91C1C',
                    border: 'none',
                    borderRadius: '0.5rem',
                    color: '#FFFFFF',
                    cursor: 'pointer'
                  }}
                >
                  Delete Playlist
                </button>
              )}

              {/* Delete Confirmation Dropdown - same as before */}
              {showDeleteConfirmation && !playlist.is_liked_songs && (
                <div
                  style={{
                    position: 'absolute',
                    top: '100%',
                    right: '0',
                    backgroundColor: '#282828',
                    border: '1px solid #3E3E3E',
                    borderRadius: '0.5rem',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
                    zIndex: 1000,
                    minWidth: '300px',
                    marginTop: '0.5rem',
                    padding: '1rem'
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <div style={{ marginBottom: '0.75rem' }}>
                    <div style={{
                      fontSize: '1rem',
                      fontWeight: '500',
                      color: '#FFFFFF',
                      marginBottom: '0.5rem'
                    }}>
                      Delete "{playlist?.name}"?
                    </div>
                    <div style={{
                      fontSize: '0.875rem',
                      color: '#B3B3B3',
                      lineHeight: '1.4'
                    }}>
                      This action cannot be undone. All songs will be removed from this playlist.
                    </div>
                  </div>

                  <div style={{
                    display: 'flex',
                    gap: '0.5rem',
                    justifyContent: 'flex-end'
                  }}>
                    <button
                      onClick={handleCancelDelete}
                      style={{
                        padding: '0.5rem 1rem',
                        backgroundColor: '#3E3E3E',
                        border: 'none',
                        borderRadius: '0.5rem',
                        color: '#FFFFFF',
                        cursor: 'pointer',
                        fontSize: '0.875rem'
                      }}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleDeletePlaylist}
                      style={{
                        padding: '0.5rem 1rem',
                        backgroundColor: '#B91C1C',
                        border: 'none',
                        borderRadius: '0.5rem',
                        color: '#FFFFFF',
                        cursor: 'pointer',
                        fontSize: '0.875rem',
                        fontWeight: '500'
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Scrollable Content Area */}
          <div style={{
            flex: 1,
            overflow: 'auto',
            padding: '2rem',
            minHeight: 0 // Important for flex children with overflow
          }}>
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

            {/* Playlist Header */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '1rem',
              marginBottom: '2rem'
            }}>
              <div style={{
                width: '200px',
                height: '200px',
                backgroundColor: playlist.is_liked_songs ? '#1DB954' : '#282828',
                borderRadius: '0.5rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '4rem',
                color: playlist.is_liked_songs ? '#FFFFFF' : '#B3B3B3'
              }}>
                {playlist.is_liked_songs ? '💚' : '🎵'}
              </div>

              <div>
                <p style={{ color: '#B3B3B3', margin: 0, fontSize: '0.875rem' }}>PLAYLIST</p>

                {isEditing && !playlist.is_liked_songs ? (
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginTop: '0.5rem' }}>
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      style={{
                        fontSize: '2rem',
                        fontWeight: 'bold',
                        backgroundColor: '#282828',
                        border: '1px solid #3E3E3E',
                        borderRadius: '0.5rem',
                        color: '#FFFFFF',
                        padding: '0.5rem'
                      }}
                      autoFocus
                    />
                    <button
                      onClick={handleEditName}
                      style={{
                        padding: '0.5rem 1rem',
                        backgroundColor: '#1DB954',
                        border: 'none',
                        borderRadius: '0.5rem',
                        color: '#FFFFFF',
                        cursor: 'pointer'
                      }}
                    >
                      Save
                    </button>
                    <button
                      onClick={() => {
                        setIsEditing(false);
                        setEditName(playlist.name);
                      }}
                      style={{
                        padding: '0.5rem 1rem',
                        backgroundColor: '#3E3E3E',
                        border: 'none',
                        borderRadius: '0.5rem',
                        color: '#FFFFFF',
                        cursor: 'pointer'
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <h1
                    style={{
                      fontSize: '2rem',
                      fontWeight: 'bold',
                      margin: '0.5rem 0',
                      cursor: playlist.is_liked_songs ? 'default' : 'pointer'
                    }}
                    onClick={() => !playlist.is_liked_songs && setIsEditing(true)}
                  >
                    {playlist.name}
                  </h1>
                )}

                <p style={{ color: '#B3B3B3', margin: 0 }}>
                  {playlist.songs?.length || 0} song{(playlist.songs?.length || 0) !== 1 ? 's' : ''}
                </p>
              </div>
            </div>

            {/* Songs List */}
            <div style={{
              backgroundColor: '#181818',
              borderRadius: '0.5rem',
              padding: '1rem',
              marginBottom: '2rem'
            }}>
              {/* Songs header */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: '40px 1fr 1fr 40px 60px 40px',
                gap: '1rem',
                padding: '0.75rem',
                borderBottom: '1px solid #282828',
                marginBottom: '1rem',
                color: '#B3B3B3',
                fontSize: '0.875rem',
                fontWeight: '500'
              }}>
                <div>#</div>
                <div>TITLE</div>
                <div>ALBUM</div>
                <div></div>
                <div>⏱️</div>
                <div></div>
              </div>

              {!playlist.songs || playlist.songs.length === 0 ? (
                <p style={{ color: '#B3B3B3', textAlign: 'center', padding: '2rem' }}>
                  No songs in this playlist yet. Add some songs to get started!
                </p>
              ) : (
                <div style={{
                  display: 'grid',
                  gap: '0.5rem'
                }}>
                  {playlist.songs.map((song, index) => {
                    const isCurrentSong = currentSong?.id === song.id;
                    return (
                      <div
                        key={song.id}
                        style={{
                          display: 'grid',
                          gridTemplateColumns: '40px 1fr 1fr 40px 60px 40px',
                          gap: '1rem',
                          alignItems: 'center',
                          padding: '0.75rem',
                          backgroundColor: isCurrentSong ? 'rgba(29, 185, 84, 0.1)' : 'transparent',
                          borderRadius: '0.5rem',
                          position: 'relative',
                          transition: 'background-color 0.2s ease'
                        }}
                        onMouseEnter={() => setHoveredSong(song.id)}
                        onMouseLeave={() => setHoveredSong(null)}
                        onMouseOver={(e) => {
                          if (!isCurrentSong) {
                            e.currentTarget.style.backgroundColor = '#282828';
                          }
                        }}
                        onMouseOut={(e) => {
                          if (!isCurrentSong) {
                            e.currentTarget.style.backgroundColor = 'transparent';
                          }
                        }}
                      >
                        {/* Your existing song row content here - same as before */}
                        {/* Track number / Play button */}
                        <div style={{
                          position: 'relative',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}>
                          {hoveredSong === song.id || isCurrentSong ? (
                            <button
                              onClick={() => handlePlaySong(song)}
                              style={{
                                width: '24px',
                                height: '24px',
                                borderRadius: '50%',
                                backgroundColor: 'transparent',
                                border: 'none',
                                color: isCurrentSong ? '#1DB954' : '#FFFFFF',
                                cursor: 'pointer',
                                fontSize: '12px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                transition: 'all 0.2s ease'
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.transform = 'scale(1.1)';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.transform = 'scale(1)';
                              }}
                            >
                              {isCurrentSong && isPlaying ? '⏸️' : '▶️'}
                            </button>
                          ) : (
                            <span style={{
                              color: isCurrentSong ? '#1DB954' : '#B3B3B3',
                              fontSize: '0.875rem'
                            }}>
                              {index + 1}
                            </span>
                          )}
                        </div>

                        {/* Song title and artist */}
                        <div>
                          <div style={{
                            fontWeight: '500',
                            marginBottom: '0.25rem',
                            color: isCurrentSong ? '#1DB954' : '#FFFFFF',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem'
                          }}>
                            {song.title}
                            {isCurrentSong && isPlaying && (
                              <span style={{
                                fontSize: '12px',
                                animation: 'pulse 1.5s infinite'
                              }}>
                                🔊
                              </span>
                            )}
                          </div>
                          <div style={{ color: '#B3B3B3', fontSize: '0.875rem' }}>
                            {song.artist}
                          </div>
                        </div>

                        {/* Album */}
                        <div style={{ color: '#B3B3B3', fontSize: '0.875rem' }}>
                          {song.album}
                        </div>

                        {/* LIKE BUTTON */}
                        <LikeButton
                            key={`${song.id}-${likeButtonKey}`}
                            songId={song.id}
                            onLikeChange={(liked) => handleLikeChange(song.id, liked)}
                        />

                        {/* Duration */}
                        <div style={{
                          color: '#B3B3B3',
                          fontSize: '0.875rem',
                          textAlign: 'center'
                        }}>
                          {formatDuration(song.duration)}
                        </div>

                        {/* Three dots menu */}
                        <div style={{ position: 'relative' }}>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setOpenDropdown(openDropdown === song.id ? null : song.id);
                            }}
                            style={{
                              padding: '0.5rem',
                              backgroundColor: 'transparent',
                              border: 'none',
                              color: '#B3B3B3',
                              cursor: 'pointer',
                              fontSize: '1.2rem',
                              borderRadius: '50%',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              width: '32px',
                              height: '32px',
                              fontWeight: 'bold',
                              lineHeight: '1',
                              letterSpacing: '2px'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = '#3E3E3E';
                              e.currentTarget.style.color = '#FFFFFF';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = 'transparent';
                              e.currentTarget.style.color = '#B3B3B3';
                            }}
                          >
                            ⋯
                          </button>

                          {/* Dropdown menu */}
                          {openDropdown === song.id && (
                            <div
                              style={{
                                position: 'absolute',
                                top: '0',
                                right: '100%',
                                backgroundColor: '#282828',
                                border: '1px solid #3E3E3E',
                                borderRadius: '0.5rem',
                                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
                                zIndex: 1000,
                                minWidth: '180px',
                                marginRight: '0.5rem'
                              }}
                              onClick={(e) => e.stopPropagation()}
                            >
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleRemoveSong(song.id);
                                }}
                                style={{
                                  width: '100%',
                                  padding: '0.75rem 1rem',
                                  backgroundColor: 'transparent',
                                  border: 'none',
                                  color: '#FFFFFF',
                                  cursor: 'pointer',
                                  textAlign: 'left',
                                  fontSize: '0.875rem',
                                  borderRadius: '0.5rem',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '0.5rem'
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.backgroundColor = '#B91C1C';
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.backgroundColor = 'transparent';
                                }}
                              >
                                Remove from playlist
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Add Songs Section - Now with proper scrolling */}
            {showAddSongs && (
              <div style={{
                backgroundColor: '#181818',
                borderRadius: '0.5rem',
                padding: '1rem',
                marginBottom: '2rem',
                maxHeight: '60vh', // Limit height
                display: 'flex',
                flexDirection: 'column'
              }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '1rem',
                  flexShrink: 0 // Prevent shrinking
                }}>
                  <h2 style={{ fontSize: '1.25rem', margin: 0 }}>Add Songs</h2>
                  <button
                    onClick={() => setShowAddSongs(false)}
                    style={{
                      padding: '0.5rem',
                      backgroundColor: '#3E3E3E',
                      border: 'none',
                      borderRadius: '0.5rem',
                      color: '#FFFFFF',
                      cursor: 'pointer'
                    }}
                  >
                    ✕
                  </button>
                </div>

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
                    fontSize: '1rem',
                    marginBottom: '1rem',
                    flexShrink: 0, // Prevent shrinking
                    boxSizing: 'border-box'
                  }}
                />

                {/* Scrollable songs list */}
                <div style={{
                  flex: 1,
                  overflowY: 'auto',
                  display: 'grid',
                  gap: '0.5rem',
                  minHeight: 0, // Important for flex children with overflow
                  paddingRight: '0.5rem' // Space for scrollbar
                }}>
                  {filteredAvailableSongs.length === 0 ? (
                    <p style={{ color: '#B3B3B3', textAlign: 'center', padding: '2rem' }}>
                      No songs available to add
                    </p>
                  ) : (
                    filteredAvailableSongs.map(song => (
                      <div
                        key={song.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          padding: '0.75rem',
                          backgroundColor: '#282828',
                          borderRadius: '0.5rem',
                          gap: '1rem'
                        }}
                      >
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: '500', marginBottom: '0.25rem' }}>
                            {song.title}
                          </div>
                          <div style={{ color: '#B3B3B3', fontSize: '0.875rem' }}>
                            {song.artist} • {song.album}
                          </div>
                        </div>

                        <button
                          onClick={() => handleAddSong(song.id)}
                          style={{
                            padding: '0.5rem 1rem',
                            backgroundColor: '#1DB954',
                            border: 'none',
                            borderRadius: '0.5rem',
                            color: '#FFFFFF',
                            cursor: 'pointer',
                            fontSize: '0.875rem'
                          }}
                        >
                          Add
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Add Songs Button - Fixed position */}
          {!showAddSongs && (
            <div style={{
              position: 'fixed',
              bottom: currentSong ? '140px' : '2rem', // Adjust for music player
              right: '2rem',
              zIndex: 100
            }}>
              <button
                onClick={handleShowAddSongs}
                style={{
                  width: '60px',
                  height: '60px',
                  borderRadius: '50%',
                  backgroundColor: '#1DB954',
                  border: 'none',
                  color: '#FFFFFF',
                  fontSize: '2rem',
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                +
              </button>
            </div>
          )}

          {/* CSS animations */}
          <style>{`
            @keyframes pulse {
              0%, 100% { opacity: 1; }
              50% { opacity: 0.5; }
            }
            
            /* Custom scrollbar styling */
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
