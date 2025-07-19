// @ts-ignore
import React, { useState, useRef, useEffect } from 'react';
import { useMusicPlayer } from '../contexts/MusicPlayerContext';

export default function BottomMusicPlayer() {
    const { currentSong, isPlaying, pauseMusic, resumeMusic } = useMusicPlayer();

    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [volume, setVolume] = useState(1);
    const audioRef = useRef<HTMLAudioElement>(null);

    useEffect(() => {
        const audio = audioRef.current;
        if (!audio || !currentSong) return;

        const updateTime = () => setCurrentTime(audio.currentTime);
        const updateDuration = () => setDuration(audio.duration);
        const handleEnded = () => pauseMusic();

        audio.addEventListener('timeupdate', updateTime);
        audio.addEventListener('loadedmetadata', updateDuration);
        audio.addEventListener('ended', handleEnded);

        return () => {
            audio.removeEventListener('timeupdate', updateTime);
            audio.removeEventListener('loadedmetadata', updateDuration);
            audio.removeEventListener('ended', handleEnded);
        };
    }, [currentSong]);

    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;

        if (isPlaying) {
            audio.play().catch(console.error);
        } else {
            audio.pause();
        }
    }, [isPlaying]);

    const togglePlay = () => {
        if (isPlaying) {
            pauseMusic();
        } else {
            resumeMusic();
        }
    };

    const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
        const audio = audioRef.current;
        if (!audio) return;

        const newTime = (parseFloat(e.target.value) / 100) * duration;
        audio.currentTime = newTime;
        setCurrentTime(newTime);
    };

    const formatTime = (time: number) => {
        if (isNaN(time)) return '0:00';
        const minutes = Math.floor(time / 60);
        const seconds = Math.floor(time % 60);
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    };

    const progressPercentage = duration > 0 ? (currentTime / duration) * 100 : 0;

    if (!currentSong) return null;

    const artworkUrl = currentSong.artwork_path
        ? `http://localhost:8002/api/songs/${currentSong.id}/artwork`
        : null;

    return (
        <>
            {/* Audio element */}
            <audio
                ref={audioRef}
                src={`http://localhost:8002/api/songs/${currentSong.id}/stream`}
                volume={volume}
                preload="metadata"
            />

            {/* Fixed Bottom Player */}
            <div style={{
                position: 'fixed',
                bottom: '0',
                left: '0',
                right: '0',
                height: '90px',
                backgroundColor: '#181818',
                borderTop: '1px solid #282828',
                display: 'flex',
                alignItems: 'center',
                padding: '0 16px',
                zIndex: 1000,
                boxShadow: '0 -2px 10px rgba(0, 0, 0, 0.3)'
            }}>
                {/* Left: Song Info */}
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    width: '30%',
                    minWidth: '180px'
                }}>
                    {/* Artwork */}
                    <div style={{
                        width: '56px',
                        height: '56px',
                        borderRadius: '4px',
                        overflow: 'hidden',
                        backgroundColor: '#282828',
                        marginRight: '14px',
                        flexShrink: 0
                    }}>
                        {artworkUrl ? (
                            <img
                                src={artworkUrl}
                                alt="Album artwork"
                                style={{
                                    width: '100%',
                                    height: '100%',
                                    objectFit: 'cover'
                                }}
                            />
                        ) : (
                            <div style={{
                                width: '100%',
                                height: '100%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: '#535353',
                                fontSize: '1.5rem'
                            }}>
                                🎵
                            </div>
                        )}
                    </div>

                    {/* Song Info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{
                            color: '#FFFFFF',
                            fontSize: '14px',
                            fontWeight: '400',
                            marginBottom: '4px',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                        }}>
                            {currentSong.title}
                        </div>
                        <div style={{
                            color: '#B3B3B3',
                            fontSize: '12px',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                        }}>
                            {currentSong.artist}
                        </div>
                    </div>
                </div>

                {/* Center: Player Controls */}
                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    flex: 1,
                    maxWidth: '722px'
                }}>
                    {/* Controls */}
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        marginBottom: '8px'
                    }}>
                        <button
                            onClick={togglePlay}
                            style={{
                                width: '32px',
                                height: '32px',
                                borderRadius: '50%',
                                backgroundColor: '#FFFFFF',
                                border: 'none',
                                color: '#000000',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '12px',
                                transition: 'transform 0.1s ease'
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.transform = 'scale(1.06)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.transform = 'scale(1)';
                            }}
                        >
                            {isPlaying ? '⏸️' : '▶️'}
                        </button>
                    </div>

                    {/* Progress Bar */}
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        width: '100%',
                        gap: '12px'
                    }}>
                        <span style={{
                            color: '#A7A7A7',
                            fontSize: '11px',
                            minWidth: '40px',
                            textAlign: 'right'
                        }}>
                            {formatTime(currentTime)}
                        </span>

                        <div style={{
                            position: 'relative',
                            flex: 1,
                            height: '4px',
                            backgroundColor: '#5E5E5E',
                            borderRadius: '2px',
                            cursor: 'pointer'
                        }}>
                            <div style={{
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                height: '100%',
                                width: `${progressPercentage}%`,
                                backgroundColor: '#FFFFFF',
                                borderRadius: '2px'
                            }} />
                            <input
                                type="range"
                                min="0"
                                max="100"
                                value={progressPercentage}
                                onChange={handleSeek}
                                style={{
                                    position: 'absolute',
                                    top: '-6px',
                                    left: 0,
                                    width: '100%',
                                    height: '16px',
                                    opacity: 0,
                                    cursor: 'pointer'
                                }}
                            />
                        </div>

                        <span style={{
                            color: '#A7A7A7',
                            fontSize: '11px',
                            minWidth: '40px'
                        }}>
                            {formatTime(duration)}
                        </span>
                    </div>
                </div>

                {/* Right: Volume */}
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    width: '30%',
                    justifyContent: 'flex-end',
                    minWidth: '180px'
                }}>
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        width: '125px'
                    }}>
                        <span style={{ color: '#A7A7A7', fontSize: '14px' }}>🔊</span>
                        <div style={{
                            position: 'relative',
                            flex: 1,
                            height: '4px',
                            backgroundColor: '#5E5E5E',
                            borderRadius: '2px'
                        }}>
                            <div style={{
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                height: '100%',
                                width: `${volume * 100}%`,
                                backgroundColor: '#FFFFFF',
                                borderRadius: '2px'
                            }} />
                            <input
                                type="range"
                                min="0"
                                max="100"
                                value={volume * 100}
                                onChange={(e) => {
                                    const newVolume = parseInt(e.target.value) / 100;
                                    setVolume(newVolume);
                                    if (audioRef.current) {
                                        audioRef.current.volume = newVolume;
                                    }
                                }}
                                style={{
                                    position: 'absolute',
                                    top: '-6px',
                                    left: 0,
                                    width: '100%',
                                    height: '16px',
                                    opacity: 0,
                                    cursor: 'pointer'
                                }}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}