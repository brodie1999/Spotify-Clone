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
        <>
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: '100vh',
            background: 'linear-gradient(to bottom right, #4f46e5, #8333ea)'
          }}
        >
            <div style={{
                  width: "100%",
                  maxWidth: "24rem",
                  backgroundColor: "rgba(255,255,255,0.9)",
                  backdropFilter: "blur(10px)",
                  borderRadius: "1.5rem",
                  boxShadow: "0 10px 15px rgba(0,0,0,0.1)",
                  padding: "2rem",
                }}
            >
              <h1  style={{
                    fontSize: "1.5rem",
                    fontWeight: 600,
                    color: "#1f2937",
                    marginBottom: "1.5rem",
                    textAlign: "center",
                  }}
              >
                Log In
              </h1>
              {error && (
                <p style={{
                      color: "#dc2626",
                      marginBottom: "1rem",
                      textAlign: "center",
                    }}
                   >
                    {error}
                </p>
              )}
              <form onSubmit={handleSubmit} style={{ display: "grid", rowGap: "1rem" }}>
                <div>
                  <label style={{ display: "block", color: "#4b5563", marginBottom: ".25rem" }}>Username</label>
                  <input
                    type="text"
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                    style={{
                        width: "100%",
                        padding: ".5rem .75rem",
                        border: "1px solid #d1d5db",
                        borderRadius: ".5rem",
                        outline: "none",
                      }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", color: "#4b5563", marginBottom: ".25rem" }}>Password</label>
                  <input
                    type="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    style={{
                        width: "100%",
                        padding: ".5rem .75rem",
                        border: "1px solid #d1d5db",
                        borderRadius: ".5rem",
                        outline: "none",
                    }}
                  />
                </div>
                <button
                  type="submit"
                  style=
                {{
                    width: "100%",
                    padding: ".5rem",
                    marginTop: ".5rem",
                    borderRadius: ".5rem",
                    backgroundColor: "#4f46e5",
                    color: "white",
                    fontWeight: 500,
                    border: "none",
                    cursor: "pointer",
                }}
                >
                  Log In
                </button>
              </form>
              <p style=
                     {{
                         marginTop: "1.5rem",
                         textAlign: "center",
                         color: "#6b7280",
                         fontSize: ".875rem"
                     }}
              >
                Don’t have an account?{' '}
                <Link
                  to="/register"
                  style={{
                      color: "#4f46e5",
                      textDecoration: "underline"
                  }}
                >
                  Register
                </Link>
              </p>
            </div>
        </div>

        </>
  );
}