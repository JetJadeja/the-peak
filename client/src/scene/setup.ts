import * as THREE from 'three';
import { TrackBoundary, Terrain } from '../track';

export interface SceneSetup {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  renderer: THREE.WebGLRenderer;
  trackBoundary: TrackBoundary;
  terrain: Terrain;
}

export function createScene(): SceneSetup {
  // Scene
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x87ceeb); // Sky blue background
  scene.fog = new THREE.Fog(0x87ceeb, 100, 1500); // Add fog for depth

  // Camera - positioned to get a good overview of the valley and mountain
  const camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    3000
  );
  // Position: pulled back and elevated for better overview
  camera.position.set(-100, 120, -200);
  camera.lookAt(0, 40, 100); // Look at the middle of the valley climb

  // Renderer
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.getElementById('app')?.appendChild(renderer.domElement);

  // Lighting
  setupLighting(scene);

  // Terrain (replaces flat ground)
  const terrain = setupTerrain(scene);

  // Track boundary
  const trackBoundary = setupTrackBoundary(scene);

  // Handle window resize
  setupResizeHandler(camera, renderer);

  return { scene, camera, renderer, trackBoundary, terrain };
}

function setupLighting(scene: THREE.Scene): void {
  // Ambient light for overall illumination
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
  scene.add(ambientLight);

  // Main sun light from above and side to show terrain features
  const sunLight = new THREE.DirectionalLight(0xfff4e6, 1.2);
  sunLight.position.set(200, 300, -100);
  sunLight.castShadow = true;
  scene.add(sunLight);

  // Secondary light from opposite side for fill
  const fillLight = new THREE.DirectionalLight(0xb8d4ff, 0.4);
  fillLight.position.set(-200, 200, 100);
  scene.add(fillLight);

  // Hemisphere light for sky/ground ambience
  const hemiLight = new THREE.HemisphereLight(0x87ceeb, 0x2d5a2d, 0.3);
  scene.add(hemiLight);
}

function setupTerrain(scene: THREE.Scene): Terrain {
  const terrain = new Terrain();
  terrain.create(scene);
  return terrain;
}

function setupTrackBoundary(scene: THREE.Scene): TrackBoundary {
  const trackBoundary = new TrackBoundary();
  trackBoundary.create(scene);
  return trackBoundary;
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

