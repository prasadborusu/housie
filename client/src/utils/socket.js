import { io } from 'socket.io-client';

const socketUrl =
  import.meta.env.VITE_SERVER_URL ||
  (window.location.port === '3000' ? 'http://localhost:3001' : window.location.origin);

export const socket = io(socketUrl, {
  autoConnect: true,
  reconnection: true,
  reconnectionAttempts: 15,
  reconnectionDelay: 1000,
  transports: ['websocket', 'polling']
});

