import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Home } from "./components/Home";
import { Register } from "./components/Register";
import { Dashboard } from "./components/Dashboard";
import { AuthProvider } from "./contexts/useAuth";
import "./index.css";
import React from "react";

function App() {
    const token = localStorage.getItem("token");
    return (
        <AuthProvider>
            <BrowserRouter>
              <Routes>
                {/* Login */}
                <Route
                  path="/login"
                  element={!token ? <Home /> : <Navigate to="/user/login" />}
                />

                {/* Register */}
                <Route
                  path="/register"
                  element={!token ? <Register /> : <Navigate to="/user/register" />}
                />

                {/* Protected */}
                <Route
                  path="/dashboard"
                  element={token ? <Dashboard /> : <Navigate to="/" replace />}
                />

                {/* Fallback */}
                <Route
                  path="*"
                  element={<Navigate to={token ? "/user/login" : "/"} />}
                />
              </Routes>
            </BrowserRouter>
        </AuthProvider>
    );
}

export default App;