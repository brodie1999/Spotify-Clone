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
        <div className="max-w-md mx-auto mt-20 p-6 bg-white rounded shadow">
      <h1 className="text-xl mb-4">Log In</h1>
      {error && <p className="text-red-500 mb-2">{error}</p>}
      <form onSubmit={handleSubmit}>
        <label className="block mb-2">
          Username
          <input
            type="text"
            value={username}
            onChange={e => setUsername(e.target.value)}
            className="w-full border px-2 py-1 rounded"
          />
        </label>
        <label className="block mb-4">
          Password
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="w-full border px-2 py-1 rounded"
          />
        </label>
        <button
          type="submit"
          className="w-full py-2 rounded bg-blue-600 text-white hover:bg-blue-700"
        >
          Log In
        </button>
          <p className="mt-4 text-center text-sm">
                Don't have an account?{" "}
                <Link to="/register" className="text-blue-600 hover:underline">
                    Register Here
                </Link>
            </p>
      </form>
    </div>
  );
}