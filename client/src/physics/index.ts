/**
 * Physics module - Clean, reusable physics systems for the game
 * 
 * This module provides:
 * - Raycasting utilities for terrain queries
 * - Wheel detection and management
 * - Terrain following orchestration
 * - Debug visualization tools
 */

// Core types and interfaces
export type {
  RaycastResult,
  RaycastOptions,
  RaycastTarget,
  WheelConfig,
  WheelInfo,
  TerrainPhysics,
  TerrainFollowOptions,
} from './types';

// Main physics classes
export { TerrainRaycaster } from './raycaster';
export { WheelSystem } from './wheelSystem';
export { TerrainFollower } from './terrainFollower';

// Debug utilities
export { RaycastDebugger } from './debug/raycastDebugger';
export type { RaycastDebugOptions } from './debug/raycastDebugger';

