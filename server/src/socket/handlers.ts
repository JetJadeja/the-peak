import { Server, Socket } from 'socket.io';
import {
  SocketEvent,
  JoinGamePayload,
  PlayerUpdatePayload,
  Player,
} from '@the-peak/shared';
import { GameStateManager } from '../game/state';

export function registerSocketHandlers(
  io: Server,
  gameStateManager: GameStateManager
) {
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
) {
  socket.on(SocketEvent.JOIN_GAME, (payload: JoinGamePayload) => {
    const player: Player = {
      id: socket.id,
      username: payload.username,
      position: { x: 0, y: 0, z: 0 },
      rotation: { x: 0, y: 0, z: 0 },
      velocity: { x: 0, y: 0, z: 0 },
    };

    gameStateManager.addPlayer(player);

    // Send current game state to the new player
    socket.emit(SocketEvent.GAME_STATE, gameStateManager.getState());

    // Notify all other players about the new player
    socket.broadcast.emit(SocketEvent.PLAYER_JOINED, player);

    console.log(`Player joined: ${payload.username} (${socket.id})`);
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
