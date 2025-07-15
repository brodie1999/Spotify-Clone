import axios from 'axios';

export type UserProfileToken = {
    username: string;
    email: string;
    token: string;
};

export type UserProfile = {
    username: string;
    email: string;
};

const api = "http://localhost:8002/";

export const loginAPI = async (username: string, password: string) => {
    try {
        // Create form data for OAuth2PasswordRequestFrom
        const formData = new FormData();
        formData.append("username", username);
        formData.append("password", password);
        formData.append("grant_type", "password");

        const response = await axios.post(`${api}/auth/login`, formData, {
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
            },
        });

        return {
            data: {
                token: response.data.access_token,
                username: username,
                email: '',
            }
        };
    } catch (error) {
        console.log("ERROR: Unable to login ", error);
        throw error;
    }
};

export const registerAPI = async (email: string, username:string, password:string) => {
    try {
        const response = await axios.post(`${api}/auth/register`, {
            username: username,
            email: email,
            password: password,
        });

        return {
            data: {
                token: response.data.access_token || '', // Register might not return a token
                username: response.data.username,
                email: response.data.email,
            }
        };
    } catch (error) {
        console.log("ERROR: Unable to register:", error);
        throw error;
    }
};