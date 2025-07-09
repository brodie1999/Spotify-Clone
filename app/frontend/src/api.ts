// API UTILITY MODULE FOR OUR REACT APP
// @ts-ignore
const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8001';

// Base response envelope
interface APIError { detail?: string }

// Low level wrapper
async function request<T>(url: string, opts: RequestInit = {}): Promise<T> {
    // Grab up-to-date token
    const token = localStorage.getItem('token');
    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...opts.headers as Record<string, string>,
    };

    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(`$API_BASE=${url}`, {
        ...opts,
        headers,
    });

    // If the token is expired / invalid, force logout
    if (res.status === 401) {
        localStorage.removeItem('token');
        window.location.href ='/'; // Back to login
        throw new Error('Unauthorized - Redirecting to Login');
    }

    if (!res.ok) {
        let err: APIError = {};
        try { err = await res.json(); } catch {}
        throw new Error(err.detail || `${res.status} ${res.statusText}`);
    }

    return res.json()
}

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
    return request<login_response>('/user/login', {
        method: 'POST',
        body: JSON.stringify({ username, password }),
    })
}

export async function register(data : register_request): Promise<register_response> {
    return request<register_response>('/user/register', {
        method: 'POST',
        body: JSON.stringify(data),
    })
}

export async function getProfile(): Promise<user_profile> {
    return request<user_profile>('/user/me', { method: 'GET' });
}