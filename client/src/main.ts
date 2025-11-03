import { createScene } from './scene/setup';
import { InputHandler, PlayerCar, CameraController } from './player';
import './style.css';

// Initialize scene
const { scene, camera, renderer, terrain } = createScene();

// Initialize input handler
const inputHandler = new InputHandler();

// Initialize player car
const playerCar = new PlayerCar(scene, terrain, inputHandler);

// Initialize camera controller
const cameraController = new CameraController(camera, playerCar);

// Animation loop with delta time
let lastTime = performance.now();

function animate() {
  requestAnimationFrame(animate);

  const currentTime = performance.now();
  const deltaTime = (currentTime - lastTime) / 1000; // Convert to seconds
  lastTime = currentTime;

  // Update player car
  playerCar.update(deltaTime);

  // Update camera to follow player
  cameraController.update();

  // Render scene
  renderer.render(scene, camera);
}

animate();
