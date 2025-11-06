import * as THREE from 'three';
import { TerrainPhysics as ITerrainPhysics, RaycastTarget } from '../physics/types';
import { IGround } from './groundInterface';

/**
 * Handles physics queries for terrain.
 * Separates physics concerns from rendering/mesh management.
 */
export class TerrainPhysics implements ITerrainPhysics, RaycastTarget {
  private ground: IGround;
  private bounds: { minX: number; maxX: number; minZ: number; maxZ: number };

  constructor(ground: IGround, terrainSize: number) {
    this.ground = ground;
    
    // Calculate terrain bounds (centered at origin)
    const halfSize = terrainSize / 2;
    this.bounds = {
      minX: -halfSize,
      maxX: halfSize,
      minZ: -halfSize,
      maxZ: halfSize,
    };
  }

  /**
   * Get the terrain height at a specific XZ position.
   * Uses the terrain generation formula for consistency.
   * @param x - World X coordinate
   * @param z - World Z coordinate
   * @returns Height (Y coordinate) at that position
   */
  getHeightAt(x: number, z: number): number {
    // Delegate to ground's formula-based calculation
    // This is a fallback for when raycasting isn't appropriate
    return this.ground.getHeightAt(x, z);
  }

  /**
   * Get the terrain mesh for raycasting operations.
   * @returns The THREE.js mesh to raycast against
   */
  getRaycastMesh(): THREE.Object3D {
    return this.ground.getMesh();
  }

  /**
   * Check if a point is within terrain bounds.
   * @param x - World X coordinate
   * @param z - World Z coordinate
   * @returns True if within bounds
   */
  isWithinBounds(x: number, z: number): boolean {
    return (
      x >= this.bounds.minX &&
      x <= this.bounds.maxX &&
      z >= this.bounds.minZ &&
      z <= this.bounds.maxZ
    );
  }

  /**
   * Get the terrain bounds.
   * @returns Object with min/max X and Z coordinates
   */
  getBounds(): { minX: number; maxX: number; minZ: number; maxZ: number } {
    return { ...this.bounds };
  }

  /**
   * Update terrain bounds (if terrain size changes).
   * @param terrainSize - New terrain size
   */
  updateBounds(terrainSize: number): void {
    const halfSize = terrainSize / 2;
    this.bounds = {
      minX: -halfSize,
      maxX: halfSize,
      minZ: -halfSize,
      maxZ: halfSize,
    };
  }
}

