import express from 'express';
import cors from 'cors';
import { GameStateManager } from './game/state';

export function createApp(gameStateManager: GameStateManager) {
  const app = express();

  app.use(cors());
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
