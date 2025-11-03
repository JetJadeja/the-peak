import { createScene } from './scene/setup';
import { Ground } from './track';
import { PlayerCar, CameraController, InputHandler } from './player';
import { AssetLoader } from './utils/assetLoader';
import { NameInputUI } from './ui';
import { NetworkManager } from './network';
import { RemotePlayersManager } from './game';
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

  // Initialize multiplayer components
  const networkManager = new NetworkManager();
  const remotePlayersManager = new RemotePlayersManager(
    scene,
    document.getElementById('app')!
  );

  // Set up network event handlers
  networkManager.setOnGameState((gameState) => {
    console.log('Received game state:', gameState);
    // Add all existing players except ourselves
    Object.values(gameState.players).forEach((player) => {
      if (player.id !== networkManager.getPlayerId()) {
        remotePlayersManager.addPlayer(player);
      }
    });
  });

  networkManager.setOnPlayerJoined((player) => {
    console.log('Player joined:', player.username);
    if (player.id !== networkManager.getPlayerId()) {
      remotePlayersManager.addPlayer(player);
    }
  });

  networkManager.setOnPlayerLeft((playerId) => {
    console.log('Player left:', playerId);
    remotePlayersManager.removePlayer(playerId);
  });

  networkManager.setOnPlayerUpdated((data) => {
    remotePlayersManager.updatePlayer(data.id, data.position, data.rotation);
  });

  // Show name input UI
  const nameInputUI = new NameInputUI();
  nameInputUI.setOnSubmit((username) => {
    console.log(`Joining game as: ${username}`);
    networkManager.joinGame(username);
    nameInputUI.hide();
    startGame();
  });

  let gameStarted = false;

  function startGame() {
    if (gameStarted) return;
    gameStarted = true;

    // Start animation loop
    let lastTime = performance.now();
    let updateTimer = 0;
    const UPDATE_INTERVAL = 1 / 20; // Send updates 20 times per second

    function animate() {
      requestAnimationFrame(animate);

      const currentTime = performance.now();
      const deltaTime = (currentTime - lastTime) / 1000; // Convert to seconds
      lastTime = currentTime;

      updateTimer += deltaTime;

      // Update player car
      playerCar.update(deltaTime);

      // Update camera to follow car
      cameraController.update();

      // Send player update to server at fixed intervals
      if (updateTimer >= UPDATE_INTERVAL && playerCar.isModelReady()) {
        const position = playerCar.getPosition();
        const rotation = playerCar.getRotation();
        const velocity = playerCar.getVelocity();

        networkManager.sendPlayerUpdate({
          position: { x: position.x, y: position.y, z: position.z },
          rotation,
          velocity,
        });

        updateTimer = 0;
      }

      // Render scene
      renderer.render(scene, camera);

      // Render player labels
      remotePlayersManager.render(camera);
    }

    animate();
  }

  // Cleanup on page unload
  window.addEventListener('beforeunload', () => {
    playerCar.dispose();
    ground.dispose();
    inputHandler.dispose();
    networkManager.dispose();
    remotePlayersManager.dispose();
    renderer.dispose();
    nameInputUI.dispose();
  });
}

// Start the application
init().catch((error) => {
  console.error('Application initialization failed:', error);
});
