
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Home } from "./components/Home";
import { Register } from "./components/Register";
import { Dashboard } from "./components/Dashboard";
import "./index.css";

function App() {
    const token = localStorage.getItem("token");

    return (
        <BrowserRouter>
      <Routes>
        {/* Login */}
        <Route
          path="/"
          element={!token ? <Home /> : <Navigate to="/dashboard" />}
        />

        {/* Register */}
        <Route
          path="/register"
          element={!token ? <Register /> : <Navigate to="/dashboard" />}
        />

        {/* Protected */}
        <Route
          path="/dashboard"
          element={token ? <Dashboard /> : <Navigate to="/" replace />}
        />

        {/* Fallback */}
        <Route
          path="*"
          element={<Navigate to={token ? "/dashboard" : "/"} />}
        />
      </Routes>
    </BrowserRouter>
    );
}

export default App;

