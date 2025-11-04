import * as THREE from 'three';
import {
  SCENE_BACKGROUND_COLOR,
  CAMERA_FOV,
  CAMERA_NEAR,
  CAMERA_FAR,
  AMBIENT_LIGHT_COLOR,
  AMBIENT_LIGHT_INTENSITY,
  DIRECTIONAL_LIGHT_COLOR,
  DIRECTIONAL_LIGHT_INTENSITY,
  DIRECTIONAL_LIGHT_POSITION,
} from '../config/gameConstants';

export interface SceneSetup {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  renderer: THREE.WebGLRenderer;
}

export function createScene(): SceneSetup {
  // Scene
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(SCENE_BACKGROUND_COLOR);

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

  // Lighting
  setupLighting(scene);

  // Handle window resize
  setupResizeHandler(camera, renderer);

  return { scene, camera, renderer };
}

function setupLighting(scene: THREE.Scene): void {
  const ambientLight = new THREE.AmbientLight(
    AMBIENT_LIGHT_COLOR,
    AMBIENT_LIGHT_INTENSITY
  );
  scene.add(ambientLight);

  const directionalLight = new THREE.DirectionalLight(
    DIRECTIONAL_LIGHT_COLOR,
    DIRECTIONAL_LIGHT_INTENSITY
  );
  directionalLight.position.set(
    DIRECTIONAL_LIGHT_POSITION.x,
    DIRECTIONAL_LIGHT_POSITION.y,
    DIRECTIONAL_LIGHT_POSITION.z
  );

  // Enable shadows
  directionalLight.castShadow = true;
  directionalLight.shadow.mapSize.width = 2048;
  directionalLight.shadow.mapSize.height = 2048;
  directionalLight.shadow.camera.left = -50;
  directionalLight.shadow.camera.right = 50;
  directionalLight.shadow.camera.top = 50;
  directionalLight.shadow.camera.bottom = -50;
  directionalLight.shadow.camera.near = 0.5;
  directionalLight.shadow.camera.far = 100;

  scene.add(directionalLight);

  // Add grid helper for perspective/debugging
  const gridHelper = new THREE.GridHelper(100, 20, 0x444444, 0x222222);
  gridHelper.position.y = -0.01; // Slightly below ground to avoid z-fighting
  scene.add(gridHelper);

  // Add fog for depth perception
  scene.fog = new THREE.Fog(SCENE_BACKGROUND_COLOR, 30, 80);
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
