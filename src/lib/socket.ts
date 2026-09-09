import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;
let currentUrl: string | null = null;

export const getSocket = (schoolBaseUrl: string): Socket => {
  if (!socket || currentUrl !== schoolBaseUrl) {
    if (socket) socket.disconnect();
    currentUrl = schoolBaseUrl;
    socket = io(schoolBaseUrl, {
      transports: ['websocket', 'polling'],
      autoConnect: true,
    });
  }
  return socket;
};
