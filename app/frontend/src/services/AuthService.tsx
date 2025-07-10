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
        const data = await axios.post<UserProfileToken>(api + "/dashboard", {
            username: username, password: password
        });
        return data;
    } catch (error) {
        console.log("ERROR: Unable to login" + error);
    }
};

export const registerAPI = async (email: string, username:string, password:string) => {
    try {
        const data = await axios.post<UserProfileToken>(api + "/register", {
            email: email,
            username: username,
            password: password,
        });
        return data;
    } catch (error) {
        console.log("ERROR: Unable to register: " + error);
    }
};