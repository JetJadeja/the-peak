import * as THREE from 'three';
import { TrackBoundary } from '../track';

export interface SceneSetup {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  renderer: THREE.WebGLRenderer;
  trackBoundary: TrackBoundary;
}

export function createScene(): SceneSetup {
  // Scene
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x87ceeb); // Sky blue background

  // Camera - positioned INSIDE the arena, elevated to see the whole play area
  const camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    2000
  );
  camera.position.set(0, 200, 180);
  camera.lookAt(0, 0, 0);

  // Renderer
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.getElementById('app')?.appendChild(renderer.domElement);

  // Lighting
  setupLighting(scene);

  // Ground
  setupGround(scene);

  // Track boundary
  const trackBoundary = setupTrackBoundary(scene);

  // Handle window resize
  setupResizeHandler(camera, renderer);

  return { scene, camera, renderer, trackBoundary };
}

function setupLighting(scene: THREE.Scene): void {
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
  scene.add(ambientLight);

  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
  directionalLight.position.set(10, 10, 10);
  scene.add(directionalLight);
}

function setupGround(scene: THREE.Scene): void {
  const groundGeometry = new THREE.PlaneGeometry(300, 600); // Width x Depth
  const groundMaterial = new THREE.MeshStandardMaterial({ color: 0x2d5a2d });
  const ground = new THREE.Mesh(groundGeometry, groundMaterial);
  ground.rotation.x = -Math.PI / 2;
  scene.add(ground);
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

export function startAnimationLoop(
  scene: THREE.Scene,
  camera: THREE.PerspectiveCamera,
  renderer: THREE.WebGLRenderer
): void {
  function animate() {
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
  }
  animate();
}
