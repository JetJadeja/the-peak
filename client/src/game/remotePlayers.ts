import * as THREE from 'three';
import { CSS2DRenderer, CSS2DObject } from 'three/examples/jsm/renderers/CSS2DRenderer.js';
import { Player } from '@the-peak/shared';
import { AssetLoader } from '../utils/assetLoader';
import { CAR_MODEL_PATH } from '../config/gameConstants';

interface RemotePlayer {
  model: THREE.Group;
  label: CSS2DObject;
  data: Player;
}

export class RemotePlayersManager {
  private players: Map<string, RemotePlayer> = new Map();
  private scene: THREE.Scene;
  private labelRenderer: CSS2DRenderer;
  private carTemplate: THREE.Group | null = null;
  private isCarTemplateLoaded: boolean = false;

  constructor(scene: THREE.Scene, container: HTMLElement) {
    this.scene = scene;
    this.labelRenderer = this.createLabelRenderer(container);
    this.loadCarTemplate();
  }

  private async loadCarTemplate(): Promise<void> {
    try {
      const assetLoader = AssetLoader.getInstance();
      const gltf = await assetLoader.loadGLTF(CAR_MODEL_PATH);
      this.carTemplate = gltf.scene;
      this.isCarTemplateLoaded = true;
      console.log('Car template loaded for remote players');
    } catch (error) {
      console.error('Failed to load car template:', error);
    }
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

  private cloneCarModel(): THREE.Group {
    if (!this.carTemplate) {
      // Fallback to simple box if car not loaded yet
      const geometry = new THREE.BoxGeometry(2, 1, 3);
      const material = new THREE.MeshStandardMaterial({ color: 0x00ff00 });
      const mesh = new THREE.Mesh(geometry, material);
      const group = new THREE.Group();
      group.add(mesh);
      return group;
    }

    return this.carTemplate.clone(true);
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
    label.position.set(0, 3, 0); // Position above the car
    return label;
  }

  addPlayer(player: Player): void {
    if (this.players.has(player.id)) return;

    const model = this.cloneCarModel();
    model.position.set(player.position.x, player.position.y, player.position.z);
    model.rotation.set(player.rotation.x, player.rotation.y, player.rotation.z);

    const label = this.createPlayerLabel(player.username);
    model.add(label);

    this.scene.add(model);

    this.players.set(player.id, { model, label, data: player });

    console.log(`Added remote player: ${player.username} (${player.id})`);
  }

  removePlayer(playerId: string): void {
    const player = this.players.get(playerId);
    if (!player) return;

    // Remove label from model first
    player.model.remove(player.label);

    // Remove label DOM element
    if (player.label.element.parentNode) {
      player.label.element.parentNode.removeChild(player.label.element);
    }

    // Remove model from scene
    this.scene.remove(player.model);

    // Dispose of all meshes in the model
    player.model.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.geometry.dispose();
        if (Array.isArray(child.material)) {
          child.material.forEach((material) => material.dispose());
        } else {
          child.material.dispose();
        }
      }
    });

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

    player.model.position.set(position.x, position.y, position.z);
    player.model.rotation.set(rotation.x, rotation.y, rotation.z);
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

    if (this.carTemplate) {
      this.carTemplate.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.geometry.dispose();
          if (Array.isArray(child.material)) {
            child.material.forEach((material) => material.dispose());
          } else {
            child.material.dispose();
          }
        }
      });
      this.carTemplate = null;
    }

    if (this.labelRenderer.domElement.parentElement) {
      this.labelRenderer.domElement.parentElement.removeChild(
        this.labelRenderer.domElement
      );
    }
  }
}
