import axios, { AxiosError } from 'axios';

// Base URL from env or fallback
// @ts-ignore
//const API_BASE = import.meta.env.VITE_API_BASE === 'http://localhost:8002'; // (ERROR) Undefined Error (Reading 'VITE_API_BASE')

// Guard against import.env.meta being undefined
const API_BASE = import.meta.env?.VITE_API_BASE || 'http://localhost:8002';

// Create an Axios instance
export const api = axios.create({
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
      const isLoginRequest = error.config?.url?.includes('/auth/login');
      if (!isLoginRequest) {
        localStorage.removeItem('token');
        window.location.href = '/login';
        return Promise.reject(new Error('Unauthorized - redirecting to login'));
      }
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

export interface Song {
  id: number;
  title: string;
  artist: string;
  album: string;
  file_path?: string;
  artwork_path?: string;
  uploaded_by?: number;
  tempo?: number;
  musical_key?: string;
  genre?: string;
  mood?: string;
  energy?: number;
  danceability?: number;
  duration?: number;
}

export interface Playlist {
  id: number;
  name: string;
  songs?: Song[];
  songCount: number;
  is_liked_songs?: boolean;
}

export interface PlaylistDetail extends Playlist {
  songs: Song[];
  is_liked_song?: boolean;
}

// ——— API calls ———————————————————————————————————————————————————

export async function login(
  username: string,
  password: string
): Promise<LoginResponse> {
  // Build a form-encoded payload
  const formBody = new URLSearchParams();
  formBody.append("grant_type", "password");
  formBody.append('username', username);
  formBody.append('password', password);
  const { data } = await api.post<LoginResponse>('/auth/login',
      formBody, {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
  });
  return data;
}

export async function register(
  payload: RegisterRequest
): Promise<RegisterResponse> {
  const { data } = await api.post<RegisterResponse>('/auth/register', payload);
  return data;
}

export async function getProfile(): Promise<UserProfile> {
  const { data } = await api.get<UserProfile>('/auth/users/me');
  return data;
}


// ——— SONG API calls ———————————————————————————————————————————————————
export async function getSongs(skip: number=0, limit: number=100): Promise<Song[]> {
  const { data } = await api.get<Song[]>(`/api/songs?skip=${skip}&limit=${limit}`);
  return data
}

export async function getSong(songId: number): Promise<Song> {
  const { data } = await api.get<Song>(`/api/songs/${songId}`);
  return data
}

// ——— Playlists API calls ———————————————————————————————————————————————————
export async function getPlaylists(): Promise<Playlist[]> {
  const { data } = await api.get<Playlist[]>(`/api/playlists`);
  return data;
}

export async function createPlaylist(name: string): Promise<Playlist> {
  const {data} = await api.post<Playlist>(`/api/playlists`, { name });
  return data
}

export async function getPlaylistDetails(playlistId: number): Promise<Playlist> {
  const { data } = await api.get<PlaylistDetail>(`/api/playlists/${playlistId}`);
  return data
}

export async function updatePlaylist(playlistId: number, name: string): Promise<PlaylistDetail> {
  const { data } = await api.put<PlaylistDetail>(`/api/playlists/${playlistId}`, { name });
  return data
}

export async function deletePlaylist(playlistId: number): Promise<void> {
  await api.delete(`/api/playlists/${playlistId}`);
}

export async function addSongToPlaylist(playlistId: number, song_Id: number): Promise<void> {
  await api.post(`/api/playlists/${playlistId}/tracks?song_id=${song_Id}`);
}

export async function deleteSongFromPlaylist(playlistId: number, songId: number): Promise<void> {
  await api.delete(`/api/playlists/${playlistId}/tracks/${songId}`);
}

// ——— Liked Songs API ———————————————————————————————————————————————————

export async function getLikedSongsPlaylist(): Promise<PlaylistDetail> {
  const { data } = await api.get<PlaylistDetail>(`/api/playlists/special/liked-songs`);
  return data;
}

export async function addSongToLikedSongs(songId: number): Promise<void> {
  const likedPlaylist = await getLikedSongsPlaylist();
  await addSongToPlaylist(likedPlaylist.id, songId);
}

export async function deleteSongFromLikedSongs(songId: number): Promise<void> {
  const likedPlaylist = await getLikedSongsPlaylist();
  await deleteSongFromPlaylist(likedPlaylist.id, songId);
}

export async function isSongLiked(songId: number): Promise<boolean> {
  try {
    const likedPlaylist = await getLikedSongsPlaylist();
    return likedPlaylist.songs.some(song => song.id === songId);
  } catch {
    return false;
  }
}
