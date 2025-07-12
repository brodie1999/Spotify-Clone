import React from "react";
import { createRoot } from "react-dom/client";
import { createBrowserRouter, RouterProvider, Navigate } from "react-router-dom";

import { AuthProvider } from "./contexts/useAuth";
import { Home } from "./components/Home";
import { Register } from "./components/Register";
import { Dashboard } from "./components/Dashboard";
import { ProtectedRoute } from "./components/ProtectedRoute";

import "./index.css"; // Tailwind style

const token = localStorage.getItem("token");

const router = createBrowserRouter([
    { path: "/login", element: <Home />},
    { path: "/register", element: <Register />},
    { path: "/dashboard", element: (
        <ProtectedRoute>
            <Dashboard />
        </ProtectedRoute>
        )},
    { path: "*", element: <Navigate to="/login" replace /> }
]);

const containerElement = document.getElementById("root");
if (!containerElement) throw new Error("Could not find #root element!");

createRoot(containerElement).render(
    <React.StrictMode>
            <RouterProvider router = {router} />
    </React.StrictMode>
);