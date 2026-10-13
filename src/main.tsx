import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Register service worker for Android direct PWA installation capability
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch((err) => {
      console.warn('SW registration skipped:', err);
    });
  });
}

createRoot(document.getElementById('root')!).render(<App />);
