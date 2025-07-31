import { Song, YouTubeTrack } from "../api";

// Union type for tracks that can have YouTube audio URLs
type YouTubeCompatibleTrack = Song | (YouTubeTrack & { id?: number });

/**
 * Type guard to check if a track is a Song (has id property)
 */
const isSong = (track: YouTubeCompatibleTrack): track is Song => {
    return 'id' in track && typeof track.id === 'number';
}

// Convenience functions for specific types to maintain clean APi
/**
 * Convenience function for Song Arrays (backward compatibility)
 */
export const ensureFreshYouTubeUrlsForSongs = (songs: Song[]): Promise<Song[]> => {
    return ensureFreshYouTubeUrlsForTracks(songs);
}

/**
 * Convenience function for YouTubeTrack arrays
 */
export const ensureFreshYouTubeUrlsForYouTubeTracks = (tracks: YouTubeTrack[]): Promise<YouTubeTrack[]> => {
    return ensureFreshYouTubeUrlsForTracks(tracks);
}

/**
 * Type guard to check if a track is YouTube-compatible
 */
const isYouTubeCompatible = (track: YouTubeCompatibleTrack): boolean => {
    //Has youtube_id is the primary requirement
    if (!track.youtube_id) return false;

    // If it has a source property, check if it's youtube or undefined/local that was converted
    if ('source' in track) {
        return track.source === 'youtube' || track.source === undefined;
    }

    // If no source property (YouTubeTrack), assume it's YouTube compatible.
    return true;
}

/**
 * Checks if YouTube URL is expired by examining the 'expire' parameter
 */
export const isYouTubeUrlExpired = (url: string): boolean => {
    try {
        const urlObj = new URL(url);
        const expireParam = urlObj.searchParams.get('expire');

        if (expireParam) {
            const expireTime = parseInt(expireParam) * 1000;
            const now = Date.now();
            const isExpired = now >= expireTime;

            if (isExpired) {
                console.log(`YouTube URL expired at ${new Date(expireTime).toISOString()}, current time: ${now}`);
            }
            return isExpired;
        }
        // If no expire parameter, assume it could be expired (Be safe)
        console.warn('YouTube URL has no expire parameter, treating as potentially expired');
        return true;
    } catch (error) {
        console.warn('Could not parse YouTube URL for expiration check: ', error)
        return true; // If we can't parse, treat as expired to be safe.
    }
}

/**
 * Fetches a fresh YouTube audio URL from the backend
 */
export const fetchFreshYouTubeAudioUrl = async (youtubeId: string): Promise<string | null> => {
    try {
        console.log(`Fetching fresh YouTube audio URL for: ${youtubeId}`);

        const response = await fetch(`https://localhost:8002/api/discover/youtube/audio/${youtubeId}`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
        }
        });

         if (response.ok) {
            const { audio_url } = await response.json();
            console.log('Fresh YouTube audio URL fetched successfully');
            return audio_url;
        } else {
             const errorText = await response.text();
             console.error(`Failed to fetch refreshed YouTube audio URL: ${response.status} - ${errorText}`);
             return null;
         }
    } catch (error) {
        console.error(`Failed to fetch refreshed YouTube audio URL: ${error}`);
        return null;
    }
};

/**
 * Checks if a song needs a fresh YouTube URL and fetches it if necessary
 * Returns the song with an updated URL, or the original song if no update was needed
 */
export const ensureFreshYouTubeUrl = async <T extends YouTubeCompatibleTrack>(track: T): Promise<T> => {
    // Only process YouTube-compatible tracks
    if (!isYouTubeCompatible(track)) {
        return track;
    }

    // Check if URL exists and is not expired
    if (track.youtube_audio_url && !isYouTubeUrlExpired(track.youtube_audio_url)) {
        return track; // URL is still valid
    }

    console.log(`YouTube URL for "${track.title}" is expired or missing, fetching fresh URL...`);

    // Fetch fresh URL
    const freshUrl = await fetchFreshYouTubeAudioUrl(track.youtube_id!);

    if (freshUrl) {
        console.log(`Successfully updated YouTube URL for "${track.title}"`);
        return {
            ...track,
            youtube_audio_url: freshUrl
        };
    } else {
        console.error(`Failed to get fresh YouTube URL for "${track.title}"`);
        return track; // Return original song even if we couldn't refresh the URL
    }
};

