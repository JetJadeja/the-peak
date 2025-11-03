import { createScene } from './scene/setup';
import { Ground } from './track';
import { PlayerCar, CameraController, InputHandler } from './player';
import { AssetLoader } from './utils/assetLoader';
import './style.css';

async function init() {
  // Initialize scene
  const { scene, camera, renderer } = createScene();

  // Set up loading callbacks
  const assetLoader = AssetLoader.getInstance();
  assetLoader.setProgressCallback((progress) => {
    console.log(`Loading: ${progress.toFixed(0)}%`);
  });
  assetLoader.setCompleteCallback(() => {
    console.log('All assets loaded');
  });

  // Initialize ground
  const ground = new Ground(scene);

  // Initialize input handler
  const inputHandler = new InputHandler();

  // Initialize player car
  const playerCar = new PlayerCar(inputHandler);

  // Load car model and add to scene
  try {
    const carModel = await playerCar.load();
    scene.add(carModel);
    console.log('Car loaded successfully');
  } catch (error) {
    console.error('Failed to initialize game:', error);
    return;
  }

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

  // Cleanup on page unload
  window.addEventListener('beforeunload', () => {
    playerCar.dispose();
    ground.dispose();
    inputHandler.dispose();
    renderer.dispose();
  });
}

// Start the application
init().catch((error) => {
  console.error('Application initialization failed:', error);
});
