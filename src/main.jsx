import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

// ─── Service Worker Registration (production only) ───
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then((reg) => {
        console.log('[Forkling] SW registered:', reg.scope);
      })
      .catch((err) => {
        console.warn('[Forkling] SW registration failed:', err);
      });
  });
}
