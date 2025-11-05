import * as THREE from "three";

/**
 * Options for configuring raycast visualization
 */
export interface RaycastDebugOptions {
  /** Color of the ray arrows (default: red) */
  color?: number;
  /** Length of arrow head (default: 0.5) */
  headLength?: number;
  /** Width of arrow head (default: 0.3) */
  headWidth?: number;
  /** Show labels on rays (default: false) */
  showLabels?: boolean;
}

/**
 * Visualizes raycasts for debugging terrain following.
 * Completely isolated from production code - only instantiated when debugging is enabled.
 */
export class RaycastDebugger {
  private scene: THREE.Scene;
  private arrows: THREE.ArrowHelper[] = [];
  private options: Required<RaycastDebugOptions>;

  // Reusable objects for calculations
  private tempDirection: THREE.Vector3 = new THREE.Vector3();

  constructor(scene: THREE.Scene, options?: RaycastDebugOptions) {
    this.scene = scene;
    this.options = {
      color: 0xff0000,
      headLength: 0.5,
      headWidth: 0.3,
      showLabels: false,
      ...options,
    };
  }

  /**
   * Add a new ray visualization to the scene.
   * @returns Index of the created arrow for future updates
   */
  addRayVisualization(): number {
    const arrow = new THREE.ArrowHelper(
      new THREE.Vector3(0, -1, 0), // direction: straight down
      new THREE.Vector3(0, 0, 0), // origin: will be updated
      1, // length: will be updated
      this.options.color,
      this.options.headLength,
      this.options.headWidth
    );

    this.scene.add(arrow);
    this.arrows.push(arrow);

    return this.arrows.length - 1;
  }

  /**
   * Create multiple ray visualizations at once.
   * @param count - Number of rays to create
   * @returns Array of arrow indices
   */
  addRayVisualizations(count: number): number[] {
    const indices: number[] = [];
    for (let i = 0; i < count; i++) {
      indices.push(this.addRayVisualization());
    }
    return indices;
  }

  /**
   * Update an existing ray visualization.
   * @param index - Index of the arrow to update
   * @param start - Ray start position (world space)
   * @param end - Ray end position (world space)
   * @param hit - Whether the ray hit something (affects color)
   */
  updateRayVisualization(
    index: number,
    start: THREE.Vector3,
    end: THREE.Vector3,
    hit: boolean = true
  ): void {
    const arrow = this.arrows[index];
    if (!arrow) {
      console.warn(`RaycastDebugger: Arrow at index ${index} not found`);
      return;
    }

    // Update arrow position
    arrow.position.copy(start);

    // Calculate direction and length (reuse tempDirection)
    this.tempDirection.subVectors(end, start);
    const length = this.tempDirection.length();
    this.tempDirection.normalize();

    // Update arrow appearance
    arrow.setDirection(this.tempDirection);
    arrow.setLength(length, this.options.headLength, this.options.headWidth);

    // Change color based on hit status (red = hit, yellow = miss)
    const color = hit ? this.options.color : 0xffff00;
    arrow.setColor(color);
  }

  /**
   * Update multiple ray visualizations at once.
   * @param rays - Array of ray data {index, start, end, hit}
   */
  updateRayVisualizations(
    rays: Array<{
      index: number;
      start: THREE.Vector3;
      end: THREE.Vector3;
      hit?: boolean;
    }>
  ): void {
    for (const ray of rays) {
      this.updateRayVisualization(
        ray.index,
        ray.start,
        ray.end,
        ray.hit ?? true
      );
    }
  }

  /**
   * Remove a specific ray visualization.
   * @param index - Index of the arrow to remove
   */
  removeRayVisualization(index: number): void {
    const arrow = this.arrows[index];
    if (!arrow) return;

    this.scene.remove(arrow);
    arrow.dispose();
    this.arrows[index] = null as any;
  }

  /**
   * Clear all ray visualizations from the scene.
   */
  clear(): void {
    for (const arrow of this.arrows) {
      if (arrow) {
        this.scene.remove(arrow);
        arrow.dispose();
      }
    }
    this.arrows = [];
  }

  /**
   * Get the number of active ray visualizations.
   * @returns Count of arrows
   */
  getVisualizationCount(): number {
    return this.arrows.filter((a) => a !== null).length;
  }

  /**
   * Update visualization color.
   * @param color - New color (hex)
   */
  setColor(color: number): void {
    this.options.color = color;
    for (const arrow of this.arrows) {
      if (arrow) {
        arrow.setColor(color);
      }
    }
  }

  /**
   * Toggle visibility of all visualizations.
   * @param visible - Whether visualizations should be visible
   */
  setVisible(visible: boolean): void {
    for (const arrow of this.arrows) {
      if (arrow) {
        arrow.visible = visible;
      }
    }
  }

  /**
   * Clean up all resources.
   */
  dispose(): void {
    this.clear();
  }
}
