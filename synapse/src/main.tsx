import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom'; // 1. Nouvel import
import App from './App.tsx';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    {/* 2. On enveloppe l'App avec le routeur */}
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
);