import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

export class PlayerCar {
  private model: THREE.Group | null = null;
  private loader: GLTFLoader;

  constructor(scene: THREE.Scene) {
    this.loader = new GLTFLoader();
    this.loadModel(scene);
  }

  private loadModel(scene: THREE.Scene): void {
    this.loader.load(
      '/models/cars/e36.glb',
      (gltf) => {
        this.model = gltf.scene;
        this.model.position.set(0, 0, 0);
        this.model.rotation.y = 0;
        scene.add(this.model);
      },
      undefined,
      (error) => {
        console.error('Error loading car model:', error);
      }
    );
  }

  getModel(): THREE.Group | null {
    return this.model;
  }

  getPosition(): THREE.Vector3 {
    return this.model?.position.clone() || new THREE.Vector3();
  }

  getQuaternion(): THREE.Quaternion {
    return this.model?.quaternion.clone() || new THREE.Quaternion();
  }
}
