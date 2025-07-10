// @ts-ignore
import React, { createContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import axios from 'axios';
import { loginAPI, registerAPI, UserProfile } from '../services/AuthService';

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
        const user = localStorage.getItem('user');
        const token = localStorage.getItem('token');

        if (user && token) {
            setUser(JSON.parse(user));
            setToken(token);
            axios.defaults.headers.common['Authorization'] = 'Bearer ' + token;
        }
        setIsReady(true);

    }, []) // end of useEffect

    // Wrap register
    const userRegister = async (
        username: string,
        email: string,
        password: string,
    ) => {
        await registerAPI(username, email, password)
        .then((res) => {
            if (res) {
                localStorage.setItem('token', JSON.stringify(res));
                const userObj = {
                    username: res?.data.username,
                    email: res?.data.email,
                };
                localStorage.setItem('user', JSON.stringify(userObj));
                setToken(res?.data.token!);
                setUser(userObj!);
                toast.success('User registered successfully.');
                navigate('/login');
            }
        })
            .catch((e) => toast.warning("Server error occured in registerAPI in useAuth.tsx"))
    }; // End of Register helper

     // Wrap login
    const userLogin = async (username: string, password: string) => {
        await loginAPI(username, password)
            .then((res) => {
                if (res) {
                    localStorage.setItem('token', res?.data.token);
                    const userObj = {
                        username: res?.data.username,
                        email: res?.data.email,
                    };
                    localStorage.setItem('user', JSON.stringify(userObj));
                    setToken(res?.data.token!);
                    setUser(userObj!);
                    toast.success('LOGIN SUCCESS!');
                    navigate('/dashboard');
                }
            })
    }; // End of login helper

    const isLoggedIn  = () => {
        return !!user;
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

