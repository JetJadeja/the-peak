import * as THREE from 'three';
import { InputHandler } from './input';
import { AssetLoader } from '../utils/assetLoader';
import { Ground } from '../track';
import {
  CAR_MODEL_PATH,
  CAR_SPEED,
  CAR_TURN_SPEED,
  CAR_DECELERATION,
  CAR_MIN_SPEED_THRESHOLD,
  CAR_INITIAL_POSITION,
} from '../config/gameConstants';

export class PlayerCar {
  private model: THREE.Group | null = null;
  private inputHandler: InputHandler;
  private ground: Ground;
  private currentSpeed: number = 0;
  private isReady: boolean = false;

  // Reusable vectors to avoid garbage collection
  private forwardDirection: THREE.Vector3 = new THREE.Vector3();
  private tempVector: THREE.Vector3 = new THREE.Vector3();

  constructor(inputHandler: InputHandler, ground: Ground) {
    this.inputHandler = inputHandler;
    this.ground = ground;
  }

  async load(): Promise<THREE.Group> {
    try {
      const assetLoader = AssetLoader.getInstance();
      const gltf = await assetLoader.loadGLTF(CAR_MODEL_PATH);

      this.model = gltf.scene;
      this.model.position.set(
        CAR_INITIAL_POSITION.x,
        CAR_INITIAL_POSITION.y,
        CAR_INITIAL_POSITION.z
      );
      this.model.rotation.y = 0;
      this.isReady = true;

      return this.model;
    } catch (error) {
      console.error('Failed to load car model:', error);
      throw new Error('Car model loading failed. Please check the model path and try again.');
    }
  }

  update(deltaTime: number): void {
    if (!this.isReady || !this.model) return;

    const input = this.inputHandler.getMovementInput();

    // Update current speed based on forward input
    if (input.forward !== 0) {
      this.currentSpeed = input.forward * CAR_SPEED;
    } else {
      // Slow down when no input
      this.currentSpeed *= CAR_DECELERATION;
    }

    // Rotation (steering) - only turn when moving
    if (Math.abs(this.currentSpeed) > CAR_MIN_SPEED_THRESHOLD) {
      this.model.rotation.y += input.turn * CAR_TURN_SPEED * deltaTime;
    }

    // Forward/backward movement based on car's rotation
    if (Math.abs(this.currentSpeed) > CAR_MIN_SPEED_THRESHOLD) {
      // Reuse vector instead of creating new one
      this.forwardDirection.set(-1, 0, 0);
      this.forwardDirection.applyQuaternion(this.model.quaternion);
      this.forwardDirection.multiplyScalar(this.currentSpeed * deltaTime);

      this.model.position.add(this.forwardDirection);
    }

    // Follow terrain height
    const terrainHeight = this.ground.getHeightAt(
      this.model.position.x,
      this.model.position.z
    );

    // Smoothly interpolate Y position to match terrain
    // 0.5 offset keeps car slightly above ground (suspension)
    const targetY = terrainHeight + 0.5;
    this.model.position.y += (targetY - this.model.position.y) * 0.2;
  }

  getModel(): THREE.Group | null {
    return this.model;
  }

  getPosition(): THREE.Vector3 {
    if (!this.model) return new THREE.Vector3();
    // Reuse temp vector to avoid creating new Vector3
    return this.tempVector.copy(this.model.position);
  }

  getQuaternion(): THREE.Quaternion {
    return this.model?.quaternion.clone() || new THREE.Quaternion();
  }

  getRotation(): { x: number; y: number; z: number } {
    if (!this.model) return { x: 0, y: 0, z: 0 };
    return {
      x: this.model.rotation.x,
      y: this.model.rotation.y,
      z: this.model.rotation.z,
    };
  }

  getVelocity(): { x: number; y: number; z: number } {
    // Calculate velocity based on current speed and direction
    if (!this.model || Math.abs(this.currentSpeed) < CAR_MIN_SPEED_THRESHOLD) {
      return { x: 0, y: 0, z: 0 };
    }

    this.forwardDirection.set(-1, 0, 0);
    this.forwardDirection.applyQuaternion(this.model.quaternion);
    this.forwardDirection.multiplyScalar(this.currentSpeed);

    return {
      x: this.forwardDirection.x,
      y: this.forwardDirection.y,
      z: this.forwardDirection.z,
    };
  }

  isModelReady(): boolean {
    return this.isReady;
  }

  dispose(): void {
    if (this.model) {
      this.model.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.geometry.dispose();

          if (Array.isArray(child.material)) {
            child.material.forEach((material) => material.dispose());
          } else {
            child.material.dispose();
          }
        }
      });
      this.model = null;
    }
    this.isReady = false;
  }
}
