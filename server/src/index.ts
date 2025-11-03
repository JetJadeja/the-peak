import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import {
  SocketEvent,
  JoinGamePayload,
  PlayerUpdatePayload,
  GameState,
  Player,
} from '@the-peak/shared';

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    methods: ['GET', 'POST'],
  },
});

app.use(cors());
app.use(express.json());

// Game state
const gameState: GameState = {
  players: {},
  timestamp: Date.now(),
};

// Basic health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', players: Object.keys(gameState.players).length });
});

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log(`Client connected: ${socket.id}`);

  // Handle player joining
  socket.on(SocketEvent.JOIN_GAME, (payload: JoinGamePayload) => {
    const player: Player = {
      id: socket.id,
      username: payload.username,
      position: { x: 0, y: 0, z: 0 },
      rotation: { x: 0, y: 0, z: 0 },
      velocity: { x: 0, y: 0, z: 0 },
    };

    gameState.players[socket.id] = player;
    gameState.timestamp = Date.now();

    // Send current game state to the new player
    socket.emit(SocketEvent.GAME_STATE, gameState);

    // Notify all other players about the new player
    socket.broadcast.emit(SocketEvent.PLAYER_JOINED, player);

    console.log(`Player joined: ${payload.username} (${socket.id})`);
  });

  // Handle player updates
  socket.on(SocketEvent.PLAYER_UPDATE, (payload: PlayerUpdatePayload) => {
    const player = gameState.players[socket.id];
    if (player) {
      player.position = payload.position;
      player.rotation = payload.rotation;
      player.velocity = payload.velocity;
      gameState.timestamp = Date.now();

      // Broadcast update to all other players
      socket.broadcast.emit(SocketEvent.PLAYER_UPDATED, {
        id: socket.id,
        ...payload,
      });
    }
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    const player = gameState.players[socket.id];
    if (player) {
      delete gameState.players[socket.id];
      gameState.timestamp = Date.now();

      // Notify all players about the disconnection
      io.emit(SocketEvent.PLAYER_LEFT, { id: socket.id });

      console.log(`Player left: ${player.username} (${socket.id})`);
    }
  });
});

const PORT = process.env.PORT || 3000;

httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
