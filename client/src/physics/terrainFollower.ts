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

      // Update debug visualization if enabled
      if (this.debugger && result.hit) {
        // Reuse pre-allocated vectors
        this.rayStart.set(wheelPos.x, this.raycaster.getDefaultStartHeight(), wheelPos.z);
        this.rayEnd.copy(result.point);
        this.debugger.updateRayVisualization(i, this.rayStart, this.rayEnd, result.hit);
      }
    }

    // Calculate average ground height
    const avgGroundHeight = totalHeight / wheelCount;

    // Calculate target Y position
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

    // Future: Implement rotation based on terrain slope
    // This would calculate pitch and roll from wheel height differences
    if (this.options.enableRotation) {
      // TODO: Calculate and apply pitch/roll based on wheel heights
      // Front-back difference -> pitch
      // Left-right difference -> roll
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

