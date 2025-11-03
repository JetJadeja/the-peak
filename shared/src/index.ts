// Shared types for client-server communication

export interface Player {
  id: string;
  username: string;
  position: Vector3;
  rotation: Vector3;
  velocity: Vector3;
}

export interface Vector3 {
  x: number;
  y: number;
  z: number;
}

export interface GameState {
  players: Record<string, Player>;
  timestamp: number;
}

// Socket.io event types
export enum SocketEvent {
  // Client to Server
  JOIN_GAME = 'join_game',
  LEAVE_GAME = 'leave_game',
  PLAYER_UPDATE = 'player_update',
  
  // Server to Client
  GAME_STATE = 'game_state',
  PLAYER_JOINED = 'player_joined',
  PLAYER_LEFT = 'player_left',
  PLAYER_UPDATED = 'player_updated',
}

export interface JoinGamePayload {
  username: string;
}

export interface PlayerUpdatePayload {
  position: Vector3;
  rotation: Vector3;
  velocity: Vector3;
}
