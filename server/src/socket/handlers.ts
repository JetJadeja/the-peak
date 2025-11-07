import { Server, Socket } from 'socket.io';
import {
  SocketEvent,
  JoinGamePayload,
  PlayerUpdatePayload,
  Player,
} from '@the-peak/shared';
import { GameStateManager } from '../game/state';
import { generateRandomSpawnPosition } from '../utils/spawnUtils';
import {
  DEFAULT_PLAYER_ROTATION,
  DEFAULT_PLAYER_VELOCITY,
  DEFAULT_PLAYER_COLOR,
} from '../config/gameConstants';
import { validateUsername, sanitizeUsername, validateColor } from '../utils/validation';

export function registerSocketHandlers(
  io: Server,
  gameStateManager: GameStateManager
): void {
  io.on('connection', (socket: Socket) => {
    console.log(`Client connected: ${socket.id}`);

    handleJoinGame(socket, io, gameStateManager);
    handlePlayerUpdate(socket, io, gameStateManager);
    handleDisconnect(socket, io, gameStateManager);
  });
}

function handleJoinGame(
  socket: Socket,
  io: Server,
  gameStateManager: GameStateManager
): void {
  socket.on(SocketEvent.JOIN_GAME, (payload: JoinGamePayload) => {
    // Validate username
    const usernameValidation = validateUsername(payload.username);
    if (!usernameValidation.isValid) {
      console.warn(`Invalid username attempt: ${usernameValidation.error} (${socket.id})`);
      socket.emit('error', { message: usernameValidation.error });
      return;
    }

    // Validate color (optional, use default if not provided or invalid)
    let playerColor = DEFAULT_PLAYER_COLOR;
    if (payload.color) {
      const colorValidation = validateColor(payload.color);
      if (colorValidation.isValid) {
        playerColor = payload.color;
      } else {
        console.warn(`Invalid color attempt: ${colorValidation.error} (${socket.id}), using default`);
      }
    }

    // Sanitize username
    const sanitizedUsername = sanitizeUsername(payload.username);

    const spawnPosition = generateRandomSpawnPosition();

    const player: Player = {
      id: socket.id,
      username: sanitizedUsername,
      position: spawnPosition,
      rotation: { ...DEFAULT_PLAYER_ROTATION },
      velocity: { ...DEFAULT_PLAYER_VELOCITY },
      color: playerColor,
      steeringAngle: 0,
    };

    gameStateManager.addPlayer(player);

    // Send current game state to the new player
    socket.emit(SocketEvent.GAME_STATE, gameStateManager.getState());

    // Notify all other players about the new player
    socket.broadcast.emit(SocketEvent.PLAYER_JOINED, player);

    console.log(`Player joined: ${sanitizedUsername} (${socket.id}) with color ${playerColor} at position (${spawnPosition.x.toFixed(1)}, ${spawnPosition.y.toFixed(1)}, ${spawnPosition.z.toFixed(1)})`);
  });
}

function handlePlayerUpdate(
  socket: Socket,
  io: Server,
  gameStateManager: GameStateManager
) {
  socket.on(SocketEvent.PLAYER_UPDATE, (payload: PlayerUpdatePayload) => {
    const player = gameStateManager.getPlayer(socket.id);
    if (player) {
      gameStateManager.updatePlayer(socket.id, {
        position: payload.position,
        rotation: payload.rotation,
        velocity: payload.velocity,
        steeringAngle: payload.steeringAngle,
      });

      // Broadcast update to all other players
      socket.broadcast.emit(SocketEvent.PLAYER_UPDATED, {
        id: socket.id,
        ...payload,
      });
    }
  });
}

function handleDisconnect(
  socket: Socket,
  io: Server,
  gameStateManager: GameStateManager
) {
  socket.on('disconnect', () => {
    const player = gameStateManager.removePlayer(socket.id);
    if (player) {
      // Notify all players about the disconnection
      io.emit(SocketEvent.PLAYER_LEFT, { id: socket.id });

      console.log(`Player left: ${player.username} (${socket.id})`);
    }
  });
}
