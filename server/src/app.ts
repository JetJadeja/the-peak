import express from 'express';
import cors from 'cors';
import { GameStateManager } from './game/state';
import { ALLOWED_ORIGINS } from './config/constants';

export function createApp(gameStateManager: GameStateManager) {
  const app = express();

  app.use(cors({
    origin: ALLOWED_ORIGINS,
    credentials: true,
  }));
  app.use(express.json());

  // Health check endpoint
  app.get('/health', (req, res) => {
    res.json({
      status: 'ok',
      players: gameStateManager.getPlayerCount(),
    });
  });

  return app;
}
