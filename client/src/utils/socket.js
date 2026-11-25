import { io } from 'socket.io-client';

export function getResolvedBackendUrl() {
  const custom = localStorage.getItem('housey_backend_url');
  if (custom) return custom.trim();

  if (import.meta.env.VITE_SERVER_URL) {
    return import.meta.env.VITE_SERVER_URL.trim();
  }

  // If running locally on Vite dev (3000) or client preview, target local server (3001)
  if (typeof window !== 'undefined') {
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      return 'http://localhost:3001';
    }
    return window.location.origin;
  }

  return 'http://localhost:3001';
}

export const socket = io(getResolvedBackendUrl(), {
  autoConnect: true,
  reconnection: true,
  reconnectionAttempts: 20,
  reconnectionDelay: 1000,
  timeout: 4000,
  transports: ['websocket', 'polling']
});

export function setCustomBackendUrl(url) {
  if (url && url.trim()) {
    localStorage.setItem('housey_backend_url', url.trim());
  } else {
    localStorage.removeItem('housey_backend_url');
  }
  window.location.reload();
}
