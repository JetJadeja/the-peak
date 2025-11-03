import * as THREE from 'three';
import { NoiseGenerator } from '../utils/noise';

export interface TerrainConfig {
  width: number;
  depth: number;
  widthSegments: number;
  depthSegments: number;
  maxElevation: number;
  seed: number;
}

export const DEFAULT_TERRAIN_CONFIG: TerrainConfig = {
  width: 450,
  depth: 900,
  widthSegments: 120,
  depthSegments: 240,
  maxElevation: 80, // Much taller for dramatic peak
  seed: 12345,
};

export class Terrain {
  private mesh: THREE.Mesh | null = null;
  private config: TerrainConfig;
  private noiseGenerator: NoiseGenerator;

  constructor(config: Partial<TerrainConfig> = {}) {
    this.config = { ...DEFAULT_TERRAIN_CONFIG, ...config };
    this.noiseGenerator = new NoiseGenerator(this.config.seed);
  }

  create(scene: THREE.Scene): THREE.Mesh {
    const geometry = new THREE.PlaneGeometry(
      this.config.width,
      this.config.depth,
      this.config.widthSegments,
      this.config.depthSegments
    );

    // Apply height displacement
    this.applyHeightMap(geometry);

    // Compute normals for proper lighting
    geometry.computeVertexNormals();

    // Create material with vertex colors to show elevation
    const material = new THREE.MeshStandardMaterial({
      vertexColors: true,
      flatShading: false,
      side: THREE.DoubleSide,
    });

    this.mesh = new THREE.Mesh(geometry, material);
    this.mesh.rotation.x = -Math.PI / 2; // Rotate to horizontal (back to original)
    this.mesh.receiveShadow = true;

    scene.add(this.mesh);
    return this.mesh;
  }

  private applyHeightMap(geometry: THREE.PlaneGeometry): void {
    const positions = geometry.attributes.position;
    const colors: number[] = [];

    const { width, depth, maxElevation } = this.config;

    for (let i = 0; i < positions.count; i++) {
      const x = positions.getX(i);
      const z = positions.getY(i); // Y in plane geometry becomes Z after rotation

      // SIMPLE INCLINE - just goes up from back to front
      const nz = z / depth; // -0.5 to 0.5

      // Linear incline from 0 at the back to maxElevation at the front
      let height = (nz + 0.5) * maxElevation;

      // Set the height (Z becomes Y after rotation)
      positions.setZ(i, height);

      // Create color based on height for visualization
      const normalizedHeight = height / maxElevation;
      const color = this.getColorForHeight(normalizedHeight);
      colors.push(color.r, color.g, color.b);
    }

    // Add colors to geometry
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  }

  private getColorForHeight(normalizedHeight: number): THREE.Color {
    // Color gradient from dark green (low) to brown (mid) to gray (high)
    if (normalizedHeight < 0.3) {
      // Low elevation - dark green to medium green
      return new THREE.Color().lerpColors(
        new THREE.Color(0x1a4d1a), // Dark green
        new THREE.Color(0x2d5a2d), // Medium green
        normalizedHeight / 0.3
      );
    } else if (normalizedHeight < 0.6) {
      // Mid elevation - green to brown
      return new THREE.Color().lerpColors(
        new THREE.Color(0x2d5a2d), // Medium green
        new THREE.Color(0x8b7355), // Brown
        (normalizedHeight - 0.3) / 0.3
      );
    } else {
      // High elevation - brown to gray
      return new THREE.Color().lerpColors(
        new THREE.Color(0x8b7355), // Brown
        new THREE.Color(0x808080), // Gray
        (normalizedHeight - 0.6) / 0.4
      );
    }
  }

  getMesh(): THREE.Mesh | null {
    return this.mesh;
  }

  getHeightAt(x: number, z: number): number {
    if (!this.mesh) return 0;

    const { depth, maxElevation } = this.config;

    // Simple linear incline
    const nz = z / depth; // -0.5 to 0.5
    const height = (nz + 0.5) * maxElevation;

    return height;
  }

  destroy(scene: THREE.Scene): void {
    if (this.mesh) {
      scene.remove(this.mesh);
      this.mesh.geometry.dispose();
      if (this.mesh.material instanceof THREE.Material) {
        this.mesh.material.dispose();
      }
      this.mesh = null;
    }
  }
}
