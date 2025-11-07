import * as THREE from 'three';

/**
 * Represents a sampled point along the road path
 */
export interface RoadSample {
  position: THREE.Vector3;
  distance: number; // Cumulative distance along path
  tangent: THREE.Vector3; // Direction at this point
}

/**
 * RoadPath manages the spline curve that defines the road's route through terrain.
 * It provides methods for sampling positions along the road and calculating distances.
 */
export class RoadPath {
  private curve: THREE.CatmullRomCurve3;
  private samples: RoadSample[];
  private totalLength: number;

  /**
   * Create a road path from control points
   * @param controlPoints - Array of 3D points defining the road's route
   * @param sampleCount - Number of pre-computed samples for fast distance queries (default 1000)
   */
  constructor(controlPoints: THREE.Vector3[], sampleCount: number = 1000) {
    // Create smooth spline through control points
    // closed = false: start-to-finish rally stage (not a loop)
    // tension = 0.5: natural curves without overshooting
    this.curve = new THREE.CatmullRomCurve3(controlPoints, false, 'catmullrom', 0.5);
    
    this.totalLength = this.curve.getLength();
    this.samples = [];

    // Pre-compute high-resolution samples for fast lookups during terrain generation
    this.precomputeSamples(sampleCount);
  }

  /**
   * Pre-compute road samples at regular intervals along the curve
   */
  private precomputeSamples(count: number): void {
    for (let i = 0; i <= count; i++) {
      const t = i / count; // Normalized position [0, 1]
      const position = this.curve.getPoint(t);
      const tangent = this.curve.getTangent(t);
      const distance = t * this.totalLength;

      this.samples.push({
        position: position.clone(),
        distance,
        tangent: tangent.clone(),
      });
    }
  }

  /**
   * Get position on road at normalized distance (0 = start, 1 = end)
   * @param t - Normalized position along road [0, 1]
   * @returns Position vector
   */
  getPointAt(t: number): THREE.Vector3 {
    return this.curve.getPoint(t);
  }

  /**
   * Get tangent (direction) at normalized position
   * @param t - Normalized position along road [0, 1]
   * @returns Tangent vector (normalized)
   */
  getTangentAt(t: number): THREE.Vector3 {
    return this.curve.getTangent(t);
  }

  /**
   * Find the closest point on the road to a given world position
   * Uses pre-computed samples for performance
   * @param x - World X coordinate
   * @param z - World Z coordinate
   * @returns Object with closest point, distance to road, and road elevation
   */
  findClosestPoint(x: number, z: number): {
    closestPoint: THREE.Vector3;
    distance: number;
    roadElevation: number;
  } {
    let minDistance = Infinity;
    let closestSample: RoadSample | null = null;

    // Find closest sample point
    // Note: We only check XZ distance (ignore Y) since we want perpendicular distance to road
    const queryPoint = new THREE.Vector2(x, z);

    for (const sample of this.samples) {
      const samplePoint = new THREE.Vector2(sample.position.x, sample.position.z);
      const dist = queryPoint.distanceTo(samplePoint);

      if (dist < minDistance) {
        minDistance = dist;
        closestSample = sample;
      }
    }

    if (!closestSample) {
      // Fallback (should never happen)
      return {
        closestPoint: new THREE.Vector3(0, 0, 0),
        distance: Infinity,
        roadElevation: 0,
      };
    }

    return {
      closestPoint: closestSample.position.clone(),
      distance: minDistance,
      roadElevation: closestSample.position.y,
    };
  }

  /**
   * Get all pre-computed road samples
   * Useful for visualization and debugging
   */
  getSamples(): RoadSample[] {
    return this.samples;
  }

  /**
   * Get the underlying curve object
   * Useful for advanced operations or visualization
   */
  getCurve(): THREE.CatmullRomCurve3 {
    return this.curve;
  }

  /**
   * Get total length of the road path
   */
  getLength(): number {
    return this.totalLength;
  }

  /**
   * Create visualization helper for debugging
   * Returns a line mesh showing the road path
   * @param color - Line color (default: yellow)
   * @returns Line mesh for adding to scene
   */
  createVisualization(color: number = 0xffff00): THREE.Line {
    // Get many points along curve for smooth visualization
    const points = this.curve.getPoints(200);
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const material = new THREE.LineBasicMaterial({ color });
    return new THREE.Line(geometry, material);
  }

  /**
   * Create control point markers for debugging
   * Returns an array of sphere meshes at each control point
   * @param color - Sphere color (default: red)
   * @param radius - Sphere radius (default: 0.5)
   * @returns Array of mesh spheres
   */
  createControlPointMarkers(color: number = 0xff0000, radius: number = 0.5): THREE.Mesh[] {
    const markers: THREE.Mesh[] = [];
    const geometry = new THREE.SphereGeometry(radius, 16, 16);
    const material = new THREE.MeshBasicMaterial({ color });

    // Get control points from curve
    const controlPoints = (this.curve as any).points; // Access internal points array

    for (const point of controlPoints) {
      const marker = new THREE.Mesh(geometry.clone(), material.clone());
      marker.position.copy(point);
      markers.push(marker);
    }

    return markers;
  }
}

/**
 * Factory function to create the default POC road path
 * This defines a full-map rally stage that flows from bottom-left to top-right
 * @returns RoadPath instance with POC control points
 */
export function createPOCRoadPath(): RoadPath {
  // Define control points for a diagonal rally stage across the entire map
  // Route: Bottom-left corner → Top-right corner
  // Total length: ~900-1000 units, elevation gain: ~7.5 units
  // 4 distinct sections: Entry → Valley Floor → Technical → Summit
  
  const controlPoints = [
    // === Section 1: The Entry (flowing S-curves) ===
    new THREE.Vector3(-42, 0.0, -42),    // Start - bottom-left corner
    new THREE.Vector3(-35, 0.5, -20),    // Early left sweep
    new THREE.Vector3(-40, 1.0, 0),      // Gentle right curve
    new THREE.Vector3(-30, 1.5, 15),     // Flow into center
    
    // === Section 2: Valley Floor (fast sweepers) ===
    new THREE.Vector3(-15, 2.0, 25),     // Fast left sweep
    new THREE.Vector3(0, 2.5, 30),       // Center point - fastest section
    new THREE.Vector3(15, 3.0, 28),      // Right sweep
    
    // === Section 3: Technical Section (tight corners, climbing) ===
    new THREE.Vector3(25, 3.5, 20),      // Start climbing, right
    new THREE.Vector3(30, 4.5, 5),       // Hairpin left - key corner
    new THREE.Vector3(25, 5.0, -5),      // Tight right
    new THREE.Vector3(20, 5.5, 5),       // Recovery left
    new THREE.Vector3(25, 6.0, 15),      // Exit technical section
    
    // === Section 4: Summit Run (fast finale) ===
    new THREE.Vector3(35, 6.5, 25),      // Fast right sweep
    new THREE.Vector3(40, 7.0, 35),      // Final left curve
    new THREE.Vector3(42, 7.5, 42),      // Finish - top-right corner overlook
  ];

  // Create road path with high sample density (1000 samples)
  // High density ensures accurate distance queries during terrain generation
  return new RoadPath(controlPoints, 1000);
}

