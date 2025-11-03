import { Vector3 } from './common';

export interface Player {
  id: string;
  username: string;
  position: Vector3;
  rotation: Vector3;
  velocity: Vector3;
}
