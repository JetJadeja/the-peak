import { io, Socket } from 'socket.io-client';
import {
  SocketEvent,
  GameState,
  Player,
  JoinGamePayload,
  PlayerUpdatePayload,
} from '@the-peak/shared';
import { SERVER_URL } from '../config/constants';

export class NetworkManager {
  private socket: Socket;
  private playerId?: string;

  // Event callbacks
  private onGameState?: (state: GameState) => void;
  private onPlayerJoined?: (player: Player) => void;
  private onPlayerLeft?: (playerId: string) => void;
  private onPlayerUpdated?: (data: { id: string } & PlayerUpdatePayload) => void;
  private onError?: (error: string) => void;

  constructor() {
    this.socket = io(SERVER_URL);
    this.setupEventHandlers();
  }

  private setupEventHandlers(): void {
    this.socket.on('connect', () => {
      console.log('Connected to server');
      this.playerId = this.socket.id;
    });

    this.socket.on('disconnect', () => {
      console.log('Disconnected from server');
    });

    this.socket.on('error', (data: { message: string }) => {
      console.error('Server error:', data.message);
      this.onError?.(data.message);
    });

    this.socket.on(SocketEvent.GAME_STATE, (state: GameState) => {
      this.onGameState?.(state);
    });

    this.socket.on(SocketEvent.PLAYER_JOINED, (player: Player) => {
      this.onPlayerJoined?.(player);
    });

    this.socket.on(SocketEvent.PLAYER_LEFT, ({ id }: { id: string }) => {
      this.onPlayerLeft?.(id);
    });

    this.socket.on(
      SocketEvent.PLAYER_UPDATED,
      (data: { id: string } & PlayerUpdatePayload) => {
        this.onPlayerUpdated?.(data);
      }
    );
  }

  joinGame(username: string): void {
    const payload: JoinGamePayload = { username };
    this.socket.emit(SocketEvent.JOIN_GAME, payload);
  }

  sendPlayerUpdate(update: PlayerUpdatePayload): void {
    this.socket.emit(SocketEvent.PLAYER_UPDATE, update);
  }

  setOnGameState(callback: (state: GameState) => void): void {
    this.onGameState = callback;
  }

  setOnPlayerJoined(callback: (player: Player) => void): void {
    this.onPlayerJoined = callback;
  }

  setOnPlayerLeft(callback: (playerId: string) => void): void {
    this.onPlayerLeft = callback;
  }

  setOnPlayerUpdated(
    callback: (data: { id: string } & PlayerUpdatePayload) => void
  ): void {
    this.onPlayerUpdated = callback;
  }

  setOnError(callback: (error: string) => void): void {
    this.onError = callback;
  }

  getPlayerId(): string | undefined {
    return this.playerId;
  }

  dispose(): void {
    this.socket.disconnect();
  }
}
