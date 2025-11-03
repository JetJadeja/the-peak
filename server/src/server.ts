import { createServer } from 'http';
import { Server } from 'socket.io';
import { Express } from 'express';
import { CLIENT_URL } from './config/constants';

export function createHttpServer(app: Express) {
  const httpServer = createServer(app);

  const io = new Server(httpServer, {
    cors: {
      origin: CLIENT_URL,
      methods: ['GET', 'POST'],
    },
  });

  return { httpServer, io };
}
