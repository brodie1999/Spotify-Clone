// @ts-ignore
import React, { useState, useEffect} from "react";
import { useNavigate } from "react-router-dom";
import { getProfile } from "../api";

export function Dashboard() {
    const [user, setUser] = useState<{username: string; email?: string} | null>(null);
    const [error, setError] = useState<string | null>(null);
    const navigate = useNavigate();

    // Fetch current user profile
    useEffect(() => {
        async function fetchProfile() {
            const token = localStorage.getItem("token");
            if (!token) {
                navigate("/");
                return;
            }
            try {
                const profile = await getProfile(token);
                setUser(profile);
            } catch (error: any) {
                setError(error.message || "Failed to fetch profile");
            }
        }
        fetchProfile();
    }, [navigate]);

    const handleLogout = () => {
        localStorage.removeItem("token");
        navigate("/login");
    };

    return (
        <div className="min-h-screen bg-gray-100 p-6">
        <div className="max-w-3xl mx-auto bg-white rounded-lg shadow p-8">
            <h1 className="text-2xl font-semibold mb-4">Dashboard</h1>
            {error && <p className="text-red-500 mb-2">{error}</p>}
            {user ? (
              <div>
                <p className="mb-2">Welcome back, <span className="font-medium">{user.username}</span>!</p>
                {user.email && (
                  <p className="mb-4 text-gray-600">Email: {user.email}</p>
                )}
                <button
                  onClick={handleLogout}
                  className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
                >
                  Logout
                </button>
              </div>
            ) : (
              <p>Loading...</p>
            )}
      </div>
    </div>
    );

}