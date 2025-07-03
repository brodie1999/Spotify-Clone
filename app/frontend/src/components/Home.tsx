// @ts-ignore
import React, { useEffect, useState } from "react";
// @ts-ignore
import {fetchSongs} from "../api.ts";

export interface Song {
    id : number;
    title: string;
    artist: string;
}

const Home: React.FC = () => {
    const [songs, setSongs] = useState<Song[]>([]);

    useEffect(() => {
        fetchSongs()
            .then(setSongs)
            .catch(console.error);
    }, []);

    return (
        <div className="flex h-screen bg-black text-white">
            {/* Sidebar */}
            <aside className="w-60 bg-grey-900 flex flex-col px-4 py-6">
                <nav className="flex-1 spadce-y-4">
                    <a href="#" className="block px-4 py-2 mt-auto rounded hover:bg-gray-800">Home</a>
                    <a href="#" className="block px-4 py-2 mt-auto rounded hover:bg-gray-800">Playlists</a>
                </nav>
                <a href="#" className="block px-4 py-2 mt-auto rounded text-grey-400 hover:bg-gray-800 hover:text-white">Settings</a>
            </aside>

            {/* MAIN CONTENT */}
            <div className="flex-1 flex-col">
                {/* TOP BAR */}
                <header className="bg-gray-800 flex items-center justify-between px-6 py-4">
                    <input
                        type="text"
                        placeholder="Search"
                        className="flex-1 px-4 py-2 bg-gray-700 rounded text-white placeholder-gray-400"
                    />
                    <div className="flex items-center space-x-4 ml-6">
                        <button className="hover:text-gray-300">Profile</button>
                        <button className="hovber:text-gray-300">Log Out</button>
                    </div>
                </header>

                {/* PLAYLISTS SECTIONS */}
                <main className="p-6 overflow-auto">
                    <h1 className="text-2x1 font-bold mb-4">Playlists</h1>
                    <div className="grid grid-cols-3 gap-4 bg-gray-800 p-4 rounded">
                        {songs.map((s: { id: any; title: any; artist: any; }) => (
                                <div
                                    key={s.id}
                                    className="w-full h-[200px] bg-gray-700 rounded flex items-center justify-center text-gray-500">
                                    <strong> {s.title}</strong>
                                    <p>{s.artist}</p>
                                </div>
                            ))}
                    </div>
                </main>

            </div>
        </div>

    );
};

export default Home;