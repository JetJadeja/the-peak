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
   * Reset the wheel system.
   */
  reset(): void {
    this.wheels = [];
    this.wheelBottomOffset = 0;
    this.initialized = false;
  }
}

