import * as THREE from 'three';
import { PlayerCar } from './car';

export class CameraController {
  private camera: THREE.PerspectiveCamera;
  private player: PlayerCar;
  private offset: THREE.Vector3 = new THREE.Vector3(0, 8, -15);
  private lookAtOffset: THREE.Vector3 = new THREE.Vector3(0, 0, 10);

  constructor(camera: THREE.PerspectiveCamera, player: PlayerCar) {
    this.camera = camera;
    this.player = player;
  }

  update(): void {
    const playerPosition = this.player.getPosition();
    const playerMesh = this.player.getMesh();

    // Calculate camera position behind and above the car
    const cameraOffset = this.offset.clone();
    cameraOffset.applyQuaternion(playerMesh.quaternion);
    const cameraPosition = playerPosition.clone().add(cameraOffset);

    // Smooth camera movement
    this.camera.position.lerp(cameraPosition, 0.1);

    // Look at point slightly ahead of the car
    const lookAtPoint = playerPosition.clone().add(this.lookAtOffset);
    this.camera.lookAt(lookAtPoint);
  }
}
