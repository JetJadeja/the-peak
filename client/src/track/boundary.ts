import * as THREE from 'three';

export interface BoundaryConfig {
  width: number;
  height: number;
  depth: number;
  wallThickness: number;
  wallColor: number;
}

export const DEFAULT_BOUNDARY_CONFIG: BoundaryConfig = {
  width: 300,    // Width (X-axis) - enough for winding
  height: 250,   // Height (Y-axis) - mountain climb
  depth: 600,    // Depth (Z-axis) - length of the track
  wallThickness: 2,
  wallColor: 0x3a3a3a,
};

export class TrackBoundary {
  private walls: THREE.Mesh[] = [];
  private config: BoundaryConfig;

  constructor(config: Partial<BoundaryConfig> = {}) {
    this.config = { ...DEFAULT_BOUNDARY_CONFIG, ...config };
  }

  create(scene: THREE.Scene): void {
    this.createWalls(scene);
  }

  private createWalls(scene: THREE.Scene): void {
    const { width, height, depth, wallThickness, wallColor } = this.config;
    const material = new THREE.MeshStandardMaterial({
      color: wallColor,
      side: THREE.DoubleSide,
    });

    // North wall (positive Z)
    const northWall = this.createWall(
      width,
      height,
      wallThickness,
      material,
      new THREE.Vector3(0, height / 2, depth / 2)
    );

    // South wall (negative Z)
    const southWall = this.createWall(
      width,
      height,
      wallThickness,
      material,
      new THREE.Vector3(0, height / 2, -depth / 2)
    );

    // East wall (positive X)
    const eastWall = this.createWall(
      wallThickness,
      height,
      depth,
      material,
      new THREE.Vector3(width / 2, height / 2, 0)
    );

    // West wall (negative X)
    const westWall = this.createWall(
      wallThickness,
      height,
      depth,
      material,
      new THREE.Vector3(-width / 2, height / 2, 0)
    );

    this.walls = [northWall, southWall, eastWall, westWall];
    this.walls.forEach((wall) => scene.add(wall));
  }

  private createWall(
    width: number,
    height: number,
    depth: number,
    material: THREE.Material,
    position: THREE.Vector3
  ): THREE.Mesh {
    const geometry = new THREE.BoxGeometry(width, height, depth);
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.copy(position);
    return mesh;
  }

  getBounds(): BoundaryConfig {
    return { ...this.config };
  }

  destroy(scene: THREE.Scene): void {
    this.walls.forEach((wall) => {
      scene.remove(wall);
      wall.geometry.dispose();
      if (wall.material instanceof THREE.Material) {
        wall.material.dispose();
      }
    });
    this.walls = [];
  }
}
