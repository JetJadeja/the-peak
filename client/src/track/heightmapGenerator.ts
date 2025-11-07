import { createNoise2D, NoiseFunction2D } from 'simplex-noise';
import alea from 'alea';
import { RoadPath } from './roadPath';
import {
  POC_TERRAIN_SIZE,
  POC_TERRAIN_SEGMENTS,
  POC_TERRAIN_SEED,
  ROLLING_HILLS_NOISE_SCALE,
  ROLLING_HILLS_OCTAVES,
  ROLLING_HILLS_HEIGHT,
  ROLLING_HILLS_BASE_ELEVATION,
  SMOOTHING_PASSES,
  ROAD_SMOOTHING_RADIUS,
  ROAD_SMOOTHING_STRENGTH,
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
   * NEW APPROACH: Smooth rolling hills with road following terrain
   * @returns Object containing heightmap data and metadata
   */
  generate(): { heightmap: Float32Array; metadata: HeightmapMetadata } {
    const vertexCount = (this.segments + 1) * (this.segments + 1);
    const heightmap = new Float32Array(vertexCount);

    console.log('  → Step 1: Generating smooth rolling hills...');
    // Step 1: Generate rolling hills using continuous Simplex noise
    this.generateRollingHills(heightmap);

    console.log('  → Step 2: Applying multiple smoothing passes...');
    // Step 2: Apply heavy smoothing for butter-smooth terrain
    this.applyMultipleSmoothing(heightmap);

    console.log('  → Step 3: Applying edge falloff...');
    // Step 3: Apply edge falloff to hide boundaries
    this.applyEdgeFalloff(heightmap);

    console.log('  → Step 4: Smoothing road surface...');
    // Step 4: Gentle road smoothing (NOT flattening - road follows hills)
    this.applyRoadSmoothing(heightmap);

    console.log('  → Step 5: Calculating metadata...');
    // Step 5: Calculate metadata
    const metadata = this.calculateMetadata(heightmap);

    // Log validation info
    this.logValidationInfo(heightmap);

    return { heightmap, metadata };
  }

  /**
   * Generate smooth rolling hills using continuous Simplex noise
   * No discrete zones - pure organic undulation
   */
  private generateRollingHills(heightmap: Float32Array): void {
    const halfSize = this.size / 2;

    for (let row = 0; row <= this.segments; row++) {
      for (let col = 0; col <= this.segments; col++) {
        const index = row * (this.segments + 1) + col;

        // Convert grid coordinates to world coordinates (centered at origin)
        const x = (col / this.segments) * this.size - halfSize;
        const z = (row / this.segments) * this.size - halfSize;

        // Sample Simplex noise at very low frequency for large, smooth features
        let height = 0;
        let amplitude = 1.0;

        for (let octave = 0; octave < ROLLING_HILLS_OCTAVES; octave++) {
          const frequency = Math.pow(2, octave);
          const sampleX = x * ROLLING_HILLS_NOISE_SCALE * frequency;
          const sampleZ = z * ROLLING_HILLS_NOISE_SCALE * frequency;
          
          const noiseValue = this.noise2D(sampleX, sampleZ);
          height += noiseValue * amplitude;
          
          amplitude *= 0.5; // Each octave contributes half as much
        }

        // Scale by height range and add base elevation
        // Result: terrain ranges from 2 to 5 units in height
        height = (height * ROLLING_HILLS_HEIGHT) + ROLLING_HILLS_BASE_ELEVATION;

        heightmap[index] = height;
      }
    }
  }

  /**
   * Apply a single pass of Gaussian smoothing
   * Uses 3×3 kernel with weighted averaging
   */
  private applySmoothingPass(heightmap: Float32Array): void {
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
   * Apply multiple smoothing passes for ultra-smooth terrain
   */
  private applyMultipleSmoothing(heightmap: Float32Array): void {
    for (let pass = 0; pass < SMOOTHING_PASSES; pass++) {
      this.applySmoothingPass(heightmap);
    }
  }

  /**
   * Apply gentle road smoothing (NOT flattening)
   * Road follows terrain but with gentle averaging for comfortable driving
   */
  private applyRoadSmoothing(heightmap: Float32Array): void {
    const halfSize = this.size / 2;
    const temp = new Float32Array(heightmap.length);
    
    // Copy original heights
    for (let i = 0; i < heightmap.length; i++) {
      temp[i] = heightmap[i];
    }

    for (let row = 0; row <= this.segments; row++) {
      for (let col = 0; col <= this.segments; col++) {
        const index = row * (this.segments + 1) + col;

        // Convert to world coordinates
        const x = (col / this.segments) * this.size - halfSize;
        const z = (row / this.segments) * this.size - halfSize;

        // Find distance to road
        const { distance } = this.roadPath.findClosestPoint(x, z);

        // Only smooth within road smoothing radius
        if (distance < ROAD_SMOOTHING_RADIUS) {
          const originalHeight = temp[index];
          
          // Get average of nearby vertices for gentle smoothing
          let avgHeight = 0;
          let count = 0;
          
          // Sample 3x3 neighborhood
          for (let dr = -1; dr <= 1; dr++) {
            for (let dc = -1; dc <= 1; dc++) {
              const nr = row + dr;
              const nc = col + dc;
              
              if (nr >= 0 && nr <= this.segments && nc >= 0 && nc <= this.segments) {
                const nidx = nr * (this.segments + 1) + nc;
                avgHeight += temp[nidx];
                count++;
              }
            }
          }
          
          avgHeight /= count;
          
          // Blend between original and smoothed based on distance and strength
          const normalizedDistance = distance / ROAD_SMOOTHING_RADIUS;
          const smoothFactor = (1.0 - normalizedDistance) * ROAD_SMOOTHING_STRENGTH;
          
          heightmap[index] = this.lerp(originalHeight, avgHeight, smoothFactor);
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

  // Old valley-based terrain methods removed - replaced with smooth rolling hills approach

  /**
   * Apply edge falloff to prevent cliff-like boundaries
   * Gradually reduces height toward map edges for natural horizon
   */
  private applyEdgeFalloff(heightmap: Float32Array): void {
    const halfSize = this.size / 2;
    const falloffStart = 0.7; // Start falloff at 70% from center (was 0.6)
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
          // Calculate cubic falloff for extra smooth transition
          const progress = (distFromCenter - falloffStart) / falloffRange;
          const falloff = 1.0 - (progress * progress * progress); // Cubic for smoother
          
          const idx = row * (this.segments + 1) + col;
          heightmap[idx] *= falloff;
        }
      }
    }
  }

  // Old texture noise and slope limiting methods removed - no longer needed with smooth hills

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