/**
 * Processes an array of tracks and ensures all YouTube tracks have fresh URLs
 * This is useful for playlists or search results
 */
export const ensureFreshYouTubeUrlsForTracks = async <T extends YouTubeCompatibleTrack>(tracks: T[]): Promise<T[]> => {
    const youtubeTracks = tracks.filter(track =>
        isYouTubeCompatible(track) &&
        (!track.youtube_audio_url || isYouTubeUrlExpired(track.youtube_audio_url))
    );

    if (youtubeTracks.length === 0) {
        return tracks; // No YouTube tracks need updating
    }

    console.log(`Updating ${youtubeTracks.length} expired YouTube URLs...`);

    // Process YouTube tracks in parallel (but limit concurrency to avoid overwhelming the server)
    const batchSize = 3; // Process 3 at a time
    const updatedTracks = [...tracks];

    for (let i = 0; i < youtubeTracks.length; i += batchSize) {
        const batch = youtubeTracks.slice(i, i + batchSize);
        const refreshPromises = batch.map(async (track) => {
            const updatedTrack = await ensureFreshYouTubeUrl(track);
            const originalIndex = tracks.findIndex(t => {
                // For Songs, compare by id; for YouTubeTracks, compare by youtube_id
                if (isSong(t) && isSong(track)) {
                    return t.id === track.id;
                }
                return t.youtube_id === track.youtube_id;
            });
            if (originalIndex !== -1) {
                updatedTracks[originalIndex] = updatedTrack;
            }
        });

        await Promise.all(refreshPromises);
    }

    return updatedTracks;
};

/**
 * Schedules a periodic check to refresh YouTube URLs before they expire
 * This is useful for long-running playlists
 */
export const scheduleYouTubeUrlRefresh = <T extends YouTubeCompatibleTrack>(
    tracks: T[],
    onUrlsUpdated: (updatedTracks: T[]) => void,
    checkIntervalMinutes: number = 30
): (() => void) => {
    const checkInterval = setInterval(async () => {
        console.log('Performing scheduled YouTube URL refresh check...');
        const updatedTracks = await ensureFreshYouTubeUrlsForTracks(tracks);

        // Check if any URLs were actually updated
        const hasUpdates = updatedTracks.some((updatedTrack, index) => {
            const originalTrack = tracks[index];
            return originalTrack.youtube_audio_url !== updatedTrack.youtube_audio_url;
        });

        if (hasUpdates) {
            console.log('YouTube URLs were refreshed');
            onUrlsUpdated(updatedTracks);
        }
    }, checkIntervalMinutes * 60 * 1000);

    // Return cleanup function
    return () => {
        clearInterval(checkInterval);
        console.log('YouTube URL refresh scheduler stopped');
    };
};

/**
 * Gets the remaining time before a YouTube URL expires (in minutes)
 * Returns null if expiration time cannot be determined
 */
export const getYouTubeUrlTimeUntilExpiry = (url: string): number | null => {
    try {
        const urlObj = new URL(url);
        const expireParam = urlObj.searchParams.get('expire');

        if (expireParam) {
            const expireTime = parseInt(expireParam) * 1000;
            const now = Date.now();
            const remainingMs = expireTime - now;

            if (remainingMs > 0) {
                return Math.floor(remainingMs / (1000 * 60)); // Convert to minutes
            } else {
                return 0; // Already expired
            }
        }

        return null;
    } catch (error) {
        console.warn('Could not parse YouTube URL for expiry time:', error);
        return null;
    }
};