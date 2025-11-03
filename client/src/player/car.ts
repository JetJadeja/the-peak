import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { InputHandler } from './input';

export class PlayerCar {
  private model: THREE.Group | null = null;
  private loader: GLTFLoader;
  private inputHandler: InputHandler;
  private speed: number = 20;
  private turnSpeed: number = 2;
  private currentSpeed: number = 0;

  constructor(scene: THREE.Scene, inputHandler: InputHandler) {
    this.loader = new GLTFLoader();
    this.inputHandler = inputHandler;
    this.loadModel(scene);
  }

  private loadModel(scene: THREE.Scene): void {
    this.loader.load(
      '/models/cars/e36.glb',
      (gltf) => {
        this.model = gltf.scene;
        this.model.position.set(0, 0, 0);
        this.model.rotation.y = 0;
        scene.add(this.model);
      },
      undefined,
      (error) => {
        console.error('Error loading car model:', error);
      }
    );
  }

  update(deltaTime: number): void {
    if (!this.model) return;

    const input = this.inputHandler.getMovementInput();

    // Update current speed based on forward input
    if (input.forward !== 0) {
      this.currentSpeed = input.forward * this.speed;
    } else {
      // Slow down when no input
      this.currentSpeed *= 0.95;
    }

    // Rotation (steering) - only turn when moving
    if (Math.abs(this.currentSpeed) > 0.1) {
      this.model.rotation.y += input.turn * this.turnSpeed * deltaTime;
    }

    // Forward/backward movement based on car's rotation
    if (Math.abs(this.currentSpeed) > 0.1) {
      const forwardDirection = new THREE.Vector3(-1, 0, 0);
      forwardDirection.applyQuaternion(this.model.quaternion);
      forwardDirection.multiplyScalar(this.currentSpeed * deltaTime);

      this.model.position.add(forwardDirection);
    }
  }

  getModel(): THREE.Group | null {
    return this.model;
  }

  getPosition(): THREE.Vector3 {
    return this.model?.position.clone() || new THREE.Vector3();
  }

  getQuaternion(): THREE.Quaternion {
    return this.model?.quaternion.clone() || new THREE.Quaternion();
  }
}
