import * as THREE from 'three';
import { RoadPath } from './roadPath';
import { HeightmapMetadata } from './heightmapGenerator';
import {
  COLOR_VALLEY,
  COLOR_MIDLAND,
  COLOR_HIGHLAND,
  COLOR_PEAK,
  COLOR_CLIFF,
  COLOR_ROAD,
  COLOR_ROAD_LINE,
  ROAD_WIDTH,
} from '../config/gameConstants';

/**
 * TerrainColorizer applies vertex colors to terrain geometry
 * based on height, slope, and proximity to roads
 */
export class TerrainColorizer {
  private geometry: THREE.BufferGeometry;
  private roadPath: RoadPath;
  private metadata: HeightmapMetadata;

  // Pre-created color objects for performance
  private valleyColor: THREE.Color;
  private midlandColor: THREE.Color;
  private highlandColor: THREE.Color;
  private peakColor: THREE.Color;
  private cliffColor: THREE.Color;
  private roadColor: THREE.Color;
  private roadLineColor: THREE.Color;

  constructor(
    geometry: THREE.BufferGeometry,
    roadPath: RoadPath,
    metadata: HeightmapMetadata
  ) {
    this.geometry = geometry;
    this.roadPath = roadPath;
    this.metadata = metadata;

    // Initialize color objects
    this.valleyColor = new THREE.Color(COLOR_VALLEY);
    this.midlandColor = new THREE.Color(COLOR_MIDLAND);
    this.highlandColor = new THREE.Color(COLOR_HIGHLAND);
    this.peakColor = new THREE.Color(COLOR_PEAK);
    this.cliffColor = new THREE.Color(COLOR_CLIFF);
    this.roadColor = new THREE.Color(COLOR_ROAD);
    this.roadLineColor = new THREE.Color(COLOR_ROAD_LINE);
  }

  /**
   * Apply vertex colors to the geometry
   * Colors are based on height, slope, and road proximity
   */
  applyColors(): void {
    const positions = this.geometry.getAttribute('position');
    const normals = this.geometry.getAttribute('normal');
    const vertexCount = positions.count;

    // Create color array (RGB for each vertex)
    const colors = new Float32Array(vertexCount * 3);

    for (let i = 0; i < vertexCount; i++) {
      // Get vertex position (already rotated to Y-up by this point)
      const x = positions.getX(i);
      const y = positions.getY(i);
      const z = positions.getZ(i);

      // Get surface normal for slope calculation
      const nx = normals.getX(i);
      const ny = normals.getY(i);
      const nz = normals.getZ(i);

      // Calculate distance to road
      const { distance: roadDistance } = this.roadPath.findClosestPoint(x, z);

      // Determine vertex color
      let color: THREE.Color;

      if (roadDistance < ROAD_WIDTH / 2) {
        // On the road surface
        color = this.getRoadColor(x, z, roadDistance);
      } else {
        // Natural terrain coloring
        color = this.getTerrainColor(y, nx, ny, nz);
      }

      // Add subtle deterministic variation
      color = this.applyColorVariation(color, x, z);

      // Write to color array
      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;
    }

    // Add color attribute to geometry
    this.geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  }

  /**
   * Get terrain color based on height and slope
   */
  private getTerrainColor(
    height: number,
    _nx: number,
    ny: number,
    _nz: number
  ): THREE.Color {
    // Calculate slope from normal (angle from vertical)
    // ny = 1 means flat, ny = 0 means vertical
    const slope = Math.acos(ny); // Radians from vertical
    const slopeDegrees = (slope * 180) / Math.PI;

    // Steep slopes get cliff color regardless of height
    if (slopeDegrees > 45) {
      // Blend between terrain color and cliff color (45-55 degree transition)
      if (slopeDegrees > 55) {
        return this.cliffColor.clone();
      } else {
        // Smooth transition
        const blend = (slopeDegrees - 45) / 10; // 0 to 1 over 45-55 degrees
        const terrainColor = this.getHeightBasedColor(height);
        return terrainColor.lerp(this.cliffColor, blend);
      }
    }

    // Normal height-based coloring
    return this.getHeightBasedColor(height);
  }

