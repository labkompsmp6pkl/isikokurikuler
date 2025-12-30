import React from 'react';
import ReactDOM from 'react-dom/client';
import { GoogleOAuthProvider } from '@react-oauth/google';
import App from './App.tsx';
import './index.css';

// Ambil Google Client ID dari environment variables
const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

if (!googleClientId) {
  // Sebaiknya jangan melempar error di produksi, tapi tampilkan pesan atau fallback
  // Untuk pengembangan, ini akan membantu memastikan variabel diatur.
  console.error("VITE_GOOGLE_CLIENT_ID is not defined in your environment variables. Google authentication will not work.");
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    {/* Pastikan googleClientId ada sebelum merender provider */}
    {googleClientId ? (
      <GoogleOAuthProvider clientId={googleClientId}>
        <App />
      </GoogleOAuthProvider>
    ) : (
      // Render App tanpa Google Auth jika ID tidak ada, atau tampilkan pesan error
      <App />
    )}
  </React.StrictMode>,
);
