import { Vector3 } from '../types/common';

export interface JoinGamePayload {
  username: string;
}

export interface PlayerUpdatePayload {
  position: Vector3;
  rotation: Vector3;
  velocity: Vector3;
}
