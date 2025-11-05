import * as THREE from 'three';
import { WheelConfig, WheelInfo } from './types';

/**
 * Default wheel detection configuration
 */
const DEFAULT_CONFIG: Required<WheelConfig> = {
  wheelNames: [
    'front-left-wheel',
    'front-right-wheel',
    'back-left-wheel',
    'back-right-wheel',
  ],
  parentNames: ['Circle.015'],
  fallbackTerms: ['wheel', 'tire'],
  minWheels: 2,
  maxWheels: 4,
};

/**
 * Manages wheel detection and tracking for vehicles.
 * Provides multiple strategies for finding wheels in different model structures.
 */
export class WheelSystem {
  private wheels: WheelInfo[] = [];
  private config: Required<WheelConfig>;
  private wheelBottomOffset: number = 0;
  private initialized: boolean = false;

  // Reusable objects for calculations (object pool)
  private bbox: THREE.Box3 = new THREE.Box3();
  private center: THREE.Vector3 = new THREE.Vector3();
  private tempPosition: THREE.Vector3 = new THREE.Vector3();

  // Pre-allocated arrays to reduce GC
  private cachedWorldPositions: THREE.Vector3[] = [];
  
  // Reusable objects for wheel classification
  private tempLocalPos: THREE.Vector3 = new THREE.Vector3();
  private centroid: THREE.Vector3 = new THREE.Vector3();

  constructor(config?: WheelConfig) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Detect and initialize wheels for a given model.
   * @param model - The vehicle model to search for wheels
   * @param wheelRadius - Radius of the wheels
   * @returns True if wheels were successfully detected
   */
  detectWheels(model: THREE.Group, wheelRadius: number): boolean {
    this.wheels = [];
    const candidates: THREE.Object3D[] = [];

    // Strategy 1: Find wheels by exact name
    for (const name of this.config.wheelNames) {
      const wheel = model.getObjectByName(name);
      if (wheel) {
        candidates.push(wheel);
      }
    }

    // Strategy 2: Find wheels inside parent containers
    if (candidates.length < this.config.minWheels) {
      for (const parentName of this.config.parentNames) {
        const parent = model.getObjectByName(parentName);
        if (parent) {
          parent.traverse((child) => {
            if (child instanceof THREE.Mesh) {
              const nameLower = child.name.toLowerCase();
              if (this.config.fallbackTerms.some(term => nameLower.includes(term))) {
                candidates.push(child);
              }
            }
          });
        }
      }
    }

    // Strategy 3: Fallback - search entire model
    if (candidates.length < this.config.minWheels) {
      model.traverse((obj) => {
        if (obj instanceof THREE.Mesh) {
          const nameLower = obj.name.toLowerCase();
          for (const term of this.config.fallbackTerms) {
            if (nameLower.includes(term) && !nameLower.includes('rim')) {
              candidates.push(obj);
              break;
            }
          }
        }
      });
    }

    // Remove duplicates and limit to max wheels
    const uniqueWheels = Array.from(new Set(candidates));
    const selectedWheels = uniqueWheels.slice(0, this.config.maxWheels);

    if (selectedWheels.length < this.config.minWheels) {
      console.error(
        `WheelSystem: Found only ${selectedWheels.length} wheel(s), need at least ${this.config.minWheels}`
      );
      this.logAvailableObjects(model);
      return false;
    }

    // Create wheel info objects
    this.wheels = selectedWheels.map(wheel => ({
      object: wheel,
      localPosition: this.getLocalPosition(wheel),
      radius: wheelRadius,
    }));

    // Calculate offset from model origin to wheel bottoms
    this.calculateWheelBottomOffset();

    this.initialized = true;
    console.log(`✓ WheelSystem: Detected ${this.wheels.length} wheels:`, 
                this.wheels.map(w => w.object.name));

    return true;
  }

  /**
   * Get the local position of a wheel relative to its root.
   * @param wheel - The wheel object
   * @returns Local position vector
   */
  private getLocalPosition(wheel: THREE.Object3D): THREE.Vector3 {
    // Reuse tempPosition to reduce allocations
    wheel.getWorldPosition(this.tempPosition);
    return this.tempPosition.clone(); // Clone only when storing
  }

