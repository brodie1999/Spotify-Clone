// @ts-ignore
import React, { useState, useRef, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useMusicPlayer } from '../../contexts/MusicPlayerContext';

export default function BottomMusicPlayer() {
    const { currentSong,
        isPlaying,
        pauseMusic,
        resumeMusic,
        skipToPrevious,
        skipToNext,
        setPlaylist,
        repeatMode,
        toggleRepeat,
        updateCurrentSongAudioUrl
    } = useMusicPlayer();

    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [volume, setVolume] = useState(1);
    const [isLoading, setIsLoading] = useState(false);
    const [audioUrl, setAudioUrl] = useState<string | null>(null);
    const [retryCount, setRetryCount] = useState(0);

    const audioRef = useRef<HTMLAudioElement>(null);
    const location = useLocation();

    const hasSidebar = location.pathname === '/dashboard' || location.pathname === '/playlists/';

    // Check if a YouTube Audio URL is expired
    const isYouTubeUrlExpired = (url: string): boolean => {
        try {
            const urlObj = new URL(url);
            const expireParam = urlObj.searchParams.get('expire');
            if (expireParam) {
                const expireTime= parseInt(expireParam) * 1000;
                const now = Date.now();
                return now >= expireTime;
            }
        } catch (error) {
            console.warn('Could not parse YouTube URL for expiration check:', error);
        }
        return false
    }

    const fetchFreshAudioUrl = async (song: any): Promise<string | null> => {
        try {
            console.log('Fetching fresh YouTube audio URL for: ', song.youtube_id);
            const response = await fetch(`http://localhost:8002/api/discover/youtube/audio/${song.youtube_id}`, {
                headers: {
                    'Authorization' : `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (response.ok) {
                const { audio_url } = await response.json();
                console.log("Fetched fresh Audio URL: ", audio_url)
                return audio_url;
            } else {
                console.error('Failed fetch fresh YouTube Audio URL: ', response.status);
                return null;
            }
        } catch (error) {
            console.error('Failed to fetch fresh YouTube audio URL:', error);
            return null;
        }
    };

     const fetchYouTubeAudioURL = async (song: any) => {
            try {
                console.log('Fetching YouTube audio url for: ', song.youtube_id);

                // Check if we already have a URL and if it's expired
                if (song.youtube_audio_url && !isYouTubeUrlExpired(song.youtube_audio_url)) {
                    console.log('Using existing non-expired YouTube audio URL');
                    setAudioUrl(song.youtube_audio_url);
                    setIsLoading(false);
                    return;
                }

                console.log('Fetching fresh YouTube audio URL (expired or missing)');
                const freshURL = await fetchFreshAudioUrl(song);

                if (freshURL) {
                    // Update the current song with the fresh URL
                    const updatedSong = { ...currentSong, youtube_audio_url: freshURL };
                    updateCurrentSongAudioUrl?.(freshURL);
                    setAudioUrl(freshURL);
                    setIsLoading(true);
                } else {
                    console.error('Failed to get fresh Youtube audio URL');
                    setIsLoading(false);
                }
            } catch (error) {
                console.error('Failed to get fresh YouTube audio URL:', error);
                setIsLoading(false);
            }
        };

    // Create authenticated audio URL when song changes
    useEffect(() => {
        if (currentSong) {
            setCurrentTime(0);
            setDuration(0);
            setIsLoading(true);
            setRetryCount(0);

            let streamingURL;

            if (currentSong.source === 'youtube' && currentSong.youtube_audio_url) {
                // Check if the current audio URL is expired
                if (isYouTubeUrlExpired(currentSong.youtube_audio_url)) {
                    console.log('Youtube URL is expired, fetching fresh one');
                    fetchYouTubeAudioURL(currentSong);
                    return;
                } else {
                    streamingURL = currentSong.youtube_audio_url;
                }
                // Youtube Audio stream
                streamingURL = currentSong.youtube_audio_url;
            } else if (currentSong.source === 'youtube' && !currentSong.youtube_audio_url) {
                // Fetch YouTube audio URL
                fetchYouTubeAudioURL(currentSong)
                return;
            } else if (currentSong.source === 'local' || !currentSong.source) {
                streamingURL = `http://localhost:8002/api/songs/${currentSong.id}/stream`;
            }

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

        const handleEnded = async () => {
            console.log('Audio ended, repeat mode: ', repeatMode);

            if (repeatMode === 'one') {
                // Repeat CurrentSong
                audio.currentTime = 0;
                await audio.play();
                console.log('Repating current song');
            } else {
                // Move to next song
                try {
                    await skipToNext();
                    console.log('Moving to next song');
                    if (handleCanPlay()){
                        await audio.play()
                    }
                } catch (err) {
                    console.log("Error auto-advancing to next songs",  err);
                    pauseMusic();
                }
            }
        };

        const handleLoadStart = () => {
            console.log('Audio load started');
            setIsLoading(true);
        };
        const handleCanPlay = () => {
            console.log('Audio can play');
            setIsLoading(false);
            return true
        };
        const handleError = async (e: Event) => {
            const audioElement = e.target as HTMLAudioElement;
            const error = audioElement.error;
            console.error('Audio loading error:', {
                code: error?.code,
                message: error?.message,
                networkState: audioElement.networkState,
                readyState: audioElement.readyState,
                src: audioElement.src
            });

            // If this is a youtube song and we haven't retried too many times, try to get a fresh URL
            if (currentSong?.source === 'youtube' &&
                currentSong.youtube_id &&
                retryCount < 2) {

                console.log('Attempting to refresh expired YouTube URL...');
                setRetryCount(prev => prev + 1);

                const freshURL = await fetchFreshAudioUrl(currentSong);
                if (freshURL) {
                    console.log('Got fresh URL, updating and retrying....')
                    updateCurrentSongAudioUrl?.(freshURL)
                    setAudioUrl(freshURL);
                    // The useEffect will trigger again with a new URL
                    return;
                }
            }
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
    }, [currentSong, audioUrl, pauseMusic, repeatMode, skipToNext, retryCount]);

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
        return null
    }

    const artworkUrl = currentSong.thumbnail_url
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
                left: hasSidebar ? '280px' : '0',
                right: '0',
                height: '100px',
                backgroundColor: '#181818',
                borderTop: '1px solid #282828',
                display: 'flex',
                alignItems: 'center',
                padding: '0 2rem',
                zIndex: 1000,
                boxShadow: '0 -2px 10px rgba(0, 0, 0, 0.3)',
                backdropFilter: 'blur(20px)'
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
                        width: '80px',
                        height: '80px',
                        borderRadius: '4px',
                        overflow: 'hidden',
                        backgroundColor: '#282828',
                        marginRight: '20px',
                        flexShrink: 0,
                        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.3)',
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
                            fontSize: '18px',
                            fontWeight: '500',
                            marginBottom: '6px',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                        }}>
                            {currentSong.title}
                        </div>
                        <div style={{
                            color: '#B3B3B3',
                            fontSize: '16px',
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
                        marginBottom: '12px',
                        gap: '20px',
                    }}>
                        {/* PREVIOUS BUTTON */}
                        <button
                            onClick={async () => {
                                try {
                                    await skipToPrevious();
                                } catch (error) {
                                    console.error("Error skipping to previous song: ", error);
                                }
                            }}
                                style={{
                                    width: '36px',
                                    height: '36px',
                                    backgroundColor: 'transparent',
                                    border: 'none',
                                    color: '#B3B3B3',
                                    cursor: 'pointer',
                                    fontSize: '20px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    borderRadius: '50%',
                                    transition: 'all 0.2s ease'
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.color = '#FFFFFF';
                                    e.currentTarget.style.transform = 'scale(1.1)';
                                    e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.color = '#B3B3B3';
                                    e.currentTarget.style.transform = 'scale(1)';
                                    e.currentTarget.style.backgroundColor = 'transparent';
                                }}
                        >
                            ⏮️
                         </button>
                        <button
                            onClick={togglePlay}
                            disabled={isLoading || !audioUrl}
                            style={{
                                width: '48px',
                                height: '48px',
                                borderRadius: '50%',
                                backgroundColor: (isLoading || !audioUrl) ? '#535353' : '#FFFFFF',
                                border: 'none',
                                color: '#000000',
                                cursor: (isLoading || !audioUrl) ? 'not-allowed' : 'pointer',
                                fontSize: '20px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                transition: 'all 0.2s ease',
                                boxShadow: (isLoading || !audioUrl) ? 'none': '0 4px 12px rgba(0, 0, 0, 0.3)',
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
                    {/* NEXT BUTTON */}
                    <button
                        onClick={async () => {
                            try {
                                await skipToNext();
                            } catch (error) {
                                console.error("Error skipping to next", error);
                            }
                        }}
                        style={{
                            width: '36px',
                            height: '36px',
                            backgroundColor: 'transparent',
                            border: 'none',
                            color: '#B3B3B3',
                            cursor: 'pointer',
                            fontSize: '20px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            borderRadius: '50%',
                            transition: 'all 0.2s ease',
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.color = '#FFFFFF';
                            e.currentTarget.style.transform = 'scale(1.1)';
                            e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.color = '#B3B3B3';
                            e.currentTarget.style.transform = 'scale(1)';
                            e.currentTarget.style.backgroundColor = 'transparent';
                        }}
                    >
                        ⏭️
                    </button>

                        <button
                            onClick={toggleRepeat}
                            style={{
                                width: '36px',
                                height: '36px',
                                backgroundColor: 'transparent',
                                border: 'none',
                                color: repeatMode === 'off' ? '#B3B3B3' : '#1DB954',
                                cursor: 'pointer',
                                fontSize: '18px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                borderRadius: '50%',
                                transition: 'all 0.2s ease',
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.color = repeatMode === 'off' ? '#FFFFFF' : '#1ed760';
                                e.currentTarget.style.transform = 'scale(1.1)';
                                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.color = repeatMode === 'off' ? '#B3B3B3' : '#1DB954';
                                e.currentTarget.style.transform = 'scale(1)';
                                e.currentTarget.style.backgroundColor = 'transparent';
                            }}
                        >
                            {repeatMode === 'one' ? '🔂' : '🔁'}
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
                            fontSize: '16px',
                            minWidth: '50px',
                            textAlign: 'right',
                            fontWeight: '400'
                        }}>
                            {formatTime(currentTime)}
                        </span>

                        <div style={{
                            position: 'relative',
                            flex: 1,
                            height: '8px',
                            backgroundColor: '#5E5E5E',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            overflow: 'hidden',
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
                                    top: '50%',
                                    left: 0,
                                    width: '100%',
                                    height: '8px',
                                    transform: 'translateY(-50%)',
                                    opacity: 0,
                                    cursor: duration ? 'pointer' : 'not-allowed',
                                    margin: 0,
                                    padding: 0,

                                }}
                            />
                        </div>

                        <span style={{
                            color: '#A7A7A7',
                            fontSize: '16px',
                            minWidth: '50px',
                            fontWeight: '400'
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
                    minWidth: '180px',
                }}>
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        width: '160px'
                    }}>
                        <span style={{ color: '#A7A7A7', fontSize: '24px' }}>
                            {volume === 0 ? '🔇' : volume < 0.5 ? '🔉' : '🔊'}
                        </span>
                        <div style={{
                            position: 'relative',
                            flex: 1,
                            height: '5px',
                            backgroundColor: '#5E5E5E',
                            borderRadius: '4px'
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
                                    top: '50%',
                                    left: 0,
                                    width: '100%',
                                    height: '16px',
                                    transform: 'translateY(-50%)',
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