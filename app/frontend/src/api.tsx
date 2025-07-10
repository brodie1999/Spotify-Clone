import axios, { AxiosError } from 'axios';

// Base URL from env or fallback
// @ts-ignore
const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8002'; // (ERROR) Undefined Error (Reading 'VITE_API_BASE')

// Create an Axios instance
const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add the JWT to all requests, if present
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers!['Authorization'] = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 globally and unwrap error messages
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/'; // redirect to log in
      return Promise.reject(new Error('Unauthorized – redirecting to login'));
    }

    // Try to pull out detail message from FastAPI error shape
    const detail = (error.response?.data as any)?.detail;
    return Promise.reject(new Error(detail || error.message));
  }
);

// ——— Types ———————————————————————————————————————————————————————

export interface LoginResponse {
  access_token: string;
  token_type: 'bearer';
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
}

export interface RegisterResponse {
  access_token: string;
  token_type: 'bearer';
}

export interface UserProfile {
  username: string;
  email?: string;
}

// ——— API calls ———————————————————————————————————————————————————

export async function login(
  username: string,
  password: string
): Promise<LoginResponse> {
  const { data } = await api.post<LoginResponse>('/user/login', {
    username,
    password,
  });
  return data;
}

export async function register(
  payload: RegisterRequest
): Promise<RegisterResponse> {
  const { data } = await api.post<RegisterResponse>('/user/register', payload);
  return data;
}

export async function getProfile(): Promise<UserProfile> {
  const { data } = await api.get<UserProfile>('/user/me');
  return data;
}