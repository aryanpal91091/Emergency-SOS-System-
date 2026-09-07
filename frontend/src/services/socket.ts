import { io, Socket } from 'socket.io-client';

const rawApiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const SOCKET_URL = rawApiUrl.replace(/\/api$/, '');

export const socket: Socket = io(SOCKET_URL, {
  autoConnect: true,
  transports: ['websocket', 'polling'],
  reconnectionAttempts: 5,
  timeout: 10000,
});

socket.on('connect', () => {
  console.log('⚡ [Socket.IO] Connected to ResQRoute Engine:', socket.id);
});

socket.on('connect_error', (err) => {
  console.warn('⚠️ [Socket.IO] Connection notice (gracefully handled):', err.message);
});

socket.on('disconnect', (reason) => {
  console.warn('⚠️ [Socket.IO] Disconnected:', reason);
});
