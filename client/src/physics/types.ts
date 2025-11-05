import * as THREE from "three";

/**
 * Result of a raycast operation
 */
export interface RaycastResult {
  /** Whether the ray hit anything */
  hit: boolean;
  /** The point where the ray intersected (world coordinates) */
  point: THREE.Vector3;
  /** Distance from ray origin to intersection point */
  distance: number;
  /** The object that was hit (if any) */
  object?: THREE.Object3D;
}

/**
 * Configuration for raycasting operations
 */
export interface RaycastOptions {
  /** Starting height for the raycast (default: 50) */
  startHeight?: number;
  /** Direction to cast the ray (default: down) */
  direction?: THREE.Vector3;
  /** Maximum distance to check (optional) */
  maxDistance?: number;
}

/**
 * Represents an object that can be raycasted against
 */
export interface RaycastTarget {
  /** Get the THREE.js object to raycast against */
  getRaycastMesh(): THREE.Object3D;
}

/**
 * Configuration for wheel detection
 */
export interface WheelConfig {
  /** Names to search for when detecting wheels */
  wheelNames?: string[];
  /** Parent node names that contain wheels */
  parentNames?: string[];
  /** Fallback search terms */
  fallbackTerms?: string[];
  /** Minimum number of wheels required */
  minWheels?: number;
  /** Maximum number of wheels to use */
  maxWheels?: number;
}

/**
 * Information about a detected wheel
 */
export interface WheelInfo {
  /** The wheel object */
  object: THREE.Object3D;
  /** Local position relative to model */
  localPosition: THREE.Vector3;
  /** Radius of the wheel */
  radius: number;
}

/**
 * Interface for terrain physics queries
 */
export interface TerrainPhysics {
  /**
   * Get the terrain height at a specific XZ position
   * @param x - World X coordinate
   * @param z - World Z coordinate
   * @returns Height (Y coordinate) at that position
   */
  getHeightAt(x: number, z: number): number;

  /**
   * Get the terrain mesh for raycasting
   * @returns The THREE.js mesh to raycast against
   */
  getRaycastMesh(): THREE.Object3D;

  /**
   * Check if a point is within terrain bounds
   * @param x - World X coordinate
   * @param z - World Z coordinate
   * @returns True if within bounds
   */
  isWithinBounds(x: number, z: number): boolean;
}

/**
 * Options for terrain following behavior
 */
export interface TerrainFollowOptions {
  /** Whether to enable pitch/roll based on terrain slope */
  enableRotation?: boolean;
  /** Smoothing factor for height transitions (0-1) */
  heightSmoothing?: number;
  /** Smoothing factor for rotation transitions (0-1) */
  rotationSmoothing?: number;
  /** Offset to add to calculated height */
  heightOffset?: number;
  /** Maximum pitch angle in radians (default: Math.PI/4 = 45 degrees) */
  maxPitchAngle?: number;
  /** Maximum roll angle in radians (default: Math.PI/3 = 60 degrees) */
  maxRollAngle?: number;
}
