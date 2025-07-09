// @ts-ignore
import React, {
    createContext,
    useState,
    useEffect,
    useCallback,
    ReactNode,
} from 'react';
import { useNavigate } from 'react-router-dom';
import {
    login as apiLogin,
    register as apiRegister,
    getProfile,
    user_profile,
} from '../api';

interface AuthContextType {
    token : string | null;
    user: user_profile | null;
    login: (username: string, password: string) => Promise<void>;
    register: (data: {username:string; email: string; password: string}) => Promise<void>;
    logout: () => void;
}

export const AuthContext = createContext<AuthContextType>({
    token: null,
    user: null,
    login: async() => {},
    register: async() => {},
    logout: () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [token, setToken] = useState<string | null>(
        () => localStorage.getItem('token')
    );

    const [user, setUser] = useState<user_profile | null>(null);
    const navigate = useNavigate();

    // Fetch profile whenever token changes
    const loadUser = useCallback(async () => {
        if (!token) {
            setUser(null);
            return;
        }

        try {
            const profile = await getProfile(token);
            setUser(profile);
        } catch {
            setUser(null);
        }

    }, [token]); // End of AuthProvider

    // Wrap login
    const login = async (username: string, password: string) => {
        const { access_token } = await apiLogin(username, password);
        localStorage.setItem('token', access_token);
        setToken(access_token);
        await loadUser();
        navigate('/dashboard');
    }; // End of login helper

    // Wrap register
    const register = async (data: {
        username: string,
        email: string,
        password: string,
    }) => {
        const { access_token } = await apiRegister(data);
        localStorage.setItem('token', access_token);
        setToken(access_token);
        await loadUser();
        navigate('/dashboard');
    }; // End of Register helper

    // Logout helper
    const logout = () => {
        localStorage.removeItem('token');
        setToken(null);
        setUser(null);
        navigate('/');
    }; // End of logout helper

    return (
        <AuthContext.Provider
            value={{ token, user, login, register, logout }}
        >
        </AuthContext.Provider>
    );

}
