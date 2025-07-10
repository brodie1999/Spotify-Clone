// @ts-ignore
import React from "react";
import { createRoot } from "react-dom/client";
import { createBrowserRouter, RouterProvider, Navigate } from "react-router-dom";

import { AuthProvider } from "./contexts/useAuth";
import { Home } from "./components/Home";
import { Register } from "./components/Register";
import { Dashboard } from "./components/Dashboard";


import "./index.css"; // Tailwind style

const token = localStorage.getItem("token");

const router = createBrowserRouter([
    {
        path: "/login",
        element: !token? <Home /> : <Navigate to="/dashboard" replace />,
    },
    {
        path: "/register",
        element: !token? <Register /> : <Navigate to="/register" replace />,
    },
    {
        path: "/dashboard",
        element: !token? <Dashboard /> : <Navigate to="/dashboard" replace />,
    },
    {
        path: "*",
        element: <Navigate to={token ? "/dashboard" : "/login"} replace/>,
    },
]);

const containerElement = document.getElementById("root");
if (!containerElement) throw new Error("Could not find #root element!");

createRoot(containerElement).render(
    <React.StrictMode>
        <AuthProvider children={router}>
            <RouterProvider router = {router} />
        </AuthProvider>
    </React.StrictMode>
);