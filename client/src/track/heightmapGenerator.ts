import { createNoise2D, NoiseFunction2D } from 'simplex-noise';
import alea from 'alea';
import { RoadPath } from './roadPath';
import {
  POC_TERRAIN_SIZE,
  POC_TERRAIN_SEGMENTS,
  POC_TERRAIN_SEED,
  BASE_NOISE_SCALE,
  OCTAVES,
  PERSISTENCE,
  LACUNARITY,
  HEIGHT_MULTIPLIER,
  ROAD_INFLUENCE_RADIUS,
  ROAD_FLATTEN_STRENGTH,
  ROAD_SHOULDER_HEIGHT_OFFSET,
} from '../config/gameConstants';

/**
 * Metadata about the generated heightmap
 */
export interface HeightmapMetadata {
  minHeight: number;
  maxHeight: number;
  size: number;
  segments: number;
}

/**
 * HeightmapGenerator creates deterministic terrain using Simplex noise
 * with Fractional Brownian Motion (fBm) and road-aware flattening
 */
export class HeightmapGenerator {
  private noise2D: NoiseFunction2D;
  private roadPath: RoadPath;
  private size: number;
  private segments: number;

  /**
   * @param roadPath - The road path to integrate into terrain
   * @param seed - Seed string for deterministic generation
   */
  constructor(roadPath: RoadPath, seed: string = POC_TERRAIN_SEED) {
    this.roadPath = roadPath;
    this.size = POC_TERRAIN_SIZE;
    this.segments = POC_TERRAIN_SEGMENTS;

    // Create deterministic noise function using seeded PRNG
    const prng = alea(seed);
    this.noise2D = createNoise2D(prng);
  }

  /**
   * Generate the complete heightmap with road integration
   * @returns Object containing heightmap data and metadata
   */
  generate(): { heightmap: Float32Array; metadata: HeightmapMetadata } {
    const vertexCount = (this.segments + 1) * (this.segments + 1);
    const heightmap = new Float32Array(vertexCount);

    console.log('  → Step 1: Generating base terrain with fBm...');
    // Step 1: Generate base terrain using Fractional Brownian Motion
    this.generateBaseTerrain(heightmap);

    console.log('  → Step 2: Applying Gaussian smoothing...');
    // Step 2: Apply Gaussian smoothing to eliminate jaggedness
    this.smoothHeightmap(heightmap);

    console.log('  → Step 3: Applying edge falloff...');
    // Step 3: Apply edge falloff to prevent boundary walls
    this.applyEdgeFalloff(heightmap);

    console.log('  → Step 4: Limiting slopes to 35°...');
    // Step 4: Limit slopes to ensure gentle, drivable terrain
    this.limitSlopes(heightmap);

    console.log('  → Step 5: Flattening road surface...');
    // Step 5: Apply road-aware flattening (must be last)
    this.applyRoadFlattening(heightmap);

    console.log('  → Step 6: Calculating metadata...');
    // Step 6: Calculate metadata
    const metadata = this.calculateMetadata(heightmap);

    // Log validation info
    this.logValidationInfo(heightmap);

    return { heightmap, metadata };
  }

  /**
   * Generate base terrain using layered Simplex noise (fBm technique)
   */
  private generateBaseTerrain(heightmap: Float32Array): void {
    const halfSize = this.size / 2;

    for (let row = 0; row <= this.segments; row++) {
      for (let col = 0; col <= this.segments; col++) {
        const index = row * (this.segments + 1) + col;

        // Convert grid coordinates to world coordinates (centered at origin)
        const x = (col / this.segments) * this.size - halfSize;
        const z = (row / this.segments) * this.size - halfSize;

        // Generate height using Fractional Brownian Motion
        const height = this.fbm(x, z);

        heightmap[index] = height;
      }
    }
  }

  /**
   * Fractional Brownian Motion - layered noise for natural terrain
   * @param x - World X coordinate
   * @param z - World Z coordinate
   * @returns Height value
   */
  private fbm(x: number, z: number): number {
    let totalHeight = 0;
    let amplitude = 1;
    let frequency = 1;
    let maxValue = 0; // For normalization

    // Layer multiple octaves of noise
    for (let octave = 0; octave < OCTAVES; octave++) {
      // Sample noise at current frequency
      const sampleX = x * BASE_NOISE_SCALE * frequency;
      const sampleZ = z * BASE_NOISE_SCALE * frequency;
      
      // Simplex noise returns values in [-1, 1]
      const noiseValue = this.noise2D(sampleX, sampleZ);
      
      // Accumulate weighted noise
      totalHeight += noiseValue * amplitude;
      maxValue += amplitude;

      // Update for next octave
      amplitude *= PERSISTENCE; // Reduces by half each time (default 0.5)
      frequency *= LACUNARITY;  // Doubles each time (default 2.0)
    }

    // Normalize to [-1, 1] range, then scale by height multiplier
    const normalizedHeight = totalHeight / maxValue;
    return normalizedHeight * HEIGHT_MULTIPLIER;
  }

