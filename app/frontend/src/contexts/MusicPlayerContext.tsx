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
}

const MusicPlayerContext = createContext<MusicPlayerContextType | undefined>(undefined);

export function MusicPlayerProvider({ children }: { children: ReactNode }) {
    const [currentSong, setCurrentSong] = useState<Song | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);

    const playSong = (song: Song) => {
        setCurrentSong(song);
        setIsPlaying(true);
    };

    const pauseMusic = () => {
        setIsPlaying(false);
    };

    const resumeMusic = () => {
        setIsPlaying(true);
    };

    return (
        <MusicPlayerContext.Provider value={{
            currentSong,
            isPlaying,
            playSong,
            pauseMusic,
            resumeMusic
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