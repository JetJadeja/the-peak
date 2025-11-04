import * as THREE from 'three';
import {
  GROUND_SIZE,
  GROUND_SEGMENTS,
  GROUND_COLOR,
  TERRAIN_HEIGHT,
  TERRAIN_FREQUENCY,
} from '../config/gameConstants';

export class Ground {
  private mesh: THREE.Mesh;

  constructor(scene: THREE.Scene) {
    // Create subdivided plane geometry for rolling hills
    const geometry = new THREE.PlaneGeometry(
      GROUND_SIZE,
      GROUND_SIZE,
      GROUND_SEGMENTS,
      GROUND_SEGMENTS
    );

    // Apply rolling hills using sine waves
    // Based on Three.js voxel terrain generation pattern
    const positionAttribute = geometry.getAttribute('position');

    for (let i = 0; i < positionAttribute.count; i++) {
      // Get X and Y coordinates (plane is in XY before rotation)
      const x = positionAttribute.getX(i);
      const y = positionAttribute.getY(i);

      // Generate height using multiple sine waves for rolling hills
      // This creates a natural-looking terrain with varied elevations
      const height =
        Math.sin(x * TERRAIN_FREQUENCY) * TERRAIN_HEIGHT +
        Math.cos(y * TERRAIN_FREQUENCY * 1.3) * TERRAIN_HEIGHT * 0.8;

      // Set Z coordinate (which becomes Y after rotation)
      positionAttribute.setZ(i, height);
    }

    // CRITICAL: Recompute normals after modifying vertices
    // This ensures proper lighting on the hills
    geometry.computeVertexNormals();

    const material = new THREE.MeshStandardMaterial({
      color: GROUND_COLOR,
      side: THREE.DoubleSide,
    });

    this.mesh = new THREE.Mesh(geometry, material);
    this.mesh.rotation.x = -Math.PI / 2; // Rotate to make it horizontal

    scene.add(this.mesh);
  }

  getMesh(): THREE.Mesh {
    return this.mesh;
  }

  /**
   * Get terrain height at any XZ position
   * Uses the same formula as terrain generation
   */
  getHeightAt(x: number, z: number): number {
    // Same formula used to generate the terrain mesh
    const height =
      Math.sin(x * TERRAIN_FREQUENCY) * TERRAIN_HEIGHT +
      Math.cos(z * TERRAIN_FREQUENCY * 1.3) * TERRAIN_HEIGHT * 0.8;
    return height;
  }

  dispose(): void {
    this.mesh.geometry.dispose();
    if (this.mesh.material instanceof THREE.Material) {
      this.mesh.material.dispose();
    }
  }
}
