import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export const getSocket = (schoolBaseUrl: string): Socket => {
  if (!socket || socket.io.uri !== schoolBaseUrl) {
    if (socket) socket.disconnect();
    socket = io(schoolBaseUrl, {
      transports: ['websocket', 'polling'],
      autoConnect: true,
    });
  }
  return socket;
};
