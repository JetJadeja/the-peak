import { io, Socket } from 'socket.io-client';
import {
  SocketEvent,
  GameState,
  Player,
  JoinGamePayload,
  PlayerUpdatePayload,
} from '@the-peak/shared';
import { PlayerManager } from '../game/player';
import { SERVER_URL } from '../config/constants';

export class NetworkManager {
  private socket: Socket;
  private playerManager: PlayerManager;

  constructor(playerManager: PlayerManager) {
    this.socket = io(SERVER_URL);
    this.playerManager = playerManager;
    this.setupEventHandlers();
  }

  private setupEventHandlers(): void {
    this.socket.on('connect', () => this.handleConnect());
    this.socket.on(SocketEvent.GAME_STATE, (state: GameState) =>
      this.handleGameState(state)
    );
    this.socket.on(SocketEvent.PLAYER_JOINED, (player: Player) =>
      this.handlePlayerJoined(player)
    );
    this.socket.on(SocketEvent.PLAYER_LEFT, ({ id }: { id: string }) =>
      this.handlePlayerLeft(id)
    );
    this.socket.on(
      SocketEvent.PLAYER_UPDATED,
      (data: { id: string } & PlayerUpdatePayload) =>
        this.handlePlayerUpdated(data)
    );
  }

  private handleConnect(): void {
    console.log('Connected to server');
    const payload: JoinGamePayload = {
      username: `Player_${Math.floor(Math.random() * 1000)}`,
    };
    this.socket.emit(SocketEvent.JOIN_GAME, payload);
  }

  private handleGameState(state: GameState): void {
    console.log('Received game state', state);
    // Initialize all existing players
    Object.values(state.players).forEach((player) => {
      if (player.id !== this.socket.id && !this.playerManager.hasPlayer(player.id)) {
        this.playerManager.addPlayer(player);
      }
    });
  }

  private handlePlayerJoined(player: Player): void {
    console.log('Player joined', player);
    if (player.id !== this.socket.id) {
      this.playerManager.addPlayer(player);
    }
  }

  private handlePlayerLeft(id: string): void {
    console.log('Player left', id);
    this.playerManager.removePlayer(id);
  }

  private handlePlayerUpdated(data: { id: string } & PlayerUpdatePayload): void {
    this.playerManager.updatePlayer(data.id, data.position, data.rotation);
  }

  getSocketId(): string | undefined {
    return this.socket.id;
  }
}
