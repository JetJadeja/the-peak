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
export const CAR_INITIAL_POSITION = { x: -42, y: 0, z: -42 }; // Start at track beginning

// Car Color Configuration
export const CAR_COLORS = [
  { name: "Yellow", hex: "#DEAF1A" },
  { name: "Red", hex: "#FF0000" },
  { name: "Blue", hex: "#0066FF" },
  { name: "Green", hex: "#00AA00" },
  { name: "Black", hex: "#1A1A1A" },
  { name: "White", hex: "#FFFFFF" },
  { name: "Orange", hex: "#FF6600" },
  { name: "Purple", hex: "#9900FF" },
  { name: "Pink", hex: "#FF1493" },
  { name: "Cyan", hex: "#00FFFF" },
];
export const DEFAULT_CAR_COLOR = "#DEAF1A";

// Raycasting Configuration (for terrain following)
export const WHEEL_RADIUS = 0.33; // Wheel radius in world units (from E36 model analysis)
export const RAYCAST_START_HEIGHT = 50; // Height to start raycasts from (must be above max terrain)
export const DEBUG_SHOW_RAYCASTS = false; // Show visual debug lines for raycasts

// Wheel Animation Configuration
export const MAX_STEERING_ANGLE = Math.PI / 6; // 30 degrees maximum steering angle
export const STEERING_SPEED = 0.08; // How fast steering responds to input
export const STEERING_RETURN_SPEED = 0.12; // How fast steering returns to center
export const STEERING_VISUAL_MULTIPLIER = 0.5; // Visual reduction (50% of actual)
export const WHEEL_ROTATION_ORDER = "ZYX" as const; // Critical: steering before rolling

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

// Rolling Hills Terrain Generation
export const ROLLING_HILLS_NOISE_SCALE = 0.018; // Very large, smooth features
export const ROLLING_HILLS_OCTAVES = 2; // Minimal layering for smooth hills
export const ROLLING_HILLS_HEIGHT = 3; // Gentle 3-unit variation (2-5 total range)
export const ROLLING_HILLS_BASE_ELEVATION = 2; // Base height of 2 units
export const SMOOTHING_PASSES = 4; // Multiple smoothing iterations for butter-smooth terrain

// Road Integration (smoothing, not flattening)
export const ROAD_WIDTH = 6; // Width of drivable surface
export const ROAD_SMOOTHING_RADIUS = 8; // Gentle smoothing along road
export const ROAD_SMOOTHING_STRENGTH = 0.7; // How much smoothing to apply

// Visual Style - Simplified Color Palette (Art of Rally inspired)
export const TERRAIN_COLOR = 0x8bc34a; // Grass green - single terrain color
export const COLOR_ROAD = 0x333333; // Dark grey asphalt
export const COLOR_ROAD_LINE = 0xffeb3b; // Yellow center line
export const COLOR_ROAD_EDGE = 0xffffff; // White edge lines

// Lighting Parameters - Golden Hour Setup (Softer, more Art of Rally style)
export const SUN_COLOR = 0xfff4e6; // Warm orange-yellow
export const SUN_INTENSITY = 1.0; // Reduced for softer lighting (was 1.2)
export const SUN_POSITION = { x: 40, y: 25, z: 30 }; // Low angle for long shadows
export const SUN_SHADOW_SOFTNESS = 5; // Increased for painterly shadows (was 2)
export const AMBIENT_LIGHT_COLOR_POC = 0xffeaa7; // Warm fill light
export const AMBIENT_LIGHT_INTENSITY_POC = 0.5; // Increased fill (was 0.4)
export const RIM_LIGHT_COLOR = 0x74b9ff; // Cool blue accent
export const RIM_LIGHT_INTENSITY = 0.15; // More subtle (was 0.25)
export const RIM_LIGHT_POSITION = { x: -30, y: 15, z: -30 }; // Opposite sun

// Atmospheric Parameters - Sky and Fog (Subtler for Art of Rally feel)
export const SKY_COLOR_HORIZON = 0xffeaa7; // Golden yellow horizon
export const SKY_COLOR_ZENITH = 0x74b9ff; // Soft blue sky
export const FOG_COLOR = 0xffeaa7; // Match horizon color
export const FOG_DENSITY = 0.008; // Lighter, more subtle fog (was 0.012)

// Debug Toggles
export const DEBUG_SHOW_GRID = true; // Show grid helper during development
