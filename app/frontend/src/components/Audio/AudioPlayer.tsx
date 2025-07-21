//@ts-ignore
import React, { useState, useRef, useEffect } from 'react';

interface Song {
    id: number;
    title: string;
    artist: string;
    album: string;
    duration?: number;
}

interface AudioPlayerProps {
    song: Song;
    autoPlay?: boolean;
}

export default function AudioPlayer({ song, autoPlay = false }: AudioPlayerProps) {
    const [isPlaying , setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [volume, setVolume] = useState(1);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const audioRef = useRef<HTMLAudioElement>(null);

    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;

        // Add authentication header for audio requests
        const token = localStorage.getItem('token');
        if (token) {
            // Can't set custom headers on audio elements,
            // So we'll handle auth differently if needed
        }

        const updateTime = () => setDuration(audio.currentTime);
        const updateDuration = () => setDuration(audio.duration);
        const handleLoadStart = () => setIsLoading(true);
        const handleCanPlay = () => setIsLoading(false);
        const handleError = () => {
            setError("Failed to load Audio")
            setIsLoading(false);
        };
        const handleEnded = () => setIsPlaying(false);

        audio.addEventListener('timeupdate', updateTime);
        audio.addEventListener('loadedmetadata', updateDuration);
        audio.addEventListener('loadstart', handleLoadStart);
        audio.addEventListener('canplay', handleCanPlay);
        audio.addEventListener('error', handleError);
        audio.addEventListener('ended', handleEnded);

        return () => {
            audio.removeEventListener('timeupdate', updateTime);
            audio.removeEventListener('loadedmetadata', updateDuration);
            audio.removeEventListener('loadstart', handleLoadStart);
            audio.removeEventListener('canplay', handleCanPlay);
            audio.removeEventListener('error', handleError);
            audio.removeEventListener('ended', handleEnded);
        };
    }, [song.id]);

    useEffect(() => {
        if (autoPlay && audioRef.current) {
            togglePlay();
        }
    }, [autoPlay, song.id]);

    const togglePlay = async () => {
        const audio = audioRef.current;
        if (!audio) return;

        try {
            if (isPlaying) {
                audio.pause();
                setIsPlaying(false);
            } else {
                await audio.play();
                setIsPlaying(true);
            }
        } catch (err) {
            setError('Failed to load Audio');
            console.error('Audio play error: ', err);
        }
    };

    const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
        const audio = audioRef.current;
        if (!audio) return;

        const newTime = (parseFloat(e.target.value) / 100) * duration;
        audio.currentTime = newTime;
        setCurrentTime(newTime);
    };

    const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newVolume = parseFloat(e.target.value) / 100;
        setVolume(newVolume);
        if (audioRef.current) {
            audioRef.current.volume = newVolume;
        }
    };

    const formatTime = (time: number) => {
        if (isNaN(time)) return '0:00';
        const minutes = Math.floor(time / 60);
        const seconds = Math.floor(time % 60);
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    };

    const progressPercentage = duration > 0 ? (currentTime / duration) * 100 : 0;

    return (
        <div style={{
            backgroundColor: '#181818',
            borderRadius: '12px',
            padding: '1rem',
            border: '1px solid #282828',
            minWidth: '300px'
        }}>
            {/* Audio element */}
            <audio
                ref={audioRef}
                src={`http://localhost:8002/api/songs/${song.id}/stream`}
                preload="metadata"
            />

            {/* Song info */}
            <div style={{
                marginBottom: '1rem',
                textAlign: 'center'
            }}>
                <div style={{
                    fontSize: '1rem',
                    fontWeight: '600',
                    color: '#FFFFFF',
                    marginBottom: '0.25rem'
                }}>
                    {song.title}
                </div>
                <div style={{
                    fontSize: '0.875rem',
                    color: '#B3B3B3'
                }}>
                    {song.artist} • {song.album}
                </div>
            </div>

            {/* Error display */}
            {error && (
                <div style={{
                    color: '#F87171',
                    fontSize: '0.875rem',
                    textAlign: 'center',
                    marginBottom: '1rem'
                }}>
                    {error}
                </div>
            )}

            {/* Controls */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '1rem',
                marginBottom: '1rem'
            }}>
                {/* Play/Pause button */}
                <button
                    onClick={togglePlay}
                    disabled={isLoading}
                    style={{
                        width: '48px',
                        height: '48px',
                        borderRadius: '50%',
                        background: isLoading
                            ? '#404040'
                            : 'linear-gradient(45deg, #1DB954, #1ed760)',
                        border: 'none',
                        color: '#FFFFFF',
                        cursor: isLoading ? 'not-allowed' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '1.2rem',
                        transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                        if (!isLoading) {
                            e.currentTarget.style.transform = 'scale(1.05)';
                        }
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'scale(1)';
                    }}
                >
                    {isLoading ? '⏳' : isPlaying ? '⏸️' : '▶️'}
                </button>

                {/* Time display */}
                <div style={{
                    fontSize: '0.875rem',
                    color: '#B3B3B3',
                    minWidth: '80px'
                }}>
                    {formatTime(currentTime)} / {formatTime(duration)}
                </div>

                {/* Volume control */}
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    flex: 1
                }}>
                    <span style={{ fontSize: '1rem' }}>🔊</span>
                    <input
                        type="range"
                        min="0"
                        max="100"
                        value={volume * 100}
                        onChange={handleVolumeChange}
                        style={{
                            flex: 1,
                            height: '4px',
                            borderRadius: '2px',
                            background: `linear-gradient(to right, #1DB954 0%, #1DB954 ${volume * 100}%, #404040 ${volume * 100}%, #404040 100%)`,
                            outline: 'none',
                            cursor: 'pointer'
                        }}
                    />
                </div>
            </div>

            {/* Progress bar */}
            <div style={{
                position: 'relative',
                height: '6px',
                backgroundColor: '#404040',
                borderRadius: '3px',
                overflow: 'hidden',
                cursor: 'pointer'
            }}>
                <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    height: '100%',
                    width: `${progressPercentage}%`,
                    background: 'linear-gradient(45deg, #1DB954, #1ed760)',
                    transition: 'width 0.1s ease'
                }} />
                <input
                    type="range"
                    min="0"
                    max="100"
                    value={progressPercentage}
                    onChange={handleSeek}
                    style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        opacity: 0,
                        cursor: 'pointer'
                    }}
                />
            </div>
        </div>
    );

}