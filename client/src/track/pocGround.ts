import * as THREE from 'three';
import { createPOCRoadPath, RoadPath } from './roadPath';
import { HeightmapGenerator, HeightmapMetadata } from './heightmapGenerator';
import { TerrainColorizer } from './terrainColors';
import { IGround } from './groundInterface';
import {
  POC_TERRAIN_SIZE,
  POC_TERRAIN_SEGMENTS,
  POC_TERRAIN_SEED,
} from '../config/gameConstants';

/**
 * PocGround replaces the original Ground class with a sophisticated
 * terrain system featuring Simplex noise generation, road integration,
 * and Art of Rally-inspired visual styling.
 * 
 * Maintains the same public interface as Ground for compatibility.
 */
export class PocGround implements IGround {
  private mesh: THREE.Mesh;
  private heightmap: Float32Array;
  private metadata: HeightmapMetadata;
  private roadPath: RoadPath;

  constructor(scene: THREE.Scene) {
    console.log('🏔️ Generating POC terrain...');
    
    // Step 1: Create road path (must come first as terrain needs it)
    console.log('  → Creating road path...');
    this.roadPath = createPOCRoadPath();

    // Step 2: Generate heightmap with road integration
    console.log('  → Generating heightmap with Simplex noise...');
    const generator = new HeightmapGenerator(this.roadPath, POC_TERRAIN_SEED);
    const { heightmap, metadata } = generator.generate();
    this.heightmap = heightmap;
    this.metadata = metadata;
    
    console.log(`  → Heightmap: min=${metadata.minHeight.toFixed(2)}, max=${metadata.maxHeight.toFixed(2)}`);

    // Step 3: Create Three.js geometry
    console.log('  → Building geometry...');
    this.mesh = this.createTerrainMesh();

    // Step 4: Add to scene
    scene.add(this.mesh);
    
    console.log('✅ POC terrain generation complete!');
  }

  /**
   * Create the Three.js mesh with heightmap applied
   */
  private createTerrainMesh(): THREE.Mesh {
    // Create base plane geometry
    const geometry = new THREE.PlaneGeometry(
      POC_TERRAIN_SIZE,
      POC_TERRAIN_SIZE,
      POC_TERRAIN_SEGMENTS,
      POC_TERRAIN_SEGMENTS
    );

    // Apply heightmap to geometry vertices
    this.applyHeightmapToGeometry(geometry);

    // Rotate to horizontal (XY plane -> XZ plane with Y-up)
    const mesh = new THREE.Mesh(geometry);
    mesh.rotation.x = -Math.PI / 2;
    
    // Update geometry to apply rotation to vertices
    mesh.updateMatrixWorld(true);
    geometry.applyMatrix4(mesh.matrix);
    mesh.rotation.set(0, 0, 0);
    mesh.position.set(0, 0, 0);

    // Recompute normals after height and rotation changes
    geometry.computeVertexNormals();

    // Apply vertex colors
    console.log('  → Applying vertex colors...');
    const colorizer = new TerrainColorizer(geometry, this.roadPath, this.metadata);
    colorizer.applyColors();

    // Create material with vertex colors enabled
    const material = new THREE.MeshStandardMaterial({
      vertexColors: true,
      roughness: 0.9,
      metalness: 0.0,
      side: THREE.DoubleSide,
      flatShading: false,
    });

    // Create final mesh with colored material
    const finalMesh = new THREE.Mesh(geometry, material);
    
    // Shadow configuration
    finalMesh.castShadow = false; // Ground doesn't cast shadows
    finalMesh.receiveShadow = true; // Ground receives shadows

    return finalMesh;
  }

  /**
   * Apply heightmap data to geometry vertices
   */
  private applyHeightmapToGeometry(geometry: THREE.BufferGeometry): void {
    const positions = geometry.getAttribute('position');
    
    for (let i = 0; i < positions.count; i++) {
      const height = this.heightmap[i];
      // Z coordinate becomes height (before rotation to horizontal)
      positions.setZ(i, height);
    }

    positions.needsUpdate = true;
  }

  /**
   * Get the terrain mesh for raycasting operations
   * Required by TerrainPhysics interface
   */
  getMesh(): THREE.Mesh {
    return this.mesh;
  }

  /**
   * Get terrain height at any world position using bilinear interpolation
   * This is called every frame by car physics, so it must be fast
   * Required by TerrainPhysics interface
   * 
   * @param x - World X coordinate
   * @param z - World Z coordinate
   * @returns Height (Y coordinate) at that position
   */
  getHeightAt(x: number, z: number): number {
    return HeightmapGenerator.getHeightAt(
      x,
      z,
      this.heightmap,
      POC_TERRAIN_SIZE,
      POC_TERRAIN_SEGMENTS
    );
  }

  /**
   * Get the road path (useful for gameplay systems like minimap, checkpoints)
   */
  getRoadPath(): RoadPath {
    return this.roadPath;
  }

  /**
   * Get heightmap metadata
   */
  getMetadata(): HeightmapMetadata {
    return this.metadata;
  }

  /**
   * Clean up resources
   * Required by original Ground interface
   */
  dispose(): void {
    if (this.mesh) {
      this.mesh.geometry.dispose();
      if (this.mesh.material instanceof THREE.Material) {
        this.mesh.material.dispose();
      }
    }
  }
}

