import * as THREE from 'three';
import { GROUND_SIZE, GROUND_COLOR } from '../config/gameConstants';

export class Ground {
  private mesh: THREE.Mesh;

  constructor(scene: THREE.Scene) {
    const geometry = new THREE.PlaneGeometry(GROUND_SIZE, GROUND_SIZE);
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

  dispose(): void {
    this.mesh.geometry.dispose();
    if (this.mesh.material instanceof THREE.Material) {
      this.mesh.material.dispose();
    }
  }
}
