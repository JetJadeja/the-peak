// Scene Configuration
export const SCENE_BACKGROUND_COLOR = 0x87ceeb; // Sky blue
export const CAMERA_FOV = 75;
export const CAMERA_NEAR = 0.1;
export const CAMERA_FAR = 1000;

// Lighting Configuration
export const AMBIENT_LIGHT_COLOR = 0xffffff;
export const AMBIENT_LIGHT_INTENSITY = 0.6;
export const DIRECTIONAL_LIGHT_COLOR = 0xffffff;
export const DIRECTIONAL_LIGHT_INTENSITY = 0.8;
export const DIRECTIONAL_LIGHT_POSITION = { x: 5, y: 10, z: 5 };

// Ground Configuration
export const GROUND_SIZE = 100; // Larger terrain
export const GROUND_SEGMENTS = 100; // Subdivisions for terrain detail
export const GROUND_COLOR = 0x00ff00; // Green
export const TERRAIN_HEIGHT = 1.5; // Maximum hill height (steeper)
export const TERRAIN_FREQUENCY = 0.1; // Wave frequency for hills

// Car Configuration
export const CAR_MODEL_PATH = "/models/cars/e36.glb";
export const CAR_SPEED = 20;
export const CAR_TURN_SPEED = 2;
export const CAR_DECELERATION = 0.95;
export const CAR_MIN_SPEED_THRESHOLD = 0.1;
export const CAR_INITIAL_POSITION = { x: 0, y: 0, z: 0 };

// Raycasting Configuration (for terrain following)
export const WHEEL_RADIUS = 0.33; // Wheel radius in world units (from E36 model analysis)
export const RAYCAST_START_HEIGHT = 50; // Height to start raycasts from (must be above max terrain)
export const DEBUG_SHOW_RAYCASTS = true; // Show visual debug lines for raycasts

// Terrain Following Configuration
export const TERRAIN_FOLLOW_ENABLE_ROTATION = true; // Enable pitch/roll based on terrain slope
export const TERRAIN_FOLLOW_ROTATION_SMOOTHING = 0.15; // 0 = instant, 1 = very slow
export const TERRAIN_FOLLOW_HEIGHT_SMOOTHING = 0.25; // Smoothing for height transitions
export const MAX_PITCH_ANGLE = Math.PI / 4; // 45 degrees max pitch
export const MAX_ROLL_ANGLE = Math.PI / 3; // 60 degrees max roll

// Camera Configuration
export const CAMERA_OFFSET = { x: 8, y: 3, z: 0 };
export const CAMERA_LERP_SPEED = 0.1;
export const CAMERA_LOOK_AT_OFFSET_Y = 1;

// Input Configuration
export const KEY_FORWARD = "w";
export const KEY_BACKWARD = "s";
export const KEY_LEFT = "a";
export const KEY_RIGHT = "d";

// Network Configuration
export const NETWORK_UPDATE_RATE = 20; // Updates per second
export const NETWORK_UPDATE_INTERVAL = 1 / NETWORK_UPDATE_RATE;
export const REMOTE_PLAYER_LERP_SPEED = 0.2; // Interpolation speed for remote players

// UI Configuration
export const ERROR_DISPLAY_DURATION = 5000; // milliseconds

// ========================================
// POC TERRAIN SYSTEM CONFIGURATION
// ========================================

// Terrain Size and Detail Constants
export const POC_TERRAIN_SIZE = 100; // units (matching existing system)
export const POC_TERRAIN_SEGMENTS = 100; // 10,201 vertices total
export const POC_TERRAIN_SEED = "mountain-pass-v1"; // Fixed seed for determinism

// Noise Generation Parameters (Fractional Brownian Motion)
export const BASE_NOISE_SCALE = 0.08; // Controls "zoom" of terrain features (was 0.04)
export const OCTAVES = 3; // Number of noise layers to combine (was 5)
export const PERSISTENCE = 0.6; // Each octave's contribution (was 0.5)
export const LACUNARITY = 2.0; // Frequency multiplier between octaves
export const HEIGHT_MULTIPLIER = 2.5; // Maximum terrain elevation in units (was 10)

// Road System Parameters
export const ROAD_WIDTH = 6; // Width of drivable surface
export const ROAD_INFLUENCE_RADIUS = 15; // How far terrain flattening extends
export const ROAD_FLATTEN_STRENGTH = 2.5; // Exponential falloff curve strength
export const ROAD_SHOULDER_HEIGHT_OFFSET = 0.2; // Road depression below terrain

// Visual Style - Color Palette (Art of Rally inspired)
export const COLOR_VALLEY = 0x8bc34a; // Brighter grass green (was 0x7cb342)
export const COLOR_MIDLAND = 0xaed581; // Light green-yellow (was 0x9ccc65)
export const COLOR_HIGHLAND = 0xbcaaa4; // Light warm brown (was 0x8d6e63)
export const COLOR_PEAK = 0x90a4ae; // Light blue-grey (was 0x607d8b)
export const COLOR_CLIFF = 0xa1887f; // Light rock brown - MUCH LIGHTER (was 0x5d4037)
export const COLOR_ROAD = 0x333333; // Dark grey asphalt
export const COLOR_ROAD_LINE = 0xffeb3b; // Yellow center line

// Lighting Parameters - Golden Hour Setup
export const SUN_COLOR = 0xfff4e6; // Warm orange-yellow
export const SUN_INTENSITY = 1.2; // Boosted for golden hour glow
export const SUN_POSITION = { x: 40, y: 25, z: 30 }; // Low angle for long shadows
export const AMBIENT_LIGHT_COLOR_POC = 0xffeaa7; // Warm fill light
export const AMBIENT_LIGHT_INTENSITY_POC = 0.4; // Subtle ambient
export const RIM_LIGHT_COLOR = 0x74b9ff; // Cool blue accent
export const RIM_LIGHT_INTENSITY = 0.25; // Subtle rim lighting
export const RIM_LIGHT_POSITION = { x: -30, y: 15, z: -30 }; // Opposite sun

// Atmospheric Parameters - Sky and Fog
export const SKY_COLOR_HORIZON = 0xffeaa7; // Golden yellow horizon
export const SKY_COLOR_ZENITH = 0x74b9ff; // Soft blue sky
export const FOG_COLOR = 0xffeaa7; // Match horizon color
export const FOG_DENSITY = 0.012; // Exponential fog density

// Debug Toggles
export const DEBUG_SHOW_GRID = true; // Show grid helper during development
