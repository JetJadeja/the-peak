import { createScene } from './scene/setup';
import { Ground } from './track';
import { PlayerCar, CameraController, InputHandler } from './player';
import './style.css';

// Initialize scene
const { scene, camera, renderer } = createScene();

// Initialize ground
const ground = new Ground(scene);

// Initialize input handler
const inputHandler = new InputHandler();

// Initialize player car
const playerCar = new PlayerCar(scene, inputHandler);

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

  // Update camera to follow car
  cameraController.update();

  // Render scene
  renderer.render(scene, camera);
}

animate();
