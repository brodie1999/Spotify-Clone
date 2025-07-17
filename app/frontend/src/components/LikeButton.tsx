// @ts-ignore
import React, {useState, useEffect} from "react";
import {addSongToLikedSongs, addSongToPlaylist, deleteSongFromLikedSongs, isSongLiked} from "../api";

interface LikeButtonProps {
    songId: number,
    onLikeChange?: (liked: boolean) => void,
    key?: string
}

export default function LikeButton({songId, onLikeChange, key}: LikeButtonProps) {
    const [isLiked, setIsLiked] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        checkIfLiked();
    }, [songId])

    const checkIfLiked = async () => {
        try {
            const liked = await isSongLiked(songId);
            setIsLiked(liked);
        } catch (error) {
            console.error('Error checking if song is liked', error);
        }
    };

    const handleToggleLike = async (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsLoading(true);

        try {
            if (isLiked) {
                await deleteSongFromLikedSongs(songId);
                setIsLiked(false);
                onLikeChange?.(false);
            } else {
                await addSongToLikedSongs(songId);
                setIsLiked(true);
                onLikeChange?.(true);
            }
        } catch (error) {
            console.error('Error toggling liked', error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <button
            onClick={handleToggleLike}
            disabled={isLoading}
            style={{
                background: 'transparent',
                border: 'none',
                color: isLiked ? '#1DB954' : '#B3B3B3',
                fontSize: '1.2rem',
                cursor: isLoading ? 'not-allowed' : 'pointer',
                padding: '0.25rem',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '32px',
                height: '32px',
                transition: 'color 0.2s, transform 0.1s'
            }}
            onMouseEnter={(e) => {
                if (!isLoading) {
                    e.currentTarget.style.transform = 'scale(1.1)';
                    e.currentTarget.style.color = isLiked ? '#1ed760' : '#FFFFFF';
                }
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.style.color = isLiked ? '#1DB954' : '#B3B3B3';
            }}
        >
            {isLiked ? '💚' : '🤍'}
        </button>
    );

}

