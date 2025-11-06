import * as THREE from 'three';

/**
 * Common interface for all ground/terrain implementations
 * Allows different terrain systems to be used interchangeably
 */
export interface IGround {
  /**
   * Get the terrain mesh for raycasting operations
   */
  getMesh(): THREE.Mesh;

  /**
   * Get terrain height at any world position
   * @param x - World X coordinate
   * @param z - World Z coordinate
   * @returns Height (Y coordinate) at that position
   */
  getHeightAt(x: number, z: number): number;

  /**
   * Clean up resources
   */
  dispose(): void;
}

