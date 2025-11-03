import * as THREE from 'three';

export class Ground {
  private mesh: THREE.Mesh;

  constructor(scene: THREE.Scene) {
    const geometry = new THREE.PlaneGeometry(50, 50);
    const material = new THREE.MeshStandardMaterial({
      color: 0x00ff00,
      side: THREE.DoubleSide,
    });

    this.mesh = new THREE.Mesh(geometry, material);
    this.mesh.rotation.x = -Math.PI / 2; // Rotate to make it horizontal

    scene.add(this.mesh);
  }

  getMesh(): THREE.Mesh {
    return this.mesh;
  }
}
