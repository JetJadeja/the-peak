import { GameStateManager } from './game/state';
import { createApp } from './app';
import { createHttpServer } from './server';
import { registerSocketHandlers } from './socket/handlers';
import { PORT } from './config/constants';

// Initialize game state manager
const gameStateManager = new GameStateManager();

// Create Express app
const app = createApp(gameStateManager);

// Create HTTP server and Socket.io
const { httpServer, io } = createHttpServer(app);

// Register socket handlers
registerSocketHandlers(io, gameStateManager);

// Start server
httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
