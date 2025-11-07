import { Vector3 } from '../types/common';

export interface JoinGamePayload {
  username: string;
  color: string;
}

export interface PlayerUpdatePayload {
  position: Vector3;
  rotation: Vector3;
  velocity: Vector3;
  steeringAngle: number;
}
