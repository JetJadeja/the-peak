import { createScene } from './scene/setup';
import { Ground } from './track';
import { PlayerCar, CameraController } from './player';
import './style.css';

// Initialize scene
const { scene, camera, renderer } = createScene();

// Initialize ground
const ground = new Ground(scene);

// Initialize player car
const playerCar = new PlayerCar(scene);

// Initialize camera controller
const cameraController = new CameraController(camera, playerCar);

// Animation loop
function animate() {
  requestAnimationFrame(animate);

  // Update camera to follow car
  cameraController.update();

  // Render scene
  renderer.render(scene, camera);
}

animate();
