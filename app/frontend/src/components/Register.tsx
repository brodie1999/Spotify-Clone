// @ts-ignore
import React, { useState } from "react";
import { register} from "../api";
import { useNavigate, Link } from "react-router-dom";

export function Register() {
    const [form, setForm]  = useState({ username: "", email: "", password: "" });
    const [error, setError] = useState<string | null>(null);
    const navigate = useNavigate();

    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setForm({...form, [event.target.name]: event.target.value});
    }

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        try {
            const { access_token } = await register(form);
            localStorage.setItem("token", access_token);
            navigate("/dashboard");
        } catch (error: any) {
            setError(error.message);
        }

    };
    return (
        <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "100vh",
        background: "linear-gradient(to bottom right, #4f46e5, #9333ea)",
        padding: "1rem",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "24rem",
          backgroundColor: "rgba(255,255,255,0.9)",
          backdropFilter: "blur(10px)",
          borderRadius: "1.5rem",
          boxShadow: "0 10px 15px rgba(0,0,0,0.1)",
          padding: "2rem",
        }}
      >
        <h1
          style={{
            fontSize: "1.5rem",
            fontWeight: 600,
            color: "#1f2937",
            marginBottom: "1.5rem",
            textAlign: "center",
          }}
        >
          Create Account
        </h1>
        {error && (
          <p
            style={{
              color: "#dc2626",
              marginBottom: "1rem",
              textAlign: "center",
            }}
          >
            {error}
          </p>
        )}
        <form
          onSubmit={handleSubmit}
          style={{ display: "grid", rowGap: "1rem" }}
        >
          <div>
            <label
              htmlFor="username"
              style={{
                display: "block",
                color: "#4b5563",
                marginBottom: "0.25rem",
                fontWeight: 500,
              }}
            >
              Username
            </label>
            <input
              id="username"
              name="username"
              value={form.username}
              onChange={handleChange}
              style={{
                width: "100%",
                padding: "0.5rem 0.75rem",
                border: "1px solid #d1d5db",
                borderRadius: "0.5rem",
                outline: "none",
              }}
            />
          </div>

          <div>
            <label
              htmlFor="email"
              style={{
                display: "block",
                color: "#4b5563",
                marginBottom: "0.25rem",
                fontWeight: 500,
              }}
            >
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              style={{
                width: "100%",
                padding: "0.5rem 0.75rem",
                border: "1px solid #d1d5db",
                borderRadius: "0.5rem",
                outline: "none",
              }}
            />
          </div>

          <div>
            <label
              htmlFor="password"
              style={{
                display: "block",
                color: "#4b5563",
                marginBottom: "0.25rem",
                fontWeight: 500,
              }}
            >
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              value={form.password}
              onChange={handleChange}
              style={{
                width: "100%",
                padding: "0.5rem 0.75rem",
                border: "1px solid #d1d5db",
                borderRadius: "0.5rem",
                outline: "none",
              }}
            />
          </div>

          <button
            type="submit"
            style={{
              width: "100%",
              padding: "0.75rem",
              borderRadius: "0.5rem",
              backgroundColor: "#4f46e5",
              color: "#ffffff",
              fontWeight: 500,
              border: "none",
              cursor: "pointer",
              marginTop: "0.5rem",
            }}
          >
            Register
          </button>
        </form>

        <p
          style={{
            marginTop: "1.5rem",
            textAlign: "center",
            color: "#6b7280",
            fontSize: "0.875rem",
          }}
        >
          Already have an account?{" "}
          <Link
            to="/login"
            style={{ color: "#4f46e5", textDecoration: "underline" }}
          >
            Log in
          </Link>
        </p>
      </div>
    </div>
    );
}
