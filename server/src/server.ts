import { createServer } from 'http';
import { Server } from 'socket.io';
import { Express } from 'express';
import { ALLOWED_ORIGINS } from './config/constants';

export function createHttpServer(app: Express) {
  const httpServer = createServer(app);

  const io = new Server(httpServer, {
    cors: {
      origin: ALLOWED_ORIGINS,
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  return { httpServer, io };
}
