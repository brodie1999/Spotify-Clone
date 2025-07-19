// app/frontend/src/components/PlaylistSongCard.tsx
// @ts-ignore
import React, { useState } from 'react';
import LikeButton from './LikeButton';
import { useMusicPlayer } from '../contexts/MusicPlayerContext';

interface Song {
    id: number;
    title: string;
    artist: string;
    album: string;
    duration?: number;
    artwork_path?: string;
}

interface PlaylistSongCardProps {
    song: Song;
    index: number;
    onRemove?: (songId: number) => void;
    onLikeChange?: (songId: number, liked: boolean) => void;
}

export default function PlaylistSongCard({
    song,
    index,
    onRemove,
    onLikeChange
}: PlaylistSongCardProps) {
    const { playSong, currentSong, isPlaying } = useMusicPlayer();
    const [showMenu, setShowMenu] = useState(false);

    const isCurrentSong = currentSong?.id === song.id;

    const handlePlayClick = () => {
        playSong(song);
    };

    return (
        <div style={{
            display: 'flex',
            alignItems: 'center',
            padding: '8px 16px',
            borderRadius: '4px',
            backgroundColor: isCurrentSong ? 'rgba(29, 185, 84, 0.1)' : 'transparent',
            transition: 'background-color 0.3s ease',
            position: 'relative',
            minHeight: '56px'
        }}
        onMouseEnter={(e) => {
            if (!isCurrentSong) {
                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
            }
        }}
        onMouseLeave={(e) => {
            if (!isCurrentSong) {
                e.currentTarget.style.backgroundColor = 'transparent';
            }
        }}
        >
            {/* Track Number / Play Button */}
            <div style={{
                width: '20px',
                textAlign: 'center',
                marginRight: '16px',
                position: 'relative'
            }}>
                <span style={{
                    color: isCurrentSong ? '#1DB954' : '#A7A7A7',
                    fontSize: '14px',
                    fontWeight: '400'
                }}>
                    {index + 1}
                </span>

                {/* Play button overlay */}
                <button
                    onClick={handlePlayClick}
                    style={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        width: '16px',
                        height: '16px',
                        borderRadius: '50%',
                        backgroundColor: 'transparent',
                        border: 'none',
                        color: '#FFFFFF',
                        cursor: 'pointer',
                        fontSize: '10px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        opacity: 0,
                        transition: 'opacity 0.2s ease'
                    }}
                    className="play-button"
                    onMouseEnter={(e) => {
                        e.currentTarget.style.opacity = '1';
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.opacity = '0';
                    }}
                >
                    {isCurrentSong && isPlaying ? '⏸️' : '▶️'}
                </button>
            </div>

            {/* Song Title */}
            <div style={{
                flex: '1',
                marginRight: '16px'
            }}>
                <div style={{
                    color: isCurrentSong ? '#1DB954' : '#FFFFFF',
                    fontSize: '16px',
                    fontWeight: '400',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    marginBottom: '4px'
                }}>
                    {song.title}
                    {isCurrentSong && isPlaying && (
                        <span style={{
                            marginLeft: '8px',
                            fontSize: '12px',
                            animation: 'pulse 1.5s infinite'
                        }}>
                            🔊
                        </span>
                    )}
                </div>
                <div style={{
                    color: '#A7A7A7',
                    fontSize: '14px',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                }}>
                    {song.artist}
                </div>
            </div>

            {/* Album */}
            <div style={{
                flex: '1',
                marginRight: '16px',
                color: '#A7A7A7',
                fontSize: '14px',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
            }}>
                {song.album}
            </div>

            {/* Like Button */}
            <div style={{
                marginRight: '16px'
            }}>
                <LikeButton
                    songId={song.id}
                    onLikeChange={(liked) => onLikeChange?.(song.id, liked)}
                />
            </div>

            {/* Duration */}
            <div style={{
                width: '40px',
                textAlign: 'right',
                marginRight: '16px',
                color: '#A7A7A7',
                fontSize: '14px'
            }}>
                {song.duration ?
                    `${Math.floor(song.duration / 60)}:${String(Math.floor(song.duration % 60)).padStart(2, '0')}`
                    : '--:--'
                }
            </div>

            {/* Options Menu */}
            <div style={{ position: 'relative' }}>
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        setShowMenu(!showMenu);
                    }}
                    style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        backgroundColor: 'transparent',
                        border: 'none',
                        color: '#A7A7A7',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '16px',
                        transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
                        e.currentTarget.style.color = '#FFFFFF';
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                        e.currentTarget.style.color = '#A7A7A7';
                    }}
                >
                    ⋯
                </button>

                {/* Dropdown Menu */}
                {showMenu && onRemove && (
                    <div
                        style={{
                            position: 'absolute',
                            top: '100%',
                            right: '0',
                            backgroundColor: '#282828',
                            border: '1px solid #3E3E3E',
                            borderRadius: '4px',
                            boxShadow: '0 16px 24px rgba(0, 0, 0, 0.3)',
                            zIndex: 1000,
                            minWidth: '160px',
                            marginTop: '4px'
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onRemove(song.id);
                                setShowMenu(false);
                            }}
                            style={{
                                width: '100%',
                                padding: '12px 16px',
                                backgroundColor: 'transparent',
                                border: 'none',
                                color: '#FFFFFF',
                                cursor: 'pointer',
                                textAlign: 'left',
                                fontSize: '14px',
                                transition: 'background-color 0.2s ease'
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = 'transparent';
                            }}
                        >
                            Remove from this playlist
                        </button>
                    </div>
                )}
            </div>

            <style>{`
                @keyframes pulse {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.5; }
                }
                
                /* Show play button on hover */
                div:hover .play-button {
                    opacity: 1 !important;
                }
            `}</style>
        </div>
    );
}