  /**
   * Calculate the offset from model center to wheel bottom contact points.
   */
  private calculateWheelBottomOffset(): void {
    if (this.wheels.length === 0) return;

    let sumY = 0;

    for (const wheel of this.wheels) {
      this.bbox.setFromObject(wheel.object);
      this.bbox.getCenter(this.center);
      sumY += this.center.y;
    }

    const avgWheelCenterY = sumY / this.wheels.length;
    const wheelRadius = this.wheels[0].radius;

    // Bottom of wheel = center Y - radius
    this.wheelBottomOffset = avgWheelCenterY - wheelRadius;

    console.log(
      `✓ WheelSystem: Bottom offset = ${this.wheelBottomOffset.toFixed(3)} ` +
      `(avg center Y = ${avgWheelCenterY.toFixed(3)}, radius = ${wheelRadius})`
    );
  }

  /**
   * Get world positions of all wheels.
   * @param output - Optional array to reuse (reduces GC pressure)
   * @returns Array of world positions
   */
  getWheelWorldPositions(output?: THREE.Vector3[]): THREE.Vector3[] {
    // Use provided output array or cached array to reduce allocations
    const positions = output || this.cachedWorldPositions;
    
    // Ensure we have enough pre-allocated vectors
    while (positions.length < this.wheels.length) {
      positions.push(new THREE.Vector3());
    }
    
    for (let i = 0; i < this.wheels.length; i++) {
      // Get bounding box center (accounts for geometry offset)
      this.bbox.setFromObject(this.wheels[i].object);
      this.bbox.getCenter(positions[i]);
    }

    // Update cached array reference
    if (!output) {
      this.cachedWorldPositions = positions;
    }

    return positions;
  }

  /**
   * Get all wheel objects.
   * @returns Array of wheel THREE.Object3D instances
   */
  getWheels(): THREE.Object3D[] {
    return this.wheels.map(w => w.object);
  }

  /**
   * Get wheel info for all detected wheels.
   * @returns Array of WheelInfo objects
   */
  getWheelInfo(): WheelInfo[] {
    return [...this.wheels];
  }

  /**
   * Get the offset from model origin to wheel bottom contact points.
   * @returns Y offset value
   */
  getWheelBottomOffset(): number {
    return this.wheelBottomOffset;
  }

  /**
   * Get the number of detected wheels.
   * @returns Wheel count
   */
  getWheelCount(): number {
    return this.wheels.length;
  }

  /**
   * Check if wheels have been successfully detected and initialized.
   * @returns True if initialized
   */
  isInitialized(): boolean {
    return this.initialized;
  }

  /**
   * Log available objects in the model for debugging.
   * @param model - The model to inspect
   */
  private logAvailableObjects(model: THREE.Group): void {
    console.log('WheelSystem: Available objects in model:');
    model.traverse((obj) => {
      if (obj.type === 'Mesh' || obj.type === 'Group') {
        console.log(`  - ${obj.name} (${obj.type})`);
      }
    });
  }

