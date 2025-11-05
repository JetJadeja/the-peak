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
  WHEEL_RADIUS,
  RAYCAST_START_HEIGHT,
  DEBUG_SHOW_RAYCASTS,
} from '../config/gameConstants';

export class PlayerCar {
  private model: THREE.Group | null = null;
  private inputHandler: InputHandler;
  private ground: Ground;
  private scene: THREE.Scene | null = null;
  private currentSpeed: number = 0;
  private isReady: boolean = false;

  // Reusable vectors to avoid garbage collection
  private forwardDirection: THREE.Vector3 = new THREE.Vector3();
  private tempVector: THREE.Vector3 = new THREE.Vector3();

  // Raycasting for terrain following
  private raycaster: THREE.Raycaster = new THREE.Raycaster();
  private wheelMeshes: THREE.Object3D[] = [];
  private wheelBottomOffset: number = 0;
  private rayOrigin: THREE.Vector3 = new THREE.Vector3();
  private readonly rayDirection: THREE.Vector3 = new THREE.Vector3(0, -1, 0);
  private wheelWorldPos: THREE.Vector3 = new THREE.Vector3();

  // Debug visualization
  private debugArrows: THREE.ArrowHelper[] = [];

  constructor(inputHandler: InputHandler, ground: Ground, scene?: THREE.Scene) {
    this.inputHandler = inputHandler;
    this.ground = ground;
    this.scene = scene || null;
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

      // Enable shadow casting for all meshes in the car model
      this.model.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });

      // Find wheel meshes for raycasting terrain following
      this.findWheelMeshes();

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

    // Follow terrain height using 4-wheel raycasting (Phase 1: average height only)
    if (this.wheelMeshes.length > 0) {
      // Raycast from each wheel to find ground height at that wheel's X,Z position
      let totalGroundHeight = 0;
      this.wheelMeshes.forEach((wheel, index) => {
        totalGroundHeight += this.getGroundHeightAtWheel(wheel, index);
      });

      // Calculate average ground height across all wheels
      const avgGroundHeight = totalGroundHeight / this.wheelMeshes.length;

      // Set car Y position so wheel bottoms touch the ground
      // Formula: car.y = averageGroundHeight - wheelBottomOffset
      this.model.position.y = avgGroundHeight - this.wheelBottomOffset;
    } else {
      // Fallback: use formula-based approach if wheels weren't found
      // This shouldn't happen - findWheelMeshes() will have logged an error
      const terrainHeight = this.ground.getHeightAt(
        this.model.position.x,
        this.model.position.z
      );
      this.model.position.y = terrainHeight + 0.5;
    }
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

  /**
   * Find wheel meshes in the loaded car model for raycasting.
   * Searches for objects with "wheel" in their name and stores references.
   */
  private findWheelMeshes(): void {
    if (!this.model) {
      console.error('Cannot find wheel meshes: model not loaded');
      return;
    }

    const wheelCandidates: THREE.Object3D[] = [];

    // Strategy 1: Find meshes with "wheel" in the name (excludes "rim")
    this.model.traverse((obj) => {
      const nameLower = obj.name.toLowerCase();
      if (nameLower.includes('wheel') && !nameLower.includes('rim')) {
        wheelCandidates.push(obj);
      }
    });

    // Strategy 2: If we didn't find enough, try the rear wheel parent node
    if (wheelCandidates.length < 4) {
      const rearParent = this.model.getObjectByName('Circle.015');
      if (rearParent) {
        rearParent.children.forEach((child) => {
          if (child.type === 'Mesh' || (child as THREE.Mesh).isMesh) {
            wheelCandidates.push(child);
          }
        });
      }
    }

    // Remove duplicates and take up to 4 wheels
    const uniqueWheels = Array.from(new Set(wheelCandidates));
    this.wheelMeshes = uniqueWheels.slice(0, 4);

    if (this.wheelMeshes.length < 2) {
      console.error(`Found only ${this.wheelMeshes.length} wheel mesh(es). Need at least 2.`);
      console.log('Available objects in car model:');
      this.model.traverse((obj) => {
        if (obj.type === 'Mesh' || obj.type === 'Group') {
          console.log(`  - ${obj.name} (${obj.type})`);
        }
      });
      return;
    }

    console.log(`✓ Found ${this.wheelMeshes.length} wheel meshes:`, this.wheelMeshes.map(w => w.name));
    this.calculateWheelBottomOffset();

    // Create debug visualization lines if enabled
    if (DEBUG_SHOW_RAYCASTS) {
      this.createDebugLines();
    }
  }

  /**
   * Calculate the offset from car center to wheel bottom contact points.
   * This is used to position the car correctly when raycasting finds ground height.
   */
  private calculateWheelBottomOffset(): void {
    if (this.wheelMeshes.length === 0) return;

    // Calculate average Y position of wheel centers using bounding boxes
    let sumY = 0;
    const bbox = new THREE.Box3();
    const center = new THREE.Vector3();

    this.wheelMeshes.forEach((wheel) => {
      bbox.setFromObject(wheel);
      bbox.getCenter(center);
      sumY += center.y;
    });

    const avgWheelCenterY = sumY / this.wheelMeshes.length;

    // Bottom of wheel = center - radius
    this.wheelBottomOffset = avgWheelCenterY - WHEEL_RADIUS;

    console.log(
      `✓ Wheel bottom offset: ${this.wheelBottomOffset.toFixed(3)} ` +
      `(centers at y=${avgWheelCenterY.toFixed(3)}, radius=${WHEEL_RADIUS})`
    );
  }

  /**
   * Create debug visualization arrows for raycasting.
   * One arrow per wheel showing the ray from start height down to ground.
   */
  private createDebugLines(): void {
    if (!this.scene) {
      console.warn('Cannot create debug lines: scene not provided to PlayerCar');
      return;
    }

    const scene = this.scene; // Store reference for forEach callback

    // Create one arrow per wheel
    this.wheelMeshes.forEach(() => {
      // ArrowHelper(direction, origin, length, color, headLength, headWidth)
      const arrow = new THREE.ArrowHelper(
        new THREE.Vector3(0, -1, 0), // direction: straight down
        new THREE.Vector3(0, 0, 0),  // origin: will be updated each frame
        1,                            // length: will be updated each frame
        0xff0000,                     // bright red
        0.5,                          // head length
        0.3                           // head width
      );

      this.debugArrows.push(arrow);
      scene.add(arrow);
    });

    console.log(`✓ Created ${this.debugArrows.length} debug raycast arrows`);
  }

  /**
   * Raycast downward from a wheel's world position to find terrain height.
   * @param wheel - The wheel object to raycast from
   * @returns Ground surface height (Y coordinate) at the wheel's X,Z position
   */
  private getGroundHeightAtWheel(wheel: THREE.Object3D, wheelIndex: number = 0): number {
    // Get wheel's current world position
    wheel.getWorldPosition(this.wheelWorldPos);

    // Set ray origin HIGH above this X,Z position
    // This guarantees the ray starts above terrain (even if car glitches underground)
    this.rayOrigin.set(
      this.wheelWorldPos.x,
      RAYCAST_START_HEIGHT,
      this.wheelWorldPos.z
    );

    // Cast ray straight down
    this.raycaster.set(this.rayOrigin, this.rayDirection);
    const intersects = this.raycaster.intersectObject(this.ground.getMesh());

    let groundHeight = 0;

    if (intersects.length > 0) {
      // Return Y coordinate of ground surface at this wheel position
      groundHeight = intersects[0].point.y;

      // Update debug arrow if enabled
      if (DEBUG_SHOW_RAYCASTS && this.debugArrows[wheelIndex]) {
        this.updateDebugArrow(wheelIndex, this.rayOrigin, intersects[0].point);
      }
    } else {
      // Fallback: if raycast misses (e.g., car drove off terrain edge)
      console.warn('Raycast missed terrain at wheel position:', {
        x: this.wheelWorldPos.x,
        z: this.wheelWorldPos.z,
      });

      // Update debug arrow to show it missed (draw to y=0)
      if (DEBUG_SHOW_RAYCASTS && this.debugArrows[wheelIndex]) {
        const missPoint = new THREE.Vector3(this.wheelWorldPos.x, 0, this.wheelWorldPos.z);
        this.updateDebugArrow(wheelIndex, this.rayOrigin, missPoint);
      }
    }

    return groundHeight;
  }

  /**
   * Update a debug arrow to show the raycast from start to end point.
   * @param arrowIndex - Index of the debug arrow to update
   * @param start - Ray start position (world space)
   * @param end - Ray end position (world space)
   */
  private updateDebugArrow(arrowIndex: number, start: THREE.Vector3, end: THREE.Vector3): void {
    const arrow = this.debugArrows[arrowIndex];
    if (!arrow) return;

    // Set arrow origin to start position
    arrow.position.copy(start);

    // Calculate direction (normalized) and length
    const direction = new THREE.Vector3().subVectors(end, start).normalize();
    const length = start.distanceTo(end);

    // Update arrow direction and length
    arrow.setDirection(direction);
    arrow.setLength(length, 0.5, 0.3); // length, headLength, headWidth
  }

  dispose(): void {
    // Clean up debug arrows
    this.debugArrows.forEach((arrow) => {
      if (this.scene) {
        this.scene.remove(arrow);
      }
      arrow.dispose();
    });
    this.debugArrows = [];

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