  /**
   * Get color based purely on height
   */
  private getHeightBasedColor(height: number): THREE.Color {
    // Normalize height to [0, 1]
    const { minHeight, maxHeight } = this.metadata;
    const normalizedHeight = (height - minHeight) / (maxHeight - minHeight);

    // Define color zones with smooth blending
    if (normalizedHeight < 0.25) {
      // Valley zone
      return this.valleyColor.clone();
    } else if (normalizedHeight < 0.5) {
      // Valley -> Midland transition
      const blend = (normalizedHeight - 0.25) / 0.25;
      return this.valleyColor.clone().lerp(this.midlandColor, blend);
    } else if (normalizedHeight < 0.75) {
      // Midland -> Highland transition
      const blend = (normalizedHeight - 0.5) / 0.25;
      return this.midlandColor.clone().lerp(this.highlandColor, blend);
    } else {
      // Highland -> Peak transition
      const blend = (normalizedHeight - 0.75) / 0.25;
      return this.highlandColor.clone().lerp(this.peakColor, blend);
    }
  }

  /**
   * Get road surface color with optional center line
   */
  private getRoadColor(_x: number, _z: number, distanceFromCenter: number): THREE.Color {
    // Check if near center line (within 0.3 units)
    if (distanceFromCenter < 0.3) {
      // Blend road color with line color for center marking
      const blend = 1.0 - distanceFromCenter / 0.3; // 1 at center, 0 at edge
      return this.roadColor.clone().lerp(this.roadLineColor, blend * 0.3); // 30% line color max
    }

    return this.roadColor.clone();
  }

  /**
   * Apply subtle deterministic color variation
   * Uses position-based pseudo-random to maintain determinism
   */
  private applyColorVariation(color: THREE.Color, x: number, z: number): THREE.Color {
    // Deterministic pseudo-random based on position
    const seed = Math.sin(x * 12.9898 + z * 78.233) * 43758.5453;
    const random = seed - Math.floor(seed); // Fractional part [0, 1]

    // Apply subtle variation (±8% lightness)
    const variation = (random - 0.5) * 0.16; // Range: -0.08 to +0.08
    const factor = 1.0 + variation;

    // Multiply RGB by factor to adjust lightness
    return new THREE.Color(
      Math.max(0, Math.min(1, color.r * factor)),
      Math.max(0, Math.min(1, color.g * factor)),
      Math.max(0, Math.min(1, color.b * factor))
    );
  }
}

/**
 * Utility function to visualize slope angles for debugging
 * Creates a color map from green (flat) to red (steep)
 * @param geometry - Geometry with normal attribute
 * @returns Color attribute for slope visualization
 */
export function createSlopeVisualization(
  geometry: THREE.BufferGeometry
): THREE.BufferAttribute {
  const normals = geometry.getAttribute('normal');
  const vertexCount = normals.count;
  const colors = new Float32Array(vertexCount * 3);

  const flatColor = new THREE.Color(0x00ff00); // Green
  const moderateColor = new THREE.Color(0xffff00); // Yellow
  const steepColor = new THREE.Color(0xff8800); // Orange
  const verysteepColor = new THREE.Color(0xff0000); // Red

  for (let i = 0; i < vertexCount; i++) {
    const ny = normals.getY(i);
    const slope = Math.acos(ny);
    const slopeDegrees = (slope * 180) / Math.PI;

    let color: THREE.Color;

    if (slopeDegrees < 15) {
      color = flatColor;
    } else if (slopeDegrees < 30) {
      const blend = (slopeDegrees - 15) / 15;
      color = flatColor.clone().lerp(moderateColor, blend);
    } else if (slopeDegrees < 45) {
      const blend = (slopeDegrees - 30) / 15;
      color = moderateColor.clone().lerp(steepColor, blend);
    } else {
      const blend = Math.min((slopeDegrees - 45) / 45, 1);
      color = steepColor.clone().lerp(verysteepColor, blend);
    }

    colors[i * 3] = color.r;
    colors[i * 3 + 1] = color.g;
    colors[i * 3 + 2] = color.b;
  }

  return new THREE.BufferAttribute(colors, 3);
}

/**
 * Utility function to visualize height for debugging
 * Creates a grayscale map from black (low) to white (high)
 * @param geometry - Geometry with position attribute
 * @param metadata - Heightmap metadata for min/max values
 * @returns Color attribute for height visualization
 */
export function createHeightVisualization(
  geometry: THREE.BufferGeometry,
  metadata: HeightmapMetadata
): THREE.BufferAttribute {
  const positions = geometry.getAttribute('position');
  const vertexCount = positions.count;
  const colors = new Float32Array(vertexCount * 3);

  const { minHeight, maxHeight } = metadata;

  for (let i = 0; i < vertexCount; i++) {
    const y = positions.getY(i);
    const normalizedHeight = (y - minHeight) / (maxHeight - minHeight);

    // Grayscale based on height
    colors[i * 3] = normalizedHeight;
    colors[i * 3 + 1] = normalizedHeight;
    colors[i * 3 + 2] = normalizedHeight;
  }

  return new THREE.BufferAttribute(colors, 3);
}

