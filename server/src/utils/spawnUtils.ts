import { Vector3 } from '@the-peak/shared';
import { SPAWN_AREA_SIZE, SPAWN_HEIGHT } from '../config/gameConstants';

export function generateRandomSpawnPosition(): Vector3 {
  return {
    x: (Math.random() - 0.5) * SPAWN_AREA_SIZE,
    y: SPAWN_HEIGHT,
    z: (Math.random() - 0.5) * SPAWN_AREA_SIZE,
  };
}