  /**
   * Classify wheels by their position (front/back, left/right).
   * Returns indices into the wheels array for each position.
   * @param model - The car model (needed for world-to-local transformation)
   * @returns Object with indices for each wheel position, or null if not found
   */
  getWheelIndicesByPosition(model: THREE.Group): {
    frontLeft: number | null;
    frontRight: number | null;
    backLeft: number | null;
    backRight: number | null;
  } {
    if (this.wheels.length < 2) {
      return { frontLeft: null, frontRight: null, backLeft: null, backRight: null };
    }

    // Get wheel world positions
    const worldPositions = this.getWheelWorldPositions();
    
    // Calculate centroid (average position)
    this.centroid.set(0, 0, 0);
    for (let i = 0; i < worldPositions.length; i++) {
      this.centroid.add(worldPositions[i]);
    }
    this.centroid.divideScalar(worldPositions.length);

    // Transform to local space and classify each wheel
    const classifications: Array<{
      index: number;
      isFront: boolean;
      isLeft: boolean;
      localX: number;
      localZ: number;
    }> = [];

    for (let i = 0; i < worldPositions.length; i++) {
      // Transform world position to car's local space
      this.tempLocalPos.copy(worldPositions[i]);
      model.worldToLocal(this.tempLocalPos);

      // Car faces -X direction, so:
      // - Negative X = front, Positive X = back
      // - Positive Z = left, Negative Z = right
      const isFront = this.tempLocalPos.x < 0;
      const isLeft = this.tempLocalPos.z > 0;

      classifications.push({
        index: i,
        isFront,
        isLeft,
        localX: this.tempLocalPos.x,
        localZ: this.tempLocalPos.z,
      });
    }

    // Find wheels for each position
    const result = {
      frontLeft: null as number | null,
      frontRight: null as number | null,
      backLeft: null as number | null,
      backRight: null as number | null,
    };

    // Sort to get the most extreme positions
    const frontLeft = classifications
      .filter(w => w.isFront && w.isLeft)
      .sort((a, b) => (a.localX - b.localX) || (b.localZ - a.localZ))[0];
    
    const frontRight = classifications
      .filter(w => w.isFront && !w.isLeft)
      .sort((a, b) => (a.localX - b.localX) || (a.localZ - b.localZ))[0];
    
    const backLeft = classifications
      .filter(w => !w.isFront && w.isLeft)
      .sort((a, b) => (b.localX - a.localX) || (b.localZ - a.localZ))[0];
    
    const backRight = classifications
      .filter(w => !w.isFront && !w.isLeft)
      .sort((a, b) => (b.localX - a.localX) || (a.localZ - b.localZ))[0];

    if (frontLeft) result.frontLeft = frontLeft.index;
    if (frontRight) result.frontRight = frontRight.index;
    if (backLeft) result.backLeft = backLeft.index;
    if (backRight) result.backRight = backRight.index;

    return result;
  }

  /**
   * Calculate wheelbase (front-to-back distance) and track width (left-to-right distance).
   * @param model - The car model (needed for wheel classification)
   * @returns Object with wheelbase and trackWidth, or null if cannot be calculated
   */
  getWheelDimensions(model: THREE.Group): { wheelbase: number; trackWidth: number } | null {
    if (this.wheels.length < 2) {
      return null;
    }

    const indices = this.getWheelIndicesByPosition(model);
    const positions = this.getWheelWorldPositions();

    // Calculate wheelbase (front to back distance)
    let wheelbase = 0;
    if (indices.frontLeft !== null && indices.backLeft !== null) {
      const front = positions[indices.frontLeft];
      const back = positions[indices.backLeft];
      wheelbase = Math.sqrt(
        Math.pow(front.x - back.x, 2) + Math.pow(front.z - back.z, 2)
      );
    } else if (indices.frontRight !== null && indices.backRight !== null) {
      const front = positions[indices.frontRight];
      const back = positions[indices.backRight];
      wheelbase = Math.sqrt(
        Math.pow(front.x - back.x, 2) + Math.pow(front.z - back.z, 2)
      );
    }

    // Calculate track width (left to right distance)
    let trackWidth = 0;
    if (indices.frontLeft !== null && indices.frontRight !== null) {
      const left = positions[indices.frontLeft];
      const right = positions[indices.frontRight];
      trackWidth = Math.sqrt(
        Math.pow(left.x - right.x, 2) + Math.pow(left.z - right.z, 2)
      );
    } else if (indices.backLeft !== null && indices.backRight !== null) {
      const left = positions[indices.backLeft];
      const right = positions[indices.backRight];
      trackWidth = Math.sqrt(
        Math.pow(left.x - right.x, 2) + Math.pow(left.z - right.z, 2)
      );
    }

    if (wheelbase === 0 && trackWidth === 0) {
      return null;
    }

    return { wheelbase, trackWidth };
  }

  /**
   * Reset the wheel system.
   */
  reset(): void {
    this.wheels = [];
    this.wheelBottomOffset = 0;
    this.initialized = false;
  }
}

