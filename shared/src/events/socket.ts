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
