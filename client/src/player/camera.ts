import * as THREE from 'three';
import { PlayerCar } from './car';
import {
  CAMERA_OFFSET,
  CAMERA_LERP_SPEED,
  CAMERA_LOOK_AT_OFFSET_Y,
} from '../config/gameConstants';

export class CameraController {
  private camera: THREE.PerspectiveCamera;
  private car: PlayerCar;
  private offset: THREE.Vector3;

  // Reusable vectors to avoid garbage collection
  private cameraOffset: THREE.Vector3 = new THREE.Vector3();
  private targetCameraPosition: THREE.Vector3 = new THREE.Vector3();
  private lookAtPosition: THREE.Vector3 = new THREE.Vector3();

  constructor(camera: THREE.PerspectiveCamera, car: PlayerCar) {
    this.camera = camera;
    this.car = car;
    this.offset = new THREE.Vector3(
      CAMERA_OFFSET.x,
      CAMERA_OFFSET.y,
      CAMERA_OFFSET.z
    );
  }

  update(): void {
    if (!this.car.isModelReady()) return;

    const carPosition = this.car.getPosition();
    const carQuaternion = this.car.getQuaternion();

    // Reuse vectors instead of creating new ones
    this.cameraOffset.copy(this.offset);
    this.cameraOffset.applyQuaternion(carQuaternion);

    // Set camera position behind the car
    this.targetCameraPosition.copy(carPosition).add(this.cameraOffset);
    this.camera.position.lerp(this.targetCameraPosition, CAMERA_LERP_SPEED);

    // Look at the car
    this.lookAtPosition.set(
      carPosition.x,
      carPosition.y + CAMERA_LOOK_AT_OFFSET_Y,
      carPosition.z
    );
    this.camera.lookAt(this.lookAtPosition);
  }
}
