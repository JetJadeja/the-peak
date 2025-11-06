import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { GLTF } from 'three/examples/jsm/loaders/GLTFLoader.js';

export class AssetLoader {
  private static instance: AssetLoader;
  private gltfLoader: GLTFLoader;
  private loadingManager: THREE.LoadingManager;
  private onProgress?: (progress: number) => void;
  private onComplete?: () => void;

  private constructor() {
    this.loadingManager = new THREE.LoadingManager();
    this.gltfLoader = new GLTFLoader(this.loadingManager);

    this.loadingManager.onProgress = (_url, loaded, total) => {
      const progress = (loaded / total) * 100;
      this.onProgress?.(progress);
    };

    this.loadingManager.onLoad = () => {
      this.onComplete?.();
    };
  }

  static getInstance(): AssetLoader {
    if (!AssetLoader.instance) {
      AssetLoader.instance = new AssetLoader();
    }
    return AssetLoader.instance;
  }

  setProgressCallback(callback: (progress: number) => void): void {
    this.onProgress = callback;
  }

  setCompleteCallback(callback: () => void): void {
    this.onComplete = callback;
  }

  async loadGLTF(url: string): Promise<GLTF> {
    return new Promise((resolve, reject) => {
      this.gltfLoader.load(
        url,
        (gltf) => resolve(gltf),
        undefined,
        (error) => reject(error)
      );
    });
  }
}
