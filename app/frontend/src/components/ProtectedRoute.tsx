import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/useAuth";
import React, {JSX} from "react";

export function ProtectedRoute({ children }: { children: JSX.Element }) {
    const token= localStorage.getItem("token");
    const location = useLocation();

    if (!token) {
        // Not logged in, save where they tried to go
        return <Navigate to="/login" state={{ from: location }} replace />
    }

    return children;
}