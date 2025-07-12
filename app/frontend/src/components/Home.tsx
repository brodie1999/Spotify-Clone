// @ts-ignore
import React from "react";

import { useState } from "react";
import { login, register } from "../api";
import { Link, useNavigate } from "react-router-dom";

export function Home() {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    // const [email, setEmail] = useState("");
    const [error, setError] = useState<string | null>(null);
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const {access_token} = await login(username, password);
            localStorage.setItem("token", access_token);
            navigate("/dashboard");
        } catch (error: any) {
            setError(error.message);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center px-4">
            <div className="max-w-md w-full bg-white/90 backdrop-blur-md rounded-2xl shadow-xl p-8">
              <h1 className="text-2xl font-semibold text-gray-800 mb-6 text-center">
                Log In
              </h1>
              {error && (
                <p className="text-red-600 mb-4 text-center">{error}</p>
              )}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-gray-700 mb-1">Username</label>
                  <input
                    type="text"
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  />
                </div>
                <div>
                  <label className="block text-gray-700 mb-1">Password</label>
                  <input
                    type="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-2 mt-2 rounded-lg bg-indigo-600 text-white font-medium hover:bg-indigo-700 transition"
                >
                  Log In
                </button>
              </form>
              <p className="mt-6 text-center text-sm text-gray-600">
                Don’t have an account?{' '}
                <Link
                  to="/register"
                  className="text-indigo-600 hover:underline"
                >
                  Register
                </Link>
              </p>
            </div>
        </div>


  );
}