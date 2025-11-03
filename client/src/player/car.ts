import * as THREE from 'three';
import { Terrain } from '../track/terrain';
import { InputHandler } from './input';

export class PlayerCar {
  private mesh: THREE.Mesh;
  private velocity: THREE.Vector3 = new THREE.Vector3();
  private speed: number = 40;
  private turnSpeed: number = 3;
  private terrain: Terrain;
  private inputHandler: InputHandler;
  private currentSpeed: number = 0;

  constructor(scene: THREE.Scene, terrain: Terrain, inputHandler: InputHandler) {
    this.terrain = terrain;
    this.inputHandler = inputHandler;

    // Create car as a simple box - much smaller now
    const geometry = new THREE.BoxGeometry(2, 1, 3);
    const material = new THREE.MeshStandardMaterial({ color: 0xff4444 });
    this.mesh = new THREE.Mesh(geometry, material);
    this.mesh.castShadow = true;

    // Start at the beginning of the valley
    this.mesh.position.set(0, 10, -400);

    scene.add(this.mesh);
  }

  update(deltaTime: number): void {
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
      this.mesh.rotation.y -= input.right * this.turnSpeed * deltaTime * Math.sign(this.currentSpeed);
    }

    // Forward/backward movement based on car's rotation
    if (Math.abs(this.currentSpeed) > 0.1) {
      const forwardDirection = new THREE.Vector3(0, 0, 1);
      forwardDirection.applyQuaternion(this.mesh.quaternion);
      forwardDirection.multiplyScalar(this.currentSpeed * deltaTime);

      this.mesh.position.add(forwardDirection);
    }

    // Apply gravity and terrain following
    this.followTerrain();
  }

  private followTerrain(): void {
    // Get terrain height at current position
    const terrainHeight = this.terrain.getHeightAt(
      this.mesh.position.x,
      this.mesh.position.z
    );


    // Place car on terrain (half the car's height above ground)
    const carHeight = 1.0; // Car is 1 unit tall
    const targetY = terrainHeight + carHeight / 2;

    // Smooth transition to terrain height
    this.mesh.position.y += (targetY - this.mesh.position.y) * 0.2;

    // Align car to terrain slope
    this.alignToTerrain();
  }

  private alignToTerrain(): void {
    // Sample terrain at multiple points to get the slope
    const sampleDistance = 2;

    // Get forward and right vectors based on current rotation
    const forward = new THREE.Vector3(0, 0, 1);
    forward.applyQuaternion(this.mesh.quaternion);
    const right = new THREE.Vector3(1, 0, 0);
    right.applyQuaternion(this.mesh.quaternion);

    // Sample points around the car
    const frontPos = this.mesh.position.clone().add(forward.clone().multiplyScalar(sampleDistance));
    const backPos = this.mesh.position.clone().add(forward.clone().multiplyScalar(-sampleDistance));
    const rightPos = this.mesh.position.clone().add(right.clone().multiplyScalar(sampleDistance));
    const leftPos = this.mesh.position.clone().add(right.clone().multiplyScalar(-sampleDistance));

    // Get heights at each point
    const centerHeight = this.terrain.getHeightAt(this.mesh.position.x, this.mesh.position.z);
    const frontHeight = this.terrain.getHeightAt(frontPos.x, frontPos.z);
    const backHeight = this.terrain.getHeightAt(backPos.x, backPos.z);
    const rightHeight = this.terrain.getHeightAt(rightPos.x, rightPos.z);
    const leftHeight = this.terrain.getHeightAt(leftPos.x, leftPos.z);

    // Calculate pitch (front-back tilt)
    const pitchAngle = Math.atan2(frontHeight - backHeight, sampleDistance * 2);

    // Calculate roll (left-right tilt)
    const rollAngle = Math.atan2(rightHeight - leftHeight, sampleDistance * 2);

    // Store current Y rotation
    const currentYRotation = this.mesh.rotation.y;

    // Apply rotations smoothly
    const smoothing = 0.1;
    this.mesh.rotation.x += (pitchAngle - this.mesh.rotation.x) * smoothing;
    this.mesh.rotation.z += (rollAngle - this.mesh.rotation.z) * smoothing;
    this.mesh.rotation.y = currentYRotation; // Keep steering rotation
  }

  getPosition(): THREE.Vector3 {
    return this.mesh.position.clone();
  }

  getRotation(): THREE.Euler {
    return this.mesh.rotation.clone();
  }

  getMesh(): THREE.Mesh {
    return this.mesh;
  }
}
