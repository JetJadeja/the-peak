import * as THREE from 'three';
import { Player } from '@the-peak/shared';

export class PlayerManager {
  private playerMeshes: Record<string, THREE.Mesh> = {};
  private scene: THREE.Scene;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
  }

  createPlayerMesh(): THREE.Mesh {
    const geometry = new THREE.BoxGeometry(1, 1, 2);
    const material = new THREE.MeshStandardMaterial({
      color: Math.random() * 0xffffff,
    });
    return new THREE.Mesh(geometry, material);
  }

  addPlayer(player: Player): void {
    if (!this.playerMeshes[player.id]) {
      const mesh = this.createPlayerMesh();
      mesh.position.set(player.position.x, player.position.y, player.position.z);
      this.scene.add(mesh);
      this.playerMeshes[player.id] = mesh;
    }
  }

  removePlayer(playerId: string): void {
    const mesh = this.playerMeshes[playerId];
    if (mesh) {
      this.scene.remove(mesh);
      delete this.playerMeshes[playerId];
    }
  }

  updatePlayer(
    playerId: string,
    position: { x: number; y: number; z: number },
    rotation: { x: number; y: number; z: number }
  ): void {
    const mesh = this.playerMeshes[playerId];
    if (mesh) {
      mesh.position.set(position.x, position.y, position.z);
      mesh.rotation.set(rotation.x, rotation.y, rotation.z);
    }
  }

  hasPlayer(playerId: string): boolean {
    return !!this.playerMeshes[playerId];
  }
}
