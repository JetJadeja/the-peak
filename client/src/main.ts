import * as THREE from 'three';
import { io } from 'socket.io-client';
import {
  SocketEvent,
  GameState,
  Player,
  JoinGamePayload,
  PlayerUpdatePayload,
} from '@the-peak/shared';
import './style.css';

// Connect to server
const SERVER_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:3000';
const socket = io(SERVER_URL);

// Three.js scene setup
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
const renderer = new THREE.WebGLRenderer({ antialias: true });

renderer.setSize(window.innerWidth, window.innerHeight);
document.getElementById('app')?.appendChild(renderer.domElement);

// Basic lighting
const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
directionalLight.position.set(10, 10, 10);
scene.add(directionalLight);

// Ground plane
const groundGeometry = new THREE.PlaneGeometry(100, 100);
const groundMaterial = new THREE.MeshStandardMaterial({ color: 0x808080 });
const ground = new THREE.Mesh(groundGeometry, groundMaterial);
ground.rotation.x = -Math.PI / 2;
scene.add(ground);

// Camera position
camera.position.set(0, 5, 10);
camera.lookAt(0, 0, 0);

// Store player meshes
const playerMeshes: Record<string, THREE.Mesh> = {};

// Create a mesh for a player
function createPlayerMesh(): THREE.Mesh {
  const geometry = new THREE.BoxGeometry(1, 1, 2);
  const material = new THREE.MeshStandardMaterial({ color: Math.random() * 0xffffff });
  return new THREE.Mesh(geometry, material);
}

// Socket.io event handlers
socket.on('connect', () => {
  console.log('Connected to server');
  const payload: JoinGamePayload = {
    username: `Player_${Math.floor(Math.random() * 1000)}`,
  };
  socket.emit(SocketEvent.JOIN_GAME, payload);
});

socket.on(SocketEvent.GAME_STATE, (state: GameState) => {
  console.log('Received game state', state);
  // Initialize all existing players
  Object.values(state.players).forEach((player) => {
    if (player.id !== socket.id && !playerMeshes[player.id]) {
      const mesh = createPlayerMesh();
      mesh.position.set(player.position.x, player.position.y, player.position.z);
      scene.add(mesh);
      playerMeshes[player.id] = mesh;
    }
  });
});

socket.on(SocketEvent.PLAYER_JOINED, (player: Player) => {
  console.log('Player joined', player);
  if (player.id !== socket.id) {
    const mesh = createPlayerMesh();
    mesh.position.set(player.position.x, player.position.y, player.position.z);
    scene.add(mesh);
    playerMeshes[player.id] = mesh;
  }
});

socket.on(SocketEvent.PLAYER_LEFT, ({ id }: { id: string }) => {
  console.log('Player left', id);
  const mesh = playerMeshes[id];
  if (mesh) {
    scene.remove(mesh);
    delete playerMeshes[id];
  }
});

socket.on(SocketEvent.PLAYER_UPDATED, (data: { id: string } & PlayerUpdatePayload) => {
  const mesh = playerMeshes[data.id];
  if (mesh) {
    mesh.position.set(data.position.x, data.position.y, data.position.z);
    mesh.rotation.set(data.rotation.x, data.rotation.y, data.rotation.z);
  }
});

// Handle window resize
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// Animation loop
function animate() {
  requestAnimationFrame(animate);
  renderer.render(scene, camera);
}

animate();
