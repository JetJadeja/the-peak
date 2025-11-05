import * as THREE from "three";
import { RaycastResult, RaycastOptions, RaycastTarget } from "./types";

/**
 * Reusable raycasting utility for terrain queries.
 * Manages object pooling to avoid garbage collection pressure.
 */
export class TerrainRaycaster {
  private raycaster: THREE.Raycaster;
  private rayOrigin: THREE.Vector3;
  private rayDirection: THREE.Vector3;
  private defaultStartHeight: number;

  // Object pool to reduce GC pressure
  private tempVector: THREE.Vector3;
  private resultPoint: THREE.Vector3;

  constructor(startHeight: number = 50) {
    this.raycaster = new THREE.Raycaster();
    this.rayOrigin = new THREE.Vector3();
    this.rayDirection = new THREE.Vector3(0, -1, 0);
    this.defaultStartHeight = startHeight;

    // Pre-allocate reusable objects
    this.tempVector = new THREE.Vector3();
    this.resultPoint = new THREE.Vector3();
  }

  /**
   * Cast a ray downward from a point and find the first intersection.
   * @param x - World X coordinate
   * @param z - World Z coordinate
   * @param target - Object to raycast against
   * @param options - Optional raycast configuration
   * @returns RaycastResult with hit information
   */
  castRayDown(
    x: number,
    z: number,
    target: RaycastTarget,
    options?: RaycastOptions
  ): RaycastResult {
    const startHeight = options?.startHeight ?? this.defaultStartHeight;
    const direction = options?.direction ?? this.rayDirection;

    // Set ray origin high above the point
    this.rayOrigin.set(x, startHeight, z);

    // Configure and cast the ray
    this.raycaster.set(this.rayOrigin, direction);
    
    // Always set far distance to avoid state contamination from previous calls
    this.raycaster.far = options?.maxDistance ?? Infinity;

    const intersects = this.raycaster.intersectObject(
      target.getRaycastMesh(),
      true
    );

    if (intersects.length > 0) {
      const firstHit = intersects[0];
      // Reuse resultPoint instead of cloning
      this.resultPoint.copy(firstHit.point);
      return {
        hit: true,
        point: this.resultPoint,
        distance: firstHit.distance,
        object: firstHit.object,
      };
    }

    // No hit - return miss result (reuse resultPoint)
    this.resultPoint.set(x, 0, z);
    return {
      hit: false,
      point: this.resultPoint,
      distance: -1,
    };
  }

  /**
   * Get the ground height at a specific XZ position.
   * @param x - World X coordinate
   * @param z - World Z coordinate
   * @param target - Object to raycast against
   * @param options - Optional raycast configuration
   * @returns Ground height (Y coordinate) or 0 if no hit
   */
  getGroundHeightAtPoint(
    x: number,
    z: number,
    target: RaycastTarget,
    options?: RaycastOptions
  ): number {
    const result = this.castRayDown(x, z, target, options);
    return result.hit ? result.point.y : 0;
  }

  /**
   * Get ground heights at multiple points efficiently.
   * @param points - Array of {x, z} coordinates
   * @param target - Object to raycast against
   * @param options - Optional raycast configuration
   * @returns Array of RaycastResult objects
   */
  castRaysAtPoints(
    points: Array<{ x: number; z: number }>,
    target: RaycastTarget,
    options?: RaycastOptions
  ): RaycastResult[] {
    return points.map((point) =>
      this.castRayDown(point.x, point.z, target, options)
    );
  }

  /**
   * Get ground heights at multiple points, returning only the Y values.
   * @param points - Array of {x, z} coordinates
   * @param target - Object to raycast against
   * @param options - Optional raycast configuration
   * @returns Array of height values
   */
  getGroundHeightsAtPoints(
    points: Array<{ x: number; z: number }>,
    target: RaycastTarget,
    options?: RaycastOptions
  ): number[] {
    return points.map((point) =>
      this.getGroundHeightAtPoint(point.x, point.z, target, options)
    );
  }

  /**
   * Cast a ray from a THREE.Object3D's position.
   * @param object - The object to cast from
   * @param target - Object to raycast against
   * @param options - Optional raycast configuration
   * @returns RaycastResult with hit information
   */
  castRayFromObject(
    object: THREE.Object3D,
    target: RaycastTarget,
    options?: RaycastOptions
  ): RaycastResult {
    // Get world position (reuse tempVector)
    object.getWorldPosition(this.tempVector);

    return this.castRayDown(
      this.tempVector.x,
      this.tempVector.z,
      target,
      options
    );
  }

  /**
   * Update the default start height for raycasts.
   * @param height - New default start height
   */
  setDefaultStartHeight(height: number): void {
    this.defaultStartHeight = height;
  }

  /**
   * Get the current default start height.
   * @returns Current default start height
   */
  getDefaultStartHeight(): number {
    return this.defaultStartHeight;
  }
}
