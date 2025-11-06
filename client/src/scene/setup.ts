import * as THREE from 'three';
import {
  CAMERA_FOV,
  CAMERA_NEAR,
  CAMERA_FAR,
  DEBUG_SHOW_GRID,
} from '../config/gameConstants';
import { setupGoldenHourLighting } from './goldenHourLighting';
import { setupAtmosphericEffects } from './atmosphericEffects';

export interface SceneSetup {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  renderer: THREE.WebGLRenderer;
}

export function createScene(): SceneSetup {
  // Scene
  const scene = new THREE.Scene();

  // Camera
  const camera = new THREE.PerspectiveCamera(
    CAMERA_FOV,
    window.innerWidth / window.innerHeight,
    CAMERA_NEAR,
    CAMERA_FAR
  );

  // Renderer
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  document.getElementById('app')?.appendChild(renderer.domElement);

  // Setup golden hour lighting
  setupGoldenHourLighting(scene);

  // Setup atmospheric effects (sky gradient and fog)
  setupAtmosphericEffects(scene);

  // Add grid helper for development (optional)
  if (DEBUG_SHOW_GRID) {
    const gridHelper = new THREE.GridHelper(100, 20, 0x444444, 0x222222);
    gridHelper.position.y = 0.02; // Slightly above ground to avoid z-fighting
    scene.add(gridHelper);
  }

  // Handle window resize
  setupResizeHandler(camera, renderer);

  return { scene, camera, renderer };
}

function setupResizeHandler(
  camera: THREE.PerspectiveCamera,
  renderer: THREE.WebGLRenderer
): void {
  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });
}
