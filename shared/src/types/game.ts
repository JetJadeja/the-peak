import { Player } from './player';

export interface GameState {
  players: Record<string, Player>;
  timestamp: number;
}
