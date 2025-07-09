// API UTILITY MODULE FOR OUR REACT APP
// @ts-ignore
const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8001';

export interface login_response {
    access_token: string;
    token_type : "bearer";
}

export interface register_request{
    username : string;
    email : string;
    password: string;
}

export interface register_response {
    access_token: string;
    token_type : "bearer";
}

export interface user_profile {
    username: string;
    email?: string;
}

export async function login(username: string, password: string): Promise<login_response> {
    const res = await fetch(`${API_BASE}/users/login`, {
        method: 'POST',
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({ username, password }),
    })

    if (!res.ok) {
        const err = await res.json()
        throw new Error(err.detail || "Login failed.")
    }
    return res.json();
}

export async function register(data : register_request): Promise<register_response> {
    const res = await fetch(`${API_BASE}/users/register`, {
        method: 'POST',
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({ data }),
    })
    if (!res.ok) {
        const err = await res.json()
        throw new Error(err.detail || "Register failed.")
    }
    return res.json();
}

export async function getProfile(token: string): Promise<user_profile> {
    const res = await fetch(`${API_BASE}/users/me`, {
        method: 'GET',
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`},
    })

    if (!res.ok) {
        const err = await res.json()
        throw new Error(err.detail || "Profile failed in getting profile.")
    }
    return res.json();
}