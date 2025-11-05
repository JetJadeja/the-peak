import * as THREE from 'three';
import { TerrainPhysics, TerrainFollowOptions } from './types';
import { TerrainRaycaster } from './raycaster';
import { WheelSystem } from './wheelSystem';
import { RaycastDebugger } from './debug/raycastDebugger';

/**
 * Default options for terrain following
 */
const DEFAULT_OPTIONS: Required<TerrainFollowOptions> = {
  enableRotation: false, // Not implemented yet, reserved for future
  heightSmoothing: 0,    // No smoothing by default
  rotationSmoothing: 0,  // No smoothing by default
  heightOffset: 0,       // No additional offset
  maxPitchAngle: Math.PI / 4, // 45 degrees max
  maxRollAngle: Math.PI / 3,  // 60 degrees max
};

/**
 * Orchestrates terrain following for vehicles using raycasting and wheel systems.
 * This class brings together the raycaster, wheel system, and terrain physics
 * to provide a clean API for updating vehicle positions to follow terrain.
 */
export class TerrainFollower {
  private terrain: TerrainPhysics;
  private raycaster: TerrainRaycaster;
  private options: Required<TerrainFollowOptions>;
  private debugger: RaycastDebugger | null = null;

  // Reusable arrays and objects to reduce GC pressure
  private wheelPositions: THREE.Vector3[] = [];
  private raycastResults: number[] = [];
  
  // Pre-allocated vectors for raycasting
  private rayStart: THREE.Vector3 = new THREE.Vector3();
  private rayEnd: THREE.Vector3 = new THREE.Vector3();
  
  // Current rotation state for smooth interpolation
  private currentPitch: number = 0;
  private currentRoll: number = 0;

  constructor(
    terrain: TerrainPhysics,
    raycaster: TerrainRaycaster,
    options?: TerrainFollowOptions
  ) {
    this.terrain = terrain;
    this.raycaster = raycaster;
    this.options = { ...DEFAULT_OPTIONS, ...options };
    
    // Pre-allocate result array slots
    this.raycastResults = new Array(4).fill(0);
  }

  /**
   * Enable debug visualization for raycasts.
   * @param scene - Scene to add debug visualizations to
   * @param wheelCount - Number of wheels to create visualizations for
   */
  enableDebugVisualization(scene: THREE.Scene, wheelCount: number): void {
    if (!this.debugger) {
      this.debugger = new RaycastDebugger(scene);
      this.debugger.addRayVisualizations(wheelCount);
    }
  }

  /**
   * Disable debug visualization.
   */
  disableDebugVisualization(): void {
    if (this.debugger) {
      this.debugger.dispose();
      this.debugger = null;
    }
  }

