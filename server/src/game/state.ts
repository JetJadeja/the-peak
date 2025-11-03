import { GameState } from '@the-peak/shared';

export class GameStateManager {
  private state: GameState;

  constructor() {
    this.state = {
      players: {},
      timestamp: Date.now(),
    };
  }

  getState(): GameState {
    return this.state;
  }

  updateTimestamp(): void {
    this.state.timestamp = Date.now();
  }

  getPlayerCount(): number {
    return Object.keys(this.state.players).length;
  }

  addPlayer(player: GameState['players'][string]): void {
    this.state.players[player.id] = player;
    this.updateTimestamp();
  }

  removePlayer(playerId: string): GameState['players'][string] | null {
    const player = this.state.players[playerId];
    if (player) {
      delete this.state.players[playerId];
      this.updateTimestamp();
      return player;
    }
    return null;
  }

  getPlayer(playerId: string): GameState['players'][string] | undefined {
    return this.state.players[playerId];
  }

  updatePlayer(
    playerId: string,
    updates: Partial<GameState['players'][string]>
  ): void {
    const player = this.state.players[playerId];
    if (player) {
      Object.assign(player, updates);
      this.updateTimestamp();
    }
  }
}
