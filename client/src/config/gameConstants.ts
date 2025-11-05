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
export const TERRAIN_HEIGHT = 3.0; // Maximum hill height (steeper)
export const TERRAIN_FREQUENCY = 0.1; // Wave frequency for hills

// Car Configuration
export const CAR_MODEL_PATH = '/models/cars/e36.glb';
export const CAR_SPEED = 20;
export const CAR_TURN_SPEED = 2;
export const CAR_DECELERATION = 0.95;
export const CAR_MIN_SPEED_THRESHOLD = 0.1;
export const CAR_INITIAL_POSITION = { x: 0, y: 0, z: 0 };

// Raycasting Configuration (for terrain following)
export const WHEEL_RADIUS = 0.33; // Wheel radius in world units (from E36 model analysis)
export const RAYCAST_START_HEIGHT = 50; // Height to start raycasts from (must be above max terrain)
export const DEBUG_SHOW_RAYCASTS = true; // Show visual debug lines for raycasts

// Camera Configuration
export const CAMERA_OFFSET = { x: 8, y: 3, z: 0 };
export const CAMERA_LERP_SPEED = 0.1;
export const CAMERA_LOOK_AT_OFFSET_Y = 1;

// Input Configuration
export const KEY_FORWARD = 'w';
export const KEY_BACKWARD = 's';
export const KEY_LEFT = 'a';
export const KEY_RIGHT = 'd';

// Network Configuration
export const NETWORK_UPDATE_RATE = 20; // Updates per second
export const NETWORK_UPDATE_INTERVAL = 1 / NETWORK_UPDATE_RATE;
export const REMOTE_PLAYER_LERP_SPEED = 0.2; // Interpolation speed for remote players

// UI Configuration
export const ERROR_DISPLAY_DURATION = 5000; // milliseconds