  /**
   * Update a model's position to follow terrain based on its wheels.
   * @param model - The vehicle model to update
   * @param wheelSystem - The wheel system containing wheel information
   */
  update(model: THREE.Group, wheelSystem: WheelSystem): void {
    if (!wheelSystem.isInitialized()) {
      console.warn('TerrainFollower: WheelSystem not initialized');
      return;
    }

    const wheelCount = wheelSystem.getWheelCount();

    // Get wheel world positions (reuse array to reduce GC)
    this.wheelPositions = wheelSystem.getWheelWorldPositions(this.wheelPositions);

    // Raycast from each wheel to find ground heights
    let totalHeight = 0;
    let minGroundHeight = Infinity;
    let maxGroundHeight = -Infinity;
    
    for (let i = 0; i < wheelCount; i++) {
      const wheelPos = this.wheelPositions[i];
      const result = this.raycaster.castRayDown(
        wheelPos.x,
        wheelPos.z,
        this.terrain
      );

      const groundHeight = result.hit ? result.point.y : 0;
      this.raycastResults[i] = groundHeight;
      totalHeight += groundHeight;
      minGroundHeight = Math.min(minGroundHeight, groundHeight);
      maxGroundHeight = Math.max(maxGroundHeight, groundHeight);

      // Update debug visualization if enabled
      if (this.debugger && result.hit) {
        // Reuse pre-allocated vectors
        this.rayStart.set(wheelPos.x, this.raycaster.getDefaultStartHeight(), wheelPos.z);
        this.rayEnd.copy(result.point);
        this.debugger.updateRayVisualization(i, this.rayStart, this.rayEnd, result.hit);
      }
    }

    // Calculate target Y position using average ground height
    // This minimizes positioning error when the car is rotated
    const avgGroundHeight = totalHeight / wheelCount;
    const wheelBottomOffset = wheelSystem.getWheelBottomOffset();
    let targetY = avgGroundHeight - wheelBottomOffset + this.options.heightOffset;

    // Apply smoothing if enabled
    if (this.options.heightSmoothing > 0) {
      targetY = THREE.MathUtils.lerp(
        model.position.y,
        targetY,
        this.options.heightSmoothing
      );
    }

    // Update model position
    model.position.y = targetY;

    // Calculate and apply pitch/roll based on terrain slope
    if (this.options.enableRotation && wheelCount >= 4) {
      // Get wheel indices by position
      const wheelIndices = wheelSystem.getWheelIndicesByPosition(model);
      
      // Get wheel dimensions for angle calculation
      const dimensions = wheelSystem.getWheelDimensions(model);
      
      if (dimensions && dimensions.wheelbase > 0 && dimensions.trackWidth > 0) {
        let targetPitch = 0;
        let targetRoll = 0;

        // Calculate pitch (front-back tilt) if we have front and back wheels
        if (wheelIndices.frontLeft !== null && wheelIndices.frontRight !== null &&
            wheelIndices.backLeft !== null && wheelIndices.backRight !== null) {
          
          const frontAvgHeight = (
            this.raycastResults[wheelIndices.frontLeft] + 
            this.raycastResults[wheelIndices.frontRight]
          ) / 2;
          
          const backAvgHeight = (
            this.raycastResults[wheelIndices.backLeft] + 
            this.raycastResults[wheelIndices.backRight]
          ) / 2;
          
          const heightDiff = frontAvgHeight - backAvgHeight;
          targetPitch = Math.atan2(heightDiff, dimensions.wheelbase);
          
          // Clamp pitch to max angle
          targetPitch = THREE.MathUtils.clamp(
            targetPitch,
            -this.options.maxPitchAngle,
            this.options.maxPitchAngle
          );
        }

        // Calculate roll (left-right tilt) if we have left and right wheels
        if (wheelIndices.frontLeft !== null && wheelIndices.backLeft !== null &&
            wheelIndices.frontRight !== null && wheelIndices.backRight !== null) {
          
          const leftAvgHeight = (
            this.raycastResults[wheelIndices.frontLeft] + 
            this.raycastResults[wheelIndices.backLeft]
          ) / 2;
          
          const rightAvgHeight = (
            this.raycastResults[wheelIndices.frontRight] + 
            this.raycastResults[wheelIndices.backRight]
          ) / 2;
          
          const heightDiff = rightAvgHeight - leftAvgHeight;  // Fixed: swapped to correct roll direction
          targetRoll = Math.atan2(heightDiff, dimensions.trackWidth);
          
          // Clamp roll to max angle
          targetRoll = THREE.MathUtils.clamp(
            targetRoll,
            -this.options.maxRollAngle,
            this.options.maxRollAngle
          );
        }

        // Apply smooth interpolation
        const smoothing = this.options.rotationSmoothing;
        if (smoothing > 0) {
          this.currentPitch = THREE.MathUtils.lerp(this.currentPitch, targetPitch, smoothing);
          this.currentRoll = THREE.MathUtils.lerp(this.currentRoll, targetRoll, smoothing);
        } else {
          this.currentPitch = targetPitch;
          this.currentRoll = targetRoll;
        }

        // Apply rotation with proper Euler order
        // YXZ order: Y (steering) first, then X (roll around forward axis), then Z (pitch around lateral axis)
        model.rotation.order = 'YXZ';
        model.rotation.x = this.currentRoll;   // Roll around X-axis (forward axis, since car faces -X)
        model.rotation.z = this.currentPitch;  // Pitch around Z-axis (lateral axis)
        // model.rotation.y is already set by steering in car.ts
      }
    }
  }

  /**
   * Update position for a model at a specific location (without wheels).
   * Useful for remote players or simple objects.
   * @param model - The model to update
   * @param heightOffset - Additional offset to add to ground height
   */
  updateSimple(model: THREE.Group, heightOffset: number = 0): void {
    const pos = model.position;
    
    const result = this.raycaster.castRayDown(
      pos.x,
      pos.z,
      this.terrain
    );

    if (result.hit) {
      model.position.y = result.point.y + heightOffset;
    } else {
      // Fallback to formula-based height if raycast misses
      const fallbackHeight = this.terrain.getHeightAt(pos.x, pos.z);
      model.position.y = fallbackHeight + heightOffset;
    }
  }

  /**
   * Get the ground height at a specific XZ position.
   * @param x - World X coordinate
   * @param z - World Z coordinate
   * @returns Ground height at that position
   */
  getGroundHeightAt(x: number, z: number): number {
    const result = this.raycaster.castRayDown(x, z, this.terrain);
    return result.hit ? result.point.y : this.terrain.getHeightAt(x, z);
  }

  /**
   * Update terrain following options.
   * @param options - New options to apply
   */
  setOptions(options: Partial<TerrainFollowOptions>): void {
    this.options = { ...this.options, ...options };
  }

  /**
   * Get current terrain following options.
   * @returns Current options
   */
  getOptions(): TerrainFollowOptions {
    return { ...this.options };
  }

  /**
   * Clean up resources.
   */
  dispose(): void {
    if (this.debugger) {
      this.debugger.dispose();
      this.debugger = null;
    }
    this.wheelPositions = [];
    this.raycastResults = [];
  }
}

