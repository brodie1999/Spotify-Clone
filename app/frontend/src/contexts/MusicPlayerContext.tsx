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
}

const MusicPlayerContext = createContext<MusicPlayerContextType | undefined>(undefined);

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

    const skipToNext = async () => {
        if (currentPlaylist.length > 0) {
            const nextIndex = (currentIndex + 1) % currentPlaylist.length;
            const nextSong = currentPlaylist[nextIndex];

            // If it's a YouTube song without audio URL, load it
            if (nextSong.source === 'youtube' && nextSong.youtube_id && !nextSong.youtube_audio_url) {
                try {
                    console.log('Fetching audio URL for next YouTube song:', nextSong.youtube_id);
                    const response = await fetch(`http://localhost:8002/api/discover/youtube/audio/${nextSong.youtube_id}`, {
                        headers: {
                            'Authorization': `Bearer ${localStorage.getItem('token')}`,
                        }
                    });

                    if (response.ok) {
                        const { audio_url } = await response.json();
                        // console.log('Fetched audio URL: ', audio_url);

                        // Update the song in the playlist with the Audio URL
                        const updatedPlaylist = [...currentPlaylist];
                        updatedPlaylist[nextIndex] = { ...nextSong, youtube_audio_url: audio_url };
                        setCurrentPlaylist(updatedPlaylist);

                        // Update the next song reference
                        const updatedNextSong = { ...nextSong, youtube_audio_url: audio_url };
                        setCurrentIndex(nextIndex);
                        setCurrentSong(updatedNextSong);
                        setIsPlaying(false);
                        return;
                    } else {
                        console.error('Failed to fetch audio URL for next song')
                    }
                } catch (error) {
                    console.error('Failed to load audio for next song: ', error);
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
            const previousSong = currentPlaylist[previousIndex];

            // If it's a YouTube song without audio URL, load it
        if (previousSong.source === 'youtube' && previousSong.youtube_id && !previousSong.youtube_audio_url) {
            try {
                console.log('Fetching audio URL for previous YouTube song:', previousSong.youtube_id);
                const response = await fetch(`http://localhost:8002/api/discover/youtube/audio/${previousSong.youtube_id}`, {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    }
                });

                if (response.ok) {
                    const { audio_url } = await response.json();
                    console.log('Fetched audio URL for previous song:', audio_url);

                    // Update the song in the playlist with the audio URL
                    const updatedPlaylist = [...currentPlaylist];
                    updatedPlaylist[previousIndex] = { ...previousSong, youtube_audio_url: audio_url };
                    setCurrentPlaylist(updatedPlaylist);

                    // Update the previous song reference
                    const updatedPreviousSong = { ...previousSong, youtube_audio_url: audio_url };
                    setCurrentIndex(previousIndex);
                    setCurrentSong(updatedPreviousSong);
                    setIsPlaying(true);
                    return;
                } else {
                    console.error('Failed to fetch audio URL for previous song');
                }
            } catch (error) {
                console.error('Failed to load audio for previous song:', error);
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