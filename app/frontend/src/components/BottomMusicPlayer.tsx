// @ts-ignore
import React, { useState, useRef, useEffect } from 'react';
import { useMusicPlayer } from '../contexts/MusicPlayerContext';

export default function BottomMusicPlayer() {
    const { currentSong, isPlaying, pauseMusic, resumeMusic } = useMusicPlayer();

    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [volume, setVolume] = useState(1);
    const [isLoading, setIsLoading] = useState(false);
    const [audioUrl, setAudioUrl] = useState<string | null>(null);
    const audioRef = useRef<HTMLAudioElement>(null);

    // Create authenticated audio URL when song changes
    useEffect(() => {
        if (currentSong) {
            setCurrentTime(0);
            setDuration(0);
            setIsLoading(true);

            const streamingURL = `http://localhost:8002/api/songs/${currentSong.id}/stream`;
            setAudioUrl(streamingURL);
            setIsLoading(false);
        } else {
            // Clean up old blob URL
            if (audioUrl) {
                URL.revokeObjectURL(audioUrl);
            }
            setAudioUrl(null);
        }
    }, [currentSong?.id]);

    useEffect(() => {
        const audio = audioRef.current;
        if (!audio || !currentSong || !audioUrl) return;

        const updateTime = () => setCurrentTime(audio.currentTime);
        const updateDuration = () => {
            setDuration(audio.duration);
            console.log('Audio duration loaded:', audio.duration);
        };
        const handleEnded = () => {
            console.log('Audio ended');
            pauseMusic();
        };
        const handleLoadStart = () => {
            console.log('Audio load started');
            setIsLoading(true);
        };
        const handleCanPlay = () => {
            console.log('Audio can play');
            setIsLoading(false);
        };
        const handleError = (e: Event) => {
            const audioElement = e.target as HTMLAudioElement;
            const error = audioElement.error;
            console.error('Audio loading error:', {
                code: error?.code,
                message: error?.message,
                networkState: audioElement.networkState,
                readyState: audioElement.readyState,
                src: audioElement.src
            });
            setIsLoading(false);
        };

        audio.addEventListener('timeupdate', updateTime);
        audio.addEventListener('loadedmetadata', updateDuration);
        audio.addEventListener('ended', handleEnded);
        audio.addEventListener('loadstart', handleLoadStart);
        audio.addEventListener('canplay', handleCanPlay);
        audio.addEventListener('error', handleError);

        return () => {
            audio.removeEventListener('timeupdate', updateTime);
            audio.removeEventListener('loadedmetadata', updateDuration);
            audio.removeEventListener('ended', handleEnded);
            audio.removeEventListener('loadstart', handleLoadStart);
            audio.removeEventListener('canplay', handleCanPlay);
            audio.removeEventListener('error', handleError);
        };
    }, [currentSong, audioUrl, pauseMusic]);

    useEffect(() => {
        const audio = audioRef.current;
        if (!audio || !audioUrl) return;

        if (isPlaying) {
            console.log('Attempting to play audio...');

            // Load the audio first if it's not loaded
            if (audio.readyState < 2) {
                console.log('Loading audio first...');
                audio.load();
            }

            const playPromise = audio.play();
            if (playPromise !== undefined) {
                playPromise
                    .then(() => {
                        console.log('Audio started playing successfully');
                    })
                    .catch(error => {
                        console.error('Audio play error:', error);
                        console.error('Error details:', {
                            name: error.name,
                            message: error.message,
                            code: error.code,
                            audioSrc: audio.src,
                            readyState: audio.readyState,
                            networkState: audio.networkState,
                            paused: audio.paused,
                            ended: audio.ended
                        });
                        pauseMusic();
                    });
            }
        } else {
            console.log('Pausing audio');
            audio.pause();
        }
    }, [isPlaying, audioUrl, pauseMusic]);

    const togglePlay = () => {
        console.log('Toggle play clicked, current state:', { isPlaying, audioUrl, isLoading });
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

    // Don't render if no song is selected
    if (!currentSong) {
        return (
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
                justifyContent: 'center',
                zIndex: 1000,
                boxShadow: '0 -2px 10px rgba(0, 0, 0, 0.3)',
                opacity: 0.6
            }}>
                <div style={{
                    color: '#B3B3B3',
                    fontSize: '14px',
                    textAlign: 'center'
                }}>
                    <div style={{ marginBottom: '4px' }}>🎵</div>
                    <div>Select a song to start playing</div>
                </div>
            </div>
        );
    }

    const artworkUrl = currentSong.artwork_path
        ? `http://localhost:8002/api/songs/${currentSong.id}/artwork`
        : null;

    return (
        <>
            {/* Audio element - only render when we have a valid audioUrl */}
            {audioUrl && (
                <audio
                    ref={audioRef}
                    src={audioUrl}
                    volume={volume}
                    preload="metadata"
                />
            )}

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
                            disabled={isLoading || !audioUrl}
                            style={{
                                width: '32px',
                                height: '32px',
                                borderRadius: '50%',
                                backgroundColor: (isLoading || !audioUrl) ? '#535353' : '#FFFFFF',
                                border: 'none',
                                color: '#000000',
                                cursor: (isLoading || !audioUrl) ? 'not-allowed' : 'pointer',
                                fontSize: '12px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                transition: 'transform 0.1s ease, background-color 0.2s ease'
                            }}
                            onMouseEnter={(e) => {
                                if (!isLoading && audioUrl) {
                                    e.currentTarget.style.transform = 'scale(1.06)';
                                }
                            }}
                            onMouseLeave={(e) => {
                                if (!isLoading && audioUrl) {
                                    e.currentTarget.style.transform = 'scale(1)';
                                }
                            }}
                        >
                            {isLoading ? '⏳' : (isPlaying ? '⏸️' : '▶️')}
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
                                borderRadius: '2px',
                                transition: 'width 0.1s ease'
                            }} />
                            <input
                                type="range"
                                min="0"
                                max="100"
                                value={progressPercentage}
                                onChange={handleSeek}
                                disabled={!duration}
                                style={{
                                    position: 'absolute',
                                    top: '-6px',
                                    left: 0,
                                    width: '100%',
                                    height: '16px',
                                    opacity: 0,
                                    cursor: duration ? 'pointer' : 'not-allowed'
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
                        <span style={{ color: '#A7A7A7', fontSize: '14px' }}>
                            {volume === 0 ? '🔇' : volume < 0.5 ? '🔉' : '🔊'}
                        </span>
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