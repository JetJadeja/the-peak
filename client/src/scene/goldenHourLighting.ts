import * as THREE from "three";
import {
  SUN_COLOR,
  SUN_INTENSITY,
  SUN_POSITION,
  SUN_SHADOW_SOFTNESS,
  AMBIENT_LIGHT_COLOR_POC,
  AMBIENT_LIGHT_INTENSITY_POC,
  RIM_LIGHT_COLOR,
  RIM_LIGHT_INTENSITY,
  RIM_LIGHT_POSITION,
} from "../config/gameConstants";

/**
 * Setup golden hour lighting for Art of Rally aesthetic
 * Creates warm, directional sun with soft ambient fill and optional rim light
 *
 * @param scene - The Three.js scene to add lights to
 * @returns Object containing light references for potential runtime adjustments
 */
export function setupGoldenHourLighting(scene: THREE.Scene): {
  sun: THREE.DirectionalLight;
  ambient: THREE.AmbientLight;
  rim: THREE.DirectionalLight;
} {
  console.log("☀️ Setting up golden hour lighting...");

  // ===== Main Sun Light =====
  // Warm, low-angle directional light that creates long shadows
  const sun = new THREE.DirectionalLight(SUN_COLOR, SUN_INTENSITY);
  sun.position.set(SUN_POSITION.x, SUN_POSITION.y, SUN_POSITION.z);

  // High-quality shadow configuration
  sun.castShadow = true;
  sun.shadow.mapSize.width = 4096;
  sun.shadow.mapSize.height = 4096;

  // Orthographic shadow camera bounds (must cover entire terrain + margins)
  sun.shadow.camera.left = -60;
  sun.shadow.camera.right = 60;
  sun.shadow.camera.top = 60;
  sun.shadow.camera.bottom = -60;
  sun.shadow.camera.near = 0.5;
  sun.shadow.camera.far = 150;

  // Shadow tweaks for quality - extra soft for Art of Rally painterly look
  sun.shadow.bias = -0.0001; // Prevents shadow acne
  sun.shadow.radius = SUN_SHADOW_SOFTNESS; // Very soft, painterly shadows

  scene.add(sun);
  console.log("  → Sun light configured");

  // ===== Ambient Fill Light =====
  // Subtle warm ambient to prevent pure black shadows
  // Simulates scattered skylight
  const ambient = new THREE.AmbientLight(
    AMBIENT_LIGHT_COLOR_POC,
    AMBIENT_LIGHT_INTENSITY_POC
  );
  scene.add(ambient);
  console.log("  → Ambient light configured");

  // ===== Rim Light (Optional Enhancement) =====
  // Cool-toned accent light from opposite direction
  // Creates rim lighting on elevated terrain features
  const rim = new THREE.DirectionalLight(RIM_LIGHT_COLOR, RIM_LIGHT_INTENSITY);
  rim.position.set(
    RIM_LIGHT_POSITION.x,
    RIM_LIGHT_POSITION.y,
    RIM_LIGHT_POSITION.z
  );
  rim.castShadow = false; // Only sun casts shadows
  scene.add(rim);
  console.log("  → Rim light configured");

  console.log("✅ Golden hour lighting complete!");

  return { sun, ambient, rim };
}

/**
 * Create a helper to visualize the sun light direction
 * Useful for debugging and tuning light position
 * @param sun - The directional light to visualize
 * @returns Helper object to add to scene
 */
export function createSunHelper(
  sun: THREE.DirectionalLight
): THREE.DirectionalLightHelper {
  return new THREE.DirectionalLightHelper(sun, 5, 0xffff00);
}

/**
 * Create a helper to visualize shadow camera bounds
 * Useful for debugging shadow coverage
 * @param sun - The directional light with shadows
 * @returns Helper object to add to scene
 */
export function createShadowCameraHelper(
  sun: THREE.DirectionalLight
): THREE.CameraHelper {
  return new THREE.CameraHelper(sun.shadow.camera);
}

/**
 * Adjust sun position for different times of day
 * @param sun - The sun light to adjust
 * @param elevation - Angle above horizon in degrees (0-90)
 * @param azimuth - Horizontal angle in degrees (0-360)
 */
export function adjustSunPosition(
  sun: THREE.DirectionalLight,
  elevation: number,
  azimuth: number
): void {
  // Convert angles to radians
  const elevRad = (elevation * Math.PI) / 180;
  const azimRad = (azimuth * Math.PI) / 180;

  // Calculate position on sphere
  const distance = 50; // Distance from origin
  const x = distance * Math.cos(elevRad) * Math.cos(azimRad);
  const y = distance * Math.sin(elevRad);
  const z = distance * Math.cos(elevRad) * Math.sin(azimRad);

  sun.position.set(x, y, z);
}

/**
 * Preset: Sunrise/Sunset (very low sun, warm and dramatic)
 */
export function applySunsetPreset(sun: THREE.DirectionalLight): void {
  sun.intensity = 1.4;
  sun.color.setHex(0xffa860); // Deep orange
  adjustSunPosition(sun, 15, 120); // Very low, from side
}

/**
 * Preset: Midday (high sun, neutral and bright)
 */
export function applyMiddayPreset(sun: THREE.DirectionalLight): void {
  sun.intensity = 1.8;
  sun.color.setHex(0xfffef0); // Bright white
  adjustSunPosition(sun, 70, 180); // High overhead
}

/**
 * Preset: Golden Hour (current default, warm and cinematic)
 */
export function applyGoldenHourPreset(sun: THREE.DirectionalLight): void {
  sun.intensity = SUN_INTENSITY;
  sun.color.setHex(SUN_COLOR);
  sun.position.set(SUN_POSITION.x, SUN_POSITION.y, SUN_POSITION.z);
}
