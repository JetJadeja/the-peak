import * as THREE from 'three';
import { PlayerCar } from './car';

export class CameraController {
  private camera: THREE.PerspectiveCamera;
  private car: PlayerCar;
  private offset: THREE.Vector3 = new THREE.Vector3(8, 3, 0);

  constructor(camera: THREE.PerspectiveCamera, car: PlayerCar) {
    this.camera = camera;
    this.car = car;
  }

  update(): void {
    const carModel = this.car.getModel();
    if (!carModel) return;

    const cameraOffset = this.offset.clone();
    const carPosition = this.car.getPosition();
    const carQuaternion = this.car.getQuaternion();

    // Apply car's rotation to the camera offset
    cameraOffset.applyQuaternion(carQuaternion);

    // Set camera position behind the car
    const targetCameraPosition = carPosition.clone().add(cameraOffset);
    this.camera.position.lerp(targetCameraPosition, 0.1);

    // Look at the car
    this.camera.lookAt(carPosition.x, carPosition.y + 1, carPosition.z);
  }
}
