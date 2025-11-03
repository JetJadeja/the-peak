import { createScene, startAnimationLoop } from './scene/setup';
import { PlayerManager } from './game/player';
import { NetworkManager } from './network/socket';
import './style.css';

// Initialize scene
const { scene, camera, renderer } = createScene();

// Initialize player manager
const playerManager = new PlayerManager(scene);

// Initialize network manager
new NetworkManager(playerManager);

// Start animation loop
startAnimationLoop(scene, camera, renderer);
