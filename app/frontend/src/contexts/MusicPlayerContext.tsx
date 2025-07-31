// app/frontend/src/contexts/MusicPlayerContext.tsx
// @ts-ignore
import React, { createContext, useContext, useState, ReactNode } from 'react';

interface Song {
    youtube_id?: string;
    id: number;
    title: string;
    artist: string;
    album: string;
    thumbnail_url?: string;
    duration?: number;

    // FOR EXTERNAL SOURCES
    youtube_audio_url?: string;
    youtube_audio?: string;
    source?: 'local' | 'spotify' | 'youtube';
}

interface MusicPlayerContextType {
    currentSong: Song | null;
    isPlaying: boolean;
    repeatMode: 'off' | 'one' | 'all';
    playSong: (song: Song) => void;
    pauseMusic: () => void;
    resumeMusic: () => void;
    clearPlayer: () => void;
    skipToNext: () => Promise<void>;
    skipToPrevious: () => Promise<void>;
    setPlaylist: (songs: Song[], startIndex?: number) => void;
    toggleRepeat: () => void;
    updateCurrentSongAudioUrl: (newAudioUrl: string) => void; // New Function
}

const MusicPlayerContext = createContext<MusicPlayerContextType | undefined>(undefined);

// Helper function to check if a YouTube URL is expired
const isYouTubeUrlExpired = (url: string): boolean => {
    try {
        const urlObj = new URL(url);
        const expireParam = urlObj.searchParams.get('expire');
        if (expireParam) {
            const expireTime = parseInt(expireParam) * 1000; // Convert to milliseconds
            return Date.now() >= expireTime;
        }
    } catch (error) {
        console.warn('Could not parse Youtube URL for expiration check: ', error)
    }
    return false;
};

// Helper function to fetch fresh YouTube audio URL
const fetchFreshYouTubeAudioUrl = async (youtubeId: string): Promise<string | null> => {
    try {
        const response = await fetch(`http://localhost:8002/api/discover/youtube/audio/${youtubeId}`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
            }
        });

        if (response.ok) {
            const { audio_url } = await response.json();
            return audio_url;
        } else {
            console.error('Failed to fetch fresh YouTube audio URL:', response.status);
            return null;
        }
    } catch (error) {
        console.error('Error fetching fresh YouTube audio URL:', error);
        return null;
    }
};

export function MusicPlayerProvider({ children }: { children: ReactNode }) {
    const [currentSong, setCurrentSong] = useState<Song | null>(null);
    const [currentPlaylist, setCurrentPlaylist] = useState<Song[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const [repeatMode, setRepeatMode] = useState<'off' | 'one' | 'all'>('off');

    const playSong = (song: Song) => {
        setCurrentSong(song);
        setIsPlaying(true);
        // Update Index in playlist
        const index = currentPlaylist.findIndex(s => s.id === song.id);
        if (index !== -1) {
            setCurrentIndex(index);
        }
    };

    const setPlaylist = (songs: Song[], startIndex: number = 0) => {
       setCurrentPlaylist(songs);
       setCurrentIndex(startIndex);
       if (songs.length > startIndex) {
           setCurrentSong(songs[startIndex]);
       }
    }

    const pauseMusic = () => {
        setIsPlaying(false);
    };

    const resumeMusic = () => {
        setIsPlaying(true);
    };

    const clearPlayer = () => {
        setCurrentSong(null);
        setIsPlaying(false);
    }

    const toggleRepeat = () => {
        setRepeatMode(prev => {
            switch (prev) {
                case'off': return 'one';
                case 'one': return 'all';
                case 'all': return 'off';
                default: return 'off';
            }
        });
    }

    // New function to update the current song's audio URL
    const updateCurrentSongAudioUrl = (newAudioUrl: string) => {
        if (currentSong) {
            const updateSong = { ...currentSong, youtube_audio_url: newAudioUrl };
            setCurrentSong(updateSong);

            // Also update the song in the current playlist if it exists there
            if (currentPlaylist.length > 0) {
                const updatedPlaylist = [ ...currentPlaylist];
                const songIndex = updatedPlaylist.findIndex(s => s.id === currentSong.id);
                if (songIndex !== -1) {
                    updatedPlaylist[songIndex] = updateSong;
                    setCurrentPlaylist(updatedPlaylist);
                }
            }
        }
    };

    const skipToNext = async () => {
        if (currentPlaylist.length > 0) {
            const nextIndex = (currentIndex + 1) % currentPlaylist.length;
            let nextSong = currentPlaylist[nextIndex];

            // If it's a YouTube song without audio URL, load it
            if (nextSong.source === 'youtube' && nextSong.youtube_id) {
              // If no URL or expired URL, fetch fresh one
                if (!nextSong.youtube_id || isYouTubeUrlExpired(nextSong.youtube_audio_url)) {
                    console.log('Next song URL expired or missing, fetching fresh URL');
                    const freshURL = await fetchFreshYouTubeAudioUrl(nextSong.youtube_id);

                    if (freshURL) {
                        // Update the song in the playlist
                        const updatedPlaylist = [ ...currentPlaylist];
                        updatedPlaylist[nextIndex] = { ...nextSong, youtube_audio_url: freshURL };
                        setCurrentPlaylist(updatedPlaylist);
                        nextSong = updatedPlaylist[nextIndex]
                    } else {
                        console.error('Failed to get fresh URL for next song')
                    }
                }
            }
            setCurrentIndex(nextIndex);
            setCurrentSong(nextSong);
            setIsPlaying(true);
        }
    };

    const skipToPrevious = async () => {
         if (currentPlaylist.length > 0) {
            const previousIndex = currentIndex === 0 ? currentPlaylist.length - 1 : currentIndex - 1;
            let previousSong = currentPlaylist[previousIndex];

            // Check if it's a YouTube song and handle URL expiration
             if (previousSong.source === 'youtube' && previousSong.youtube_id) {
                 // If not URL or expired URL, fetch fresh one
                 if (!previousSong.youtube_audio_url || isYouTubeUrlExpired(previousSong.youtube_audio_url)) {
                     console.log('Previous song URL expired or missing, fetching fresh URL');
                     const freshURL = await fetchFreshYouTubeAudioUrl(previousSong.youtube_id);
                     if (freshURL) {
                         // Update the song in the playlist with fresh URL
                         const updatedPlaylist = [ ...currentPlaylist];
                         updatedPlaylist[previousIndex] = { ...currentSong, youtube_audio_url: freshURL };
                         setCurrentPlaylist(updatedPlaylist);
                         previousSong = updatedPlaylist[previousIndex]
                     } else {
                         console.log('Failed to get fresh URL for previous song')
                 }
             }
        }

        setCurrentIndex(previousIndex);
        setCurrentSong(previousSong);
        setIsPlaying(true);
    }
    };

    return (
        <MusicPlayerContext.Provider value={{
            currentSong,
            isPlaying,
            playSong,
            pauseMusic,
            resumeMusic,
            clearPlayer,
            setPlaylist,
            skipToNext,
            skipToPrevious,
            toggleRepeat,
            repeatMode,
            updateCurrentSongAudioUrl, // New function
        }}>
            {children}
        </MusicPlayerContext.Provider>
    );
}

export function useMusicPlayer() {
    const context = useContext(MusicPlayerContext);
    if (context === undefined) {
        throw new Error('useMusicPlayer must be used within a MusicPlayerProvider');
    }
    return context;
}