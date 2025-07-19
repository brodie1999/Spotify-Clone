// app/frontend/src/contexts/MusicPlayerContext.tsx
// @ts-ignore
import React, { createContext, useContext, useState, ReactNode } from 'react';

interface Song {
    id: number;
    title: string;
    artist: string;
    album: string;
    artwork_path?: string;
    duration?: number;
}

interface MusicPlayerContextType {
    currentSong: Song | null;
    isPlaying: boolean;
    playSong: (song: Song) => void;
    pauseMusic: () => void;
    resumeMusic: () => void;
    clearPlayer: () => void;
    skipToNext: () => void;
    skipToPrevious: () => void;
    setPlaylist: (songs: Song[], startIndex?: number) => void;
}

const MusicPlayerContext = createContext<MusicPlayerContextType | undefined>(undefined);

export function MusicPlayerProvider({ children }: { children: ReactNode }) {
    const [currentSong, setCurrentSong] = useState<Song | null>(null);
    const [currentPlaylist, setCurrentPlaylist] = useState<Song[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);

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

    const skipToNext = () => {
        if (currentPlaylist.length > 0) {
            const nextIndex = (currentIndex + 1) % currentPlaylist.length;
            setCurrentIndex(nextIndex);
            setCurrentSong(currentPlaylist[nextIndex]);
            setIsPlaying(true);
        }
    };

    const skipToPrevious = () => {
        if (currentPlaylist.length > 0) {
            const previousIndex  = currentIndex === 0 ? currentPlaylist.length - 1 : currentIndex - 1;
            setCurrentIndex(previousIndex);
            setCurrentSong(currentPlaylist[previousIndex]);
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