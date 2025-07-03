// API UTILITY MODULE FOR OUR REACT APP
import {Song} from "./components/Home";

export async function fetchSongs() {
    const res = await fetch("/api/songs");
    if (!res.ok) throw new Error("Couldn't load Songs");
    return await res.json() as Promise<Song[]>;
}