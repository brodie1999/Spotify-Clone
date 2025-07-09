// @ts-ignore
import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { AuthProvider } from './contexts/AuthContext';
import './index.css'; // Tailwind style

// Grab root div
const container = document.getElementById('root');
if (!container) throw new Error("Couldn't find #root");

// Create a root and render
createRoot(container).render(
    <React.StrictMode>
        <BrowserRouter>
            <AuthProvider children={undefined}>
                <App />
            </AuthProvider>
        </BrowserRouter>
    </React.StrictMode>
);
