// @ts-ignore
import React from "react";
import { createRoot } from "react-dom/client";
import { createBrowserRouter, RouterProvider, Navigate, Outlet } from "react-router-dom";

import { AuthProvider } from "./contexts/useAuth";
import { Home } from "./components/Home";
import { Register } from "./components/Register";
import { Dashboard } from "./components/Dashboard";
import { ProtectedRoute } from "./components/ProtectedRoute";
import PlaylistBuilder from "./components/PlaylistBuilder";

import "./index.css"; // Tailwind style

// Root layout component that provides AuthContext
function RootLayout() {
    return (
        <AuthProvider children={undefined}>
            <Outlet />
        </AuthProvider>
    );
}

// Helper function to check if user is authenticated
const isAuthenticated = () => {
    return !!localStorage.getItem("token");
}

const router = createBrowserRouter([
    {
        path: "/",
        element: <RootLayout />,
        children: [
            {
                index: true,
                element: <Navigate to={isAuthenticated() ? "/dashboard" : "/login"} replace />
            },
            {
                path: "login",
                element: isAuthenticated() ? <Navigate to="/dashboard" replace /> : <Home />
            },
            {
                path: "register",
                element: isAuthenticated() ? <Navigate to="/login" replace /> : <Register />
            },
            {
              path: "dashboard",
              element: (
                  <ProtectedRoute children={undefined}>
                      <Dashboard />
                  </ProtectedRoute>
              )
            },
            {
              path: "playlists/new",
              element: (
                  <ProtectedRoute children={undefined}>
                      <PlaylistBuilder />
                  </ProtectedRoute>
              )
            },
            {
                path: "*",
                element: <Navigate to={isAuthenticated() ? "/dashboard" : "/login"} replace />
            }
        ]
    }
]);

const containerElement = document.getElementById("root");
if (!containerElement) throw new Error("Could not find container!");

createRoot(containerElement).render(
    <React.StrictMode>
        <RouterProvider router={router} />
    </React.StrictMode>
);