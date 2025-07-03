// @ts-ignore
import React from 'react';
// @ts-ignore
import ReactDOM from 'react-dom';
// @ts-ignore
import App from './App.tsx';
import {createRoot} from "react-dom/client";
import './index.css'; // Tailwind style

// 1. GRAB YOUR ROOT DIV
const container = document.getElementById('root');
if (!container) throw new Error("Couldn't find #root");

// 2. Create a root and render
const root = createRoot(container);
root.render(
    <React.StrictMode>
         <App />
    </React.StrictMode>
);
