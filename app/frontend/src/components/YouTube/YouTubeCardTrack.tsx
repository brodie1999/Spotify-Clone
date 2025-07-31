//@ts-ignore
import React, { useState } from 'react';
import { YouTubeTrack, Playlist, addYouTubeTrackToPlaylist,  addYouTubeTrackToLiked } from "../../api";
import { ensureFreshYouTubeUrl, isYouTubeUrlExpired } from "../../utils/youtubeUrlUtils";

interface YouTubeTrackCardProps {
    id: string;
    track?: YouTubeTrack;
    trackIndex: number;
    onPlay: (track: YouTubeTrack, index: number, fromTrending?: boolean) => void;
    playlists: Playlist[];
    currentSong?: any;
    isPlaying: boolean;
    pauseMusic: () => void;
    resumeMusic: () => void;
    fromTrending?: boolean;
}

export default function YouTubeTrackCard({
    id,
    track,
    trackIndex,
    onPlay,
    playlists,
    currentSong,
    isPlaying,
    pauseMusic,
    resumeMusic,
    fromTrending = false
}: YouTubeTrackCardProps) {
    const [showAddMenu, setShowAddMenu] = useState(false);
    const [isAdding, setIsAdding] = useState(false);
    const [addStatus, setAddStatus] = useState<string | null>(null);
    const [isLoadingPlay, setIsLoadingPlay] = useState(false);

    const isCurrentTrack = currentSong && currentSong.youtube_id === track.youtube_id;

    const handlePlayWithFreshURL = async () => {
        if (!track) return;

        setIsLoadingPlay(true);

        try {
            // Check if we need fresh URL
            let trackToPlay = { ...track };

            if (!track.youtube_audio_url || isYouTubeUrlExpired(track.youtube_audio_url)) {
                console.log('Track URL expired or missing, fetching fresh URL...')

                // Fetch fresh URL
                const response = await fetch(`http://localhost:8002/api/discover/youtube/audio/${track.youtube_id}`,{
                    headers: {
                        'Authorization' : `Bearer ${localStorage.getItem('token')}`
                    }
                });

                if (response.ok) {
                    const { audio_url } = await response.json();
                    trackToPlay = { ...track, youtube_audio_url: audio_url}
                    console.log('Fresh URL obtained for playback')
                } else {
                    console.error('Failed to get fresh URL, trying with existing URL')
                }
            }
            onPlay(trackToPlay, trackIndex, fromTrending);
        } catch (err) {
            console.error('Error handling play with fresh URL:', err);
            // Fallback to original onPlay
            onPlay(track, trackIndex, fromTrending);
        } finally {
            setIsLoadingPlay(false);
        }
    };

    const handleAddToPlaylist = async (playlistId: number, playlistName: string) => {
        if (!track) return;

        setIsAdding(true);
        try {
            // Ensure we have a fresh URL before adding to playlist
            const trackWithFreshUrl = await ensureFreshYouTubeUrl(track);
            await addYouTubeTrackToPlaylist(trackWithFreshUrl, playlistId);
            setAddStatus(`Added to "${playlistName}"`);
            setTimeout(() => setAddStatus(null), 3000);
        } catch (error: any) {
            const errorMessage = error?.message || error?.toString() || 'Failed to add to playlist'
            setAddStatus(errorMessage)
            setTimeout(() => setAddStatus(null), 3000);
        } finally {
            setIsAdding(false);
            setShowAddMenu(false);
        }
    };

    const handleAddToLiked = async () => {
        setIsAdding(true);
        try {
            console.log('Track data being sent: ', track);
            await addYouTubeTrackToLiked(track)
            setAddStatus('Added to Liked Songs');
            setTimeout(() => setAddStatus(null), 3000);
        } catch (error: any) {
            const errorMessage = error?.message || error?.toString() || 'Failed to add to playlist'
            setAddStatus(errorMessage)
            setTimeout(() => setAddStatus(null), 3000);
        } finally {
            setIsAdding(false);
            setShowAddMenu(false);
        }
    };

    return (
    <div
      style={{
        backgroundColor: "#282828",
        borderRadius: "12px",
        padding: "1rem",
        display: "flex",
        alignItems: "center",
        gap: "1rem",
        transition: "all 0.2s ease",
        cursor: "pointer",
        position: "relative"
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = "#404040";
        e.currentTarget.style.transform = "translateY(-2px)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = "#282828";
        e.currentTarget.style.transform = "translateY(0)";
      }}
      onClick={() => onPlay(track, trackIndex, fromTrending)}
    >
      {/* Status message */}
      {addStatus && (
        <div
          style={{
            position: "absolute",
            top: "-40px",
            left: "50%",
            transform: "translateX(-50%)",
            backgroundColor: addStatus.includes('Failed') ? "#B91C1C" : "#1DB954",
            color: "#FFFFFF",
            padding: "0.5rem 1rem",
            borderRadius: "6px",
            fontSize: "0.875rem",
            zIndex: 1000,
            whiteSpace: "nowrap",
            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.3)"
          }}
        >
          {addStatus}
        </div>
      )}

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
          fontSize: "0.95rem",
          color: isCurrentTrack ? "#1DB954" : "#FFFFFF"
        }}>
          {track.title}
          {isCurrentTrack && isPlaying && (
            <span style={{
              marginLeft: "8px",
              fontSize: "12px",
              animation: "pulse 1.5s infinite"
            }}>
              🔊
            </span>
          )}
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

      {/* Add to playlist button */}
      <div style={{ position: "relative" }}>
        <button
          onClick={(e) => {
            e.stopPropagation();
            setShowAddMenu(!showAddMenu);
          }}
          disabled={isAdding}
          style={{
            width: "36px",
            height: "36px",
            borderRadius: "50%",
            backgroundColor: "#1DB954",
            border: "none",
            color: "#FFFFFF",
            cursor: isAdding ? "not-allowed" : "pointer",
            fontSize: "18px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "all 0.2s ease",
            boxShadow: "0 4px 12px rgba(29, 185, 84, 0.3)",
            opacity: isAdding ? 0.6 : 1
          }}
          onMouseEnter={(e) => {
            if (!isAdding) {
              e.currentTarget.style.transform = "scale(1.1)";
              e.currentTarget.style.boxShadow = "0 6px 16px rgba(29, 185, 84, 0.4)";
            }
          }}
          onMouseLeave={(e) => {
            if (!isAdding) {
              e.currentTarget.style.transform = "scale(1)";
              e.currentTarget.style.boxShadow = "0 4px 12px rgba(29, 185, 84, 0.3)";
            }
          }}
        >
          {isAdding ? "⏳" : "➕"}
        </button>

        {/* Add menu dropdown */}
        {showAddMenu && (
          <div
            style={{
              position: "absolute",
              top: "100%",
              right: "0",
              marginTop: "8px",
              backgroundColor: "#282828",
              border: "1px solid #404040",
              borderRadius: "8px",
              boxShadow: "0 8px 25px rgba(0, 0, 0, 0.4)",
              zIndex: 1000,
              minWidth: "200px",
              maxHeight: "400px",
              overflowY: "auto",
              // Custom scrollbar styles
              scrollbarWidth: "thin",
              scrollbarColor: "#535353 transparent"
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Add to Liked Songs */}
            <button
              onClick={handleAddToLiked}
              disabled={isAdding}
              style={{
                    width: "100%",
                    padding: "0.75rem 1rem",
                    backgroundColor: "transparent",
                    border: "none",
                    color: "#FFFFFF",
                    cursor: isAdding ? "not-allowed" : "pointer",
                    textAlign: "left",
                    fontSize: "0.875rem",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    borderRadius: "6px",
                    flexShrink: 0
              }}
              onMouseEnter={(e) => {
                if (!isAdding) {
                  e.currentTarget.style.backgroundColor = "#404040";
                }
              }}
              onMouseLeave={(e) => {
                if (!isAdding) {
                  e.currentTarget.style.backgroundColor = "transparent";
                }
              }}
            >
              <span>💚</span>
              Add to Liked Songs
            </button>

            {/* Divider */}
            <div style={{
                height: "1px",
                backgroundColor: "#404040",
                margin: "0.5rem 0",
                flexShrink: 0 // Prevent shrinking
            }} />

            {/* Playlists */}
            <div style={{
              padding: "0.5rem 1rem",
              color: "#B3B3B3",
              fontSize: "0.75rem",
              fontWeight: "500",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              flexShrink: 0, // Prevent shrinking
              position: "sticky", // Make header sticky
              top: 0,
              backgroundColor: "#282828",
              zIndex: 1
            }}>
              Add to Playlist
            </div>

            {/* Scrollable Playlists Container */}
            <div style={{
                maxHeight: "250px", // Limit the playlists section height
                overflowY: "auto",
                // Better scrollbar styling for webkit browsers
            }}>
            {playlists
              .filter(playlist => !playlist.is_liked_songs)
              .map((playlist) => (
                <button
                  key={playlist.id}
                  onClick={() => handleAddToPlaylist(playlist.id, playlist.name)}
                  disabled={isAdding}
                  style={{
                    width: "100%",
                    padding: "0.75rem 1rem",
                    backgroundColor: "transparent",
                    border: "none",
                    color: "#FFFFFF",
                    cursor: isAdding ? "not-allowed" : "pointer",
                    textAlign: "left",
                    fontSize: "0.875rem",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    borderRadius: "6px"
                  }}
                  onMouseEnter={(e) => {
                    if (!isAdding) {
                      e.currentTarget.style.backgroundColor = "#404040";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isAdding) {
                      e.currentTarget.style.backgroundColor = "transparent";
                    }
                  }}
                >
                  <span>🎵</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap"
                    }}>
                      {playlist.name}
                    </div>
                    <div style={{
                      color: "#B3B3B3",
                      fontSize: "0.75rem",
                      marginTop: "2px"
                    }}>
                      {playlist.songCount || 0} songs
                    </div>
                  </div>
                </button>
              ))}

            {playlists.filter(p => !p.is_liked_songs).length === 0 && (
              <div style={{
                padding: "1rem",
                textAlign: "center",
                color: "#B3B3B3",
                fontSize: "0.875rem"
              }}>
                No playlists available
              </div>
            )}
          </div>
          </div>
        )}
      </div>

      {/* Play button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          if (isCurrentTrack && isPlaying) {
            pauseMusic();
          } else if (isCurrentTrack && !isPlaying) {
            resumeMusic();
          } else {
            onPlay(track, trackIndex, fromTrending);
          }
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
        {isCurrentTrack && isPlaying ? '⏸️' : '▶️'}
      </button>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        
        /* Custom scrollbar for dropdown menu */ 
        dv[style*="overflow:auto"]::-webkit-scrollbar {
            width: 6px;
        }
        
        div[style*="overflowY: auto"]::-webkit-scrollbar-track {
            background: transparent;
        }

        div[style*="overflowY: auto"]::-webkit-scrollbar-thumb {
            background: #535353;
            border-radius: 3px;
        }

        div[style*="overflowY: auto"]::-webkit-scrollbar-thumb:hover {
            background: #727272;
        }

        /* Firefox scrollbar */
        div[style*="overflowY: auto"] {
            scrollbar-width: thin;
            scrollbar-color: #535353 transparent;
        }
      `}</style>
    </div>
  );
}