  /**
   * Apply road flattening to create drivable surfaces
   * Uses exponential falloff for smooth blending
   */
  private applyRoadFlattening(heightmap: Float32Array): void {
    const halfSize = this.size / 2;

    for (let row = 0; row <= this.segments; row++) {
      for (let col = 0; col <= this.segments; col++) {
        const index = row * (this.segments + 1) + col;

        // Convert to world coordinates
        const x = (col / this.segments) * this.size - halfSize;
        const z = (row / this.segments) * this.size - halfSize;

        // Find closest point on road
        const { distance, roadElevation } = this.roadPath.findClosestPoint(x, z);

        // Only modify terrain within influence radius
        if (distance < ROAD_INFLUENCE_RADIUS) {
          const naturalHeight = heightmap[index];

          // Calculate influence factor using exponential falloff
          // When distance = 0 (on road): influence = 1.0 (full effect)
          // When distance = ROAD_INFLUENCE_RADIUS: influence = 0.0 (no effect)
          const normalizedDistance = distance / ROAD_INFLUENCE_RADIUS;
          const influenceFactor = 1.0 - Math.pow(normalizedDistance, ROAD_FLATTEN_STRENGTH);

          // Target height: road elevation with slight depression
          const targetHeight = roadElevation - ROAD_SHOULDER_HEIGHT_OFFSET;

          // Blend between natural and flattened height
          const blendedHeight = this.lerp(naturalHeight, targetHeight, influenceFactor);

          heightmap[index] = blendedHeight;
        }
      }
    }
  }

  /**
   * Calculate heightmap statistics for metadata
   */
  private calculateMetadata(heightmap: Float32Array): HeightmapMetadata {
    let minHeight = Infinity;
    let maxHeight = -Infinity;

    for (let i = 0; i < heightmap.length; i++) {
      const h = heightmap[i];
      if (h < minHeight) minHeight = h;
      if (h > maxHeight) maxHeight = h;
    }

    return {
      minHeight,
      maxHeight,
      size: this.size,
      segments: this.segments,
    };
  }

  /**
   * Linear interpolation helper
   */
  private lerp(a: number, b: number, t: number): number {
    return a + (b - a) * t;
  }

  /**
   * Apply Gaussian smoothing to eliminate jagged edges
   * Uses 3×3 kernel with weighted averaging
   */
  private smoothHeightmap(heightmap: Float32Array): void {
    const temp = new Float32Array(heightmap.length);
    
    // Apply Gaussian blur kernel to interior vertices only
    for (let row = 1; row < this.segments; row++) {
      for (let col = 1; col < this.segments; col++) {
        const idx = row * (this.segments + 1) + col;
        
        // Get 9 heights (center + 8 neighbors)
        const c = heightmap[idx]; // center
        const n = heightmap[(row-1) * (this.segments+1) + col]; // north
        const s = heightmap[(row+1) * (this.segments+1) + col]; // south
        const e = heightmap[row * (this.segments+1) + (col+1)]; // east
        const w = heightmap[row * (this.segments+1) + (col-1)]; // west
        const ne = heightmap[(row-1) * (this.segments+1) + (col+1)]; // northeast
        const nw = heightmap[(row-1) * (this.segments+1) + (col-1)]; // northwest
        const se = heightmap[(row+1) * (this.segments+1) + (col+1)]; // southeast
        const sw = heightmap[(row+1) * (this.segments+1) + (col-1)]; // southwest
        
        // Apply Gaussian kernel weights
        // [1 2 1]   [0.0625 0.125 0.0625]
        // [2 4 2] = [0.125  0.25  0.125 ]
        // [1 2 1]   [0.0625 0.125 0.0625]
        temp[idx] = c * 0.25 + 
                    (n + s + e + w) * 0.125 +
                    (ne + nw + se + sw) * 0.0625;
      }
    }
    
    // Copy smoothed values back (skip edges to preserve boundary)
    for (let row = 1; row < this.segments; row++) {
      for (let col = 1; col < this.segments; col++) {
        const idx = row * (this.segments + 1) + col;
        heightmap[idx] = temp[idx];
      }
    }
  }

  /**
   * Apply edge falloff to prevent cliff-like boundaries
   * Gradually reduces height toward map edges for natural horizon
   */
  private applyEdgeFalloff(heightmap: Float32Array): void {
    const halfSize = this.size / 2;
    const falloffStart = 0.6; // Start falloff at 60% from center
    const falloffRange = 1.0 - falloffStart;
    
    for (let row = 0; row <= this.segments; row++) {
      for (let col = 0; col <= this.segments; col++) {
        const x = (col / this.segments) * this.size - halfSize;
        const z = (row / this.segments) * this.size - halfSize;
        
        // Use max distance (square boundary, not circular)
        const normalizedX = Math.abs(x) / halfSize;
        const normalizedZ = Math.abs(z) / halfSize;
        const distFromCenter = Math.max(normalizedX, normalizedZ);
        
        if (distFromCenter > falloffStart) {
          // Calculate squared falloff for smooth, gradual transition
          const progress = (distFromCenter - falloffStart) / falloffRange;
          const falloff = 1.0 - (progress * progress); // Squared for smoothness
          
          const idx = row * (this.segments + 1) + col;
          heightmap[idx] *= falloff;
        }
      }
    }
  }

