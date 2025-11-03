import * as THREE from 'three';
import { CSS2DRenderer, CSS2DObject } from 'three/examples/jsm/renderers/CSS2DRenderer.js';
import { Player } from '@the-peak/shared';

interface RemotePlayer {
  mesh: THREE.Mesh;
  label: CSS2DObject;
  data: Player;
}

export class RemotePlayersManager {
  private players: Map<string, RemotePlayer> = new Map();
  private scene: THREE.Scene;
  private labelRenderer: CSS2DRenderer;

  constructor(scene: THREE.Scene, container: HTMLElement) {
    this.scene = scene;
    this.labelRenderer = this.createLabelRenderer(container);
  }

  private createLabelRenderer(container: HTMLElement): CSS2DRenderer {
    const labelRenderer = new CSS2DRenderer();
    labelRenderer.setSize(window.innerWidth, window.innerHeight);
    labelRenderer.domElement.style.position = 'absolute';
    labelRenderer.domElement.style.top = '0';
    labelRenderer.domElement.style.pointerEvents = 'none';
    container.appendChild(labelRenderer.domElement);

    // Handle window resize
    window.addEventListener('resize', () => {
      labelRenderer.setSize(window.innerWidth, window.innerHeight);
    });

    return labelRenderer;
  }

  private createPlayerMesh(color: number = 0x00ff00): THREE.Mesh {
    const geometry = new THREE.BoxGeometry(2, 1, 3);
    const material = new THREE.MeshStandardMaterial({ color });
    return new THREE.Mesh(geometry, material);
  }

  private createPlayerLabel(username: string): CSS2DObject {
    const div = document.createElement('div');
    div.className = 'player-label';
    div.textContent = username;
    div.style.color = 'white';
    div.style.fontFamily = 'Arial, sans-serif';
    div.style.fontSize = '14px';
    div.style.fontWeight = 'bold';
    div.style.padding = '2px 6px';
    div.style.background = 'rgba(0, 0, 0, 0.6)';
    div.style.borderRadius = '4px';
    div.style.textAlign = 'center';
    div.style.whiteSpace = 'nowrap';

    const label = new CSS2DObject(div);
    label.position.set(0, 2, 0); // Position above the player
    return label;
  }

  addPlayer(player: Player): void {
    if (this.players.has(player.id)) return;

    const mesh = this.createPlayerMesh();
    mesh.position.set(player.position.x, player.position.y, player.position.z);
    mesh.rotation.set(player.rotation.x, player.rotation.y, player.rotation.z);

    const label = this.createPlayerLabel(player.username);
    mesh.add(label);

    this.scene.add(mesh);

    this.players.set(player.id, { mesh, label, data: player });

    console.log(`Added remote player: ${player.username} (${player.id})`);
  }

  removePlayer(playerId: string): void {
    const player = this.players.get(playerId);
    if (!player) return;

    this.scene.remove(player.mesh);
    player.mesh.geometry.dispose();
    if (player.mesh.material instanceof THREE.Material) {
      player.mesh.material.dispose();
    }

    this.players.delete(playerId);

    console.log(`Removed remote player: ${player.data.username} (${playerId})`);
  }

  updatePlayer(
    playerId: string,
    position: { x: number; y: number; z: number },
    rotation: { x: number; y: number; z: number }
  ): void {
    const player = this.players.get(playerId);
    if (!player) return;

    player.mesh.position.set(position.x, position.y, position.z);
    player.mesh.rotation.set(rotation.x, rotation.y, rotation.z);
  }

  render(camera: THREE.Camera): void {
    this.labelRenderer.render(this.scene, camera);
  }

  hasPlayer(playerId: string): boolean {
    return this.players.has(playerId);
  }

  dispose(): void {
    this.players.forEach((player, id) => {
      this.removePlayer(id);
    });
    this.players.clear();

    if (this.labelRenderer.domElement.parentElement) {
      this.labelRenderer.domElement.parentElement.removeChild(
        this.labelRenderer.domElement
      );
    }
  }
}
