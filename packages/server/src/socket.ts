import { Server as HttpServer } from 'http';
import { Server } from 'socket.io';
import { verifyToken } from './lib/jwt';

let io: Server;

export function initSocket(httpServer: HttpServer) {
  io = new Server(httpServer, {
    cors: { origin: '*' },
  });

  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) return next(new Error('Authentication error'));
    try {
      const decoded = verifyToken(token);
      (socket as any).userId = decoded.userId;
      next();
    } catch {
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', (socket) => {
    console.log('User connected:', (socket as any).userId);

    socket.on('join-board', (boardId: string) => {
      socket.join(`board:${boardId}`);
    });

    socket.on('leave-board', (boardId: string) => {
      socket.leave(`board:${boardId}`);
    });
  });

  return io;
}

export function getIO() {
  if (!io) throw new Error('Socket.io not initialized');
  return io;
}