  /**
   * Limit slopes to prevent spikes and ensure drivable terrain
   * Caps maximum slope angle at 35 degrees
   */
  private limitSlopes(heightmap: Float32Array): void {
    const maxSlopeDegrees = 35;
    const maxSlopeRadians = (maxSlopeDegrees * Math.PI) / 180;
    const cellSize = this.size / this.segments;
    const maxHeightDiff = Math.tan(maxSlopeRadians) * cellSize;
    
    // Multiple passes for better convergence
    for (let pass = 0; pass < 2; pass++) {
      for (let row = 1; row < this.segments; row++) {
        for (let col = 1; col < this.segments; col++) {
          const idx = row * (this.segments + 1) + col;
          const height = heightmap[idx];
          
          // Check 4 cardinal neighbors
          const neighbors = [
            heightmap[(row-1) * (this.segments+1) + col],    // north
            heightmap[(row+1) * (this.segments+1) + col],    // south
            heightmap[row * (this.segments+1) + (col-1)],    // west
            heightmap[row * (this.segments+1) + (col+1)],    // east
          ];
          
          // For each neighbor, calculate max allowed height for this vertex
          let clampedHeight = height;
          for (const neighborHeight of neighbors) {
            const diff = height - neighborHeight;
            if (Math.abs(diff) > maxHeightDiff) {
              // Clamp to create exactly max allowed slope
              const sign = diff > 0 ? 1 : -1;
              const maxAllowedHeight = neighborHeight + sign * maxHeightDiff;
              // Take the more restrictive clamp
              if (diff > 0) {
                clampedHeight = Math.min(clampedHeight, maxAllowedHeight);
              } else {
                clampedHeight = Math.max(clampedHeight, maxAllowedHeight);
              }
            }
          }
          
          heightmap[idx] = clampedHeight;
        }
      }
    }
  }

  /**
   * Log validation information about generated terrain
   */
  private logValidationInfo(heightmap: Float32Array): void {
    // Calculate maximum slope
    let maxSlope = 0;
    const cellSize = this.size / this.segments;
    
    for (let row = 0; row < this.segments; row++) {
      for (let col = 0; col < this.segments; col++) {
        const idx = row * (this.segments + 1) + col;
        const height = heightmap[idx];
        
        // Check right and down neighbors
        if (col < this.segments) {
          const rightIdx = row * (this.segments + 1) + (col + 1);
          const heightDiff = Math.abs(height - heightmap[rightIdx]);
          const slope = Math.atan(heightDiff / cellSize) * (180 / Math.PI);
          maxSlope = Math.max(maxSlope, slope);
        }
        
        if (row < this.segments) {
          const downIdx = (row + 1) * (this.segments + 1) + col;
          const heightDiff = Math.abs(height - heightmap[downIdx]);
          const slope = Math.atan(heightDiff / cellSize) * (180 / Math.PI);
          maxSlope = Math.max(maxSlope, slope);
        }
      }
    }
    
    console.log(`  ✓ Max slope angle: ${maxSlope.toFixed(1)}° (target: <35°)`);
  }

  /**
   * Get interpolated height at any world position
   * Uses bilinear interpolation between grid vertices
   * @param x - World X coordinate
   * @param z - World Z coordinate  
   * @param heightmap - The heightmap array
   * @returns Interpolated height
   */
  static getHeightAt(
    x: number,
    z: number,
    heightmap: Float32Array,
    size: number = POC_TERRAIN_SIZE,
    segments: number = POC_TERRAIN_SEGMENTS
  ): number {
    const halfSize = size / 2;
    const cellSize = size / segments;

    // Convert world coordinates to grid coordinates
    const gridX = (x + halfSize) / cellSize;
    const gridZ = (z + halfSize) / cellSize;

    // Get grid cell indices
    const col = Math.floor(gridX);
    const row = Math.floor(gridZ);

    // Boundary check
    if (col < 0 || col >= segments || row < 0 || row >= segments) {
      return 0; // Outside terrain bounds
    }

    // Get fractional position within cell
    const tx = gridX - col;
    const tz = gridZ - row;

    // Get four corner heights
    const h00 = heightmap[row * (segments + 1) + col];
    const h10 = heightmap[row * (segments + 1) + (col + 1)];
    const h01 = heightmap[(row + 1) * (segments + 1) + col];
    const h11 = heightmap[(row + 1) * (segments + 1) + (col + 1)];

    // Bilinear interpolation
    const h0 = h00 * (1 - tx) + h10 * tx; // Top edge
    const h1 = h01 * (1 - tx) + h11 * tx; // Bottom edge
    const height = h0 * (1 - tz) + h1 * tz; // Final interpolated height

    return height;
  }
}

