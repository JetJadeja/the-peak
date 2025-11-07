import * as THREE from "three";
import {
  SKY_COLOR_HORIZON,
  SKY_COLOR_ZENITH,
  FOG_COLOR,
  FOG_DENSITY,
} from "../config/gameConstants";

/**
 * Setup atmospheric effects including sky gradient and fog
 * Creates the golden hour atmosphere that defines the Art of Rally aesthetic
 *
 * @param scene - The Three.js scene to add effects to
 * @returns Object containing references to sky and fog
 */
export function setupAtmosphericEffects(scene: THREE.Scene): {
  skyMesh: THREE.Mesh;
  fog: THREE.FogExp2;
} {
  console.log("🌅 Setting up atmospheric effects...");

  // Create gradient sky dome
  const skyMesh = createGradientSky();
  scene.add(skyMesh);
  console.log("  → Sky gradient created");

  // Setup subtle exponential fog
  const fog = new THREE.FogExp2(FOG_COLOR, FOG_DENSITY);
  scene.fog = fog;
  console.log(`  → Subtle fog configured (density: ${FOG_DENSITY})`);

  // Set scene background to match horizon color
  // This appears behind the sky sphere (if visible through gaps)
  scene.background = new THREE.Color(SKY_COLOR_HORIZON);

  console.log("✅ Atmospheric effects complete!");

  return { skyMesh, fog };
}

/**
 * Create a gradient sky sphere using custom shader
 * The gradient goes from warm golden at horizon to soft blue at zenith
 */
function createGradientSky(): THREE.Mesh {
  // Large sphere that encompasses entire scene
  const geometry = new THREE.SphereGeometry(500, 32, 32);

  // Custom shader material for smooth gradient
  const material = new THREE.ShaderMaterial({
    uniforms: {
      topColor: { value: new THREE.Color(SKY_COLOR_ZENITH) },
      bottomColor: { value: new THREE.Color(SKY_COLOR_HORIZON) },
      offset: { value: 33 },
      exponent: { value: 0.6 },
    },
    vertexShader: `
      varying vec3 vWorldPosition;
      
      void main() {
        vec4 worldPosition = modelMatrix * vec4(position, 1.0);
        vWorldPosition = worldPosition.xyz;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform vec3 topColor;
      uniform vec3 bottomColor;
      uniform float offset;
      uniform float exponent;
      
      varying vec3 vWorldPosition;
      
      void main() {
        float h = normalize(vWorldPosition + offset).y;
        float mixFactor = pow(max(h, 0.0), exponent);
        vec3 color = mix(bottomColor, topColor, mixFactor);
        gl_FragColor = vec4(color, 1.0);
      }
    `,
    side: THREE.BackSide, // Render from inside the sphere
    depthWrite: false, // Don't write to depth buffer
  });

  const skyMesh = new THREE.Mesh(geometry, material);
  skyMesh.renderOrder = -1; // Render first (background)

  return skyMesh;
}

/**
 * Update fog density dynamically
 * @param scene - The scene with fog
 * @param density - New fog density value
 */
export function updateFogDensity(scene: THREE.Scene, density: number): void {
  if (scene.fog && scene.fog instanceof THREE.FogExp2) {
    scene.fog.density = density;
  }
}

/**
 * Update fog color
 * @param scene - The scene with fog
 * @param color - New fog color (hex number)
 */
export function updateFogColor(scene: THREE.Scene, color: number): void {
  if (scene.fog) {
    scene.fog.color.setHex(color);
  }
}

/**
 * Update sky gradient colors
 * @param skyMesh - The sky mesh to update
 * @param horizonColor - Color at horizon (hex number)
 * @param zenithColor - Color at zenith (hex number)
 */
export function updateSkyColors(
  skyMesh: THREE.Mesh,
  horizonColor: number,
  zenithColor: number
): void {
  const material = skyMesh.material as THREE.ShaderMaterial;
  if (material.uniforms) {
    material.uniforms.bottomColor.value.setHex(horizonColor);
    material.uniforms.topColor.value.setHex(zenithColor);
  }
}

/**
 * Preset: Clear Day (minimal fog, bright blue sky)
 */
export function applyClearDayPreset(
  scene: THREE.Scene,
  skyMesh: THREE.Mesh
): void {
  updateFogDensity(scene, 0.005); // Very light fog
  updateFogColor(scene, 0xe3f2fd);
  updateSkyColors(skyMesh, 0xe3f2fd, 0x1976d2);
}

/**
 * Preset: Golden Hour (default - warm and atmospheric)
 */
export function applyGoldenHourPreset(
  scene: THREE.Scene,
  skyMesh: THREE.Mesh
): void {
  updateFogDensity(scene, FOG_DENSITY);
  updateFogColor(scene, FOG_COLOR);
  updateSkyColors(skyMesh, SKY_COLOR_HORIZON, SKY_COLOR_ZENITH);
}

/**
 * Preset: Misty Morning (heavy fog, cool tones)
 */
export function applyMistyMorningPreset(
  scene: THREE.Scene,
  skyMesh: THREE.Mesh
): void {
  updateFogDensity(scene, 0.02); // Dense fog
  updateFogColor(scene, 0xd0e7f5);
  updateSkyColors(skyMesh, 0xd0e7f5, 0x90caf9);
}

/**
 * Preset: Dusk (deep colors, moderate fog)
 */
export function applyDuskPreset(scene: THREE.Scene, skyMesh: THREE.Mesh): void {
  updateFogDensity(scene, 0.015);
  updateFogColor(scene, 0xff9e80);
  updateSkyColors(skyMesh, 0xff9e80, 0x5c6bc0);
}

/**
 * Create a simple cloud layer for additional atmosphere
 * Returns a mesh that can be added to the scene
 * @param count - Number of cloud sprites
 * @param height - Height of cloud layer
 * @param radius - Radius of cloud distribution
 * @returns Cloud group
 */
export function createSimpleClouds(
  count: number = 20,
  height: number = 40,
  radius: number = 80
): THREE.Group {
  const cloudGroup = new THREE.Group();

  // Simple cloud sprites using planes with transparent textures
  // For POC, we'll use simple circular gradients
  const cloudGeometry = new THREE.PlaneGeometry(10, 5);

  for (let i = 0; i < count; i++) {
    // Random position in circular area
    const angle = (i / count) * Math.PI * 2 + Math.random();
    const dist = radius * (0.5 + Math.random() * 0.5);
    const x = Math.cos(angle) * dist;
    const z = Math.sin(angle) * dist;

    // Create cloud material (simple white plane for now)
    const cloudMaterial = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.3,
      side: THREE.DoubleSide,
    });

    const cloud = new THREE.Mesh(cloudGeometry, cloudMaterial);
    cloud.position.set(x, height + Math.random() * 10, z);
    cloud.rotation.x = -Math.PI / 2; // Face down
    cloud.scale.set(1 + Math.random(), 1, 1 + Math.random()); // Vary size

    cloudGroup.add(cloud);
  }

  return cloudGroup;
}
