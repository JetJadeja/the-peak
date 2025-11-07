import * as THREE from "three";
import { RoadPath } from "./roadPath";
import { HeightmapMetadata } from "./heightmapGenerator";
import {
  TERRAIN_COLOR,
  COLOR_ROAD,
  COLOR_ROAD_LINE,
  COLOR_ROAD_EDGE,
  ROAD_WIDTH,
} from "../config/gameConstants";

/**
 * TerrainColorizer applies vertex colors to terrain geometry
 * based on height, slope, and proximity to roads
 */
export class TerrainColorizer {
  private geometry: THREE.BufferGeometry;
  private roadPath: RoadPath;

  // Pre-created color objects for performance
  private terrainColor: THREE.Color;
  private roadColor: THREE.Color;
  private roadLineColor: THREE.Color;
  private roadEdgeColor: THREE.Color;

  constructor(
    geometry: THREE.BufferGeometry,
    roadPath: RoadPath,
    _metadata: HeightmapMetadata
  ) {
    this.geometry = geometry;
    this.roadPath = roadPath;

    // Initialize color objects
    this.terrainColor = new THREE.Color(TERRAIN_COLOR);
    this.roadColor = new THREE.Color(COLOR_ROAD);
    this.roadLineColor = new THREE.Color(COLOR_ROAD_LINE);
    this.roadEdgeColor = new THREE.Color(COLOR_ROAD_EDGE);
  }

  /**
   * Apply vertex colors to the geometry
   * Colors are based on height, slope, and road proximity
   */
  applyColors(): void {
    const positions = this.geometry.getAttribute("position");
    const vertexCount = positions.count;

    // Create color array (RGB for each vertex)
    const colors = new Float32Array(vertexCount * 3);

    for (let i = 0; i < vertexCount; i++) {
      // Get vertex position (already rotated to Y-up by this point)
      const x = positions.getX(i);
      const z = positions.getZ(i);

      // Calculate distance to road
      const { distance: roadDistance } = this.roadPath.findClosestPoint(x, z);

      // Determine vertex color
      let color: THREE.Color;

      if (roadDistance < ROAD_WIDTH / 2) {
        // On the road surface
        color = this.getRoadColor(x, z, roadDistance);
      } else {
        // Natural terrain - simple grass color
        color = this.terrainColor.clone();
      }

      // Write to color array
      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;
    }

    // Add color attribute to geometry
    this.geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  }

  // Old height-based and slope-based coloring removed - using single terrain color

  /**
   * Get road surface color with center and edge lines
   * Includes texture variation for realistic asphalt appearance
   */
  private getRoadColor(
    x: number,
    z: number,
    distanceFromCenter: number
  ): THREE.Color {
    const halfRoadWidth = ROAD_WIDTH / 2;

    // Deterministic noise for asphalt texture
    const seed = Math.sin(x * 12.9898 + z * 78.233) * 43758.5453;
    const noise = seed - Math.floor(seed) - 0.5; // [-0.5, 0.5]

    // Base road color with subtle texture variation
    let roadColor = this.roadColor.clone();
    const textureFactor = 1.0 + noise * 0.1; // ±10% variation
    roadColor.multiplyScalar(textureFactor);

    // Center line (yellow dashed effect)
    if (distanceFromCenter < 0.2) {
      const centerBlend = 1.0 - distanceFromCenter / 0.2;
      roadColor.lerp(this.roadLineColor, centerBlend * 0.4);
    }

    // Edge lines (white stripes)
    const distFromEdge = Math.abs(halfRoadWidth - distanceFromCenter);
    if (distFromEdge < 0.15) {
      const edgeBlend = 1.0 - distFromEdge / 0.15;
      roadColor.lerp(this.roadEdgeColor, edgeBlend * 0.3);
    }

    return roadColor;
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
  const normals = geometry.getAttribute("normal");
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
  const positions = geometry.getAttribute("position");
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
