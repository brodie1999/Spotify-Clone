// @ts-ignore
import React, { createContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { UserProfile } from '../services/AuthService';

interface UserContextType {
    token : string | null;
    user: UserProfile | null;
    userLogin: (username: string, password: string) => void;
    userRegister: ( username:string, email: string, password: string ) => void;
    logout: () => void;
    isLoggedIn : () => boolean;
};

const UserContext = createContext<UserContextType>({} as UserContextType);

export const AuthProvider = ( {children} : {children: React.ReactNode} ) => {
    const navigate = useNavigate();
    const [token, setToken] = useState<string | null>(null);
    const [user, setUser]  = useState<UserProfile | null>(null);
    const [isReady, setIsReady] = useState(false);

    // Whenever token changes, set it on axios and reload profile
    useEffect( () => {
        const savedUser = localStorage.getItem('user');
        const savedToken = localStorage.getItem('token');

        if (savedUser && savedToken) {
            try {
                setUser(JSON.parse(savedUser));
                setToken(savedToken);
                axios.defaults.headers.common['Authorization'] = 'Bearer ' + savedToken;
            } catch (error) {
                // Clear invalid stored data
                localStorage.removeItem('user');
                localStorage.removeItem('token');
            }
        }
        setIsReady(true);

    }, []); // end of useEffect

    // Wrap register
    const userRegister = async (username: string, email: string, password: string) => {
        try {
            const response = await axios.post("http://localhost:8002/auth/register", {
                username, email, password
            });

            const userObj = { username: response.data.username, email: response.data.email };

            localStorage.setItem('user', JSON.stringify(userObj));
            setUser(userObj);

            navigate('/login');
        } catch (error) {
            console.error('Registration error: ', error);
            throw new Error(error.response?.data?.detail || 'Registration Failed');
        }
    }; // End of Register helper

     // Wrap login
    const userLogin = async (username: string, password: string) => {
       try {
            // Create form data for OAuth2PasswordRequestForm
            const formData = new URLSearchParams();
            formData.append('username', username);
            formData.append('password', password);
            formData.append('grant_type', 'password');

            const response = await axios.post('http://localhost:8002/auth/login', formData, {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
            });

            const accessToken = response.data.access_token;

            // Set token for future requests
            axios.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;

            // Get user profile
            const profileResponse = await axios.get('http://localhost:8002/auth/users/me');

            const userObj = {
                username: profileResponse.data.username,
                email: profileResponse.data.email,
            };

            localStorage.setItem('token', accessToken);
            localStorage.setItem('user', JSON.stringify(userObj));
            setToken(accessToken);
            setUser(userObj);

            navigate('/dashboard');
        } catch (error: any) {
            console.error('Login error:', error);
            throw new Error(error.response?.data?.detail || 'Login failed');
        }
    }; // End of login helper

    const isLoggedIn  = () => {
        return !!user && !!token;
    };

    // Logout helper
    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
        setToken("");
        navigate('/');
    }; // End of logout helper

    return (
        <UserContext.Provider
            value={{ token, user, userLogin, userRegister, isLoggedIn, logout }}
        >

            { isReady ? children: null }
        </UserContext.Provider>
    );
};

export const useAuth = () => React.useContext(UserContext);

