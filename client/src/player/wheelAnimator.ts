import * as THREE from "three";
import {
  WHEEL_ROTATION_ORDER,
  STEERING_VISUAL_MULTIPLIER,
} from "../config/gameConstants";

/**
 * Manages wheel animation including rotation (spinning) and steering (turning).
 * Uses TEMP's proven approach: finds Circle018/Circle015 containers and collects
 * ALL mesh children (tire + rim + brake disc) to rotate together.
 */
export class WheelAnimator {
  private frontLeftMeshes: THREE.Mesh[] = [];
  private frontRightMeshes: THREE.Mesh[] = [];
  private rearLeftMeshes: THREE.Mesh[] = [];
  private rearRightMeshes: THREE.Mesh[] = [];

  private wheelRotation: number = 0;
  private steeringAngle: number = 0;

  /**
   * Initialize by finding Circle018 and Circle015 containers and collecting all mesh children.
   * This is TEMP's proven approach that ensures tire + rim + all components rotate together.
   * @param carModel - The car model group to search
   * @returns True if initialization successful
   */
  initialize(carModel: THREE.Group): boolean {
    // Reset arrays
    this.frontLeftMeshes = [];
    this.frontRightMeshes = [];
    this.rearLeftMeshes = [];
    this.rearRightMeshes = [];

    // Find wheel containers and collect mesh children (TEMP's approach)
    carModel.traverse((child) => {
      if (child.name === "Circle018") {
        // Front wheels container - has 4 meshes (2 left, 2 right)
        child.children.forEach((c) => {
          if (c instanceof THREE.Mesh) {
            // Normalize name for matching (Three.js converts "front-left-rim" to "frontleftrim")
            const lowerName = c.name.toLowerCase().replace(/[-_]/g, "");
            if (lowerName.includes("left")) {
              this.frontLeftMeshes.push(c);
            } else if (lowerName.includes("right")) {
              this.frontRightMeshes.push(c);
            }
          }
        });
      } else if (child.name === "Circle015") {
        // Rear wheels container - has 2 meshes (shared between both sides)
        child.children.forEach((c) => {
          if (c instanceof THREE.Mesh) {
            this.rearLeftMeshes.push(c);
            this.rearRightMeshes.push(c); // Shared meshes
          }
        });
      }
    });

    // Check if initialization was successful
    const initialized =
      this.frontLeftMeshes.length > 0 && this.frontRightMeshes.length > 0;

    if (initialized) {
      console.log("WheelAnimator: Initialized with meshes");
      console.log("✓ Front Left:", this.frontLeftMeshes.length, "meshes");
      console.log("✓ Front Right:", this.frontRightMeshes.length, "meshes");
      console.log("✓ Rear Left:", this.rearLeftMeshes.length, "meshes");
      console.log("✓ Rear Right:", this.rearRightMeshes.length, "meshes");
    } else {
      console.warn(
        "WheelAnimator: Failed to find wheel meshes in Circle018/Circle015"
      );
    }

    return initialized;
  }

  /**
   * Update wheel rotation based on speed and wheel radius
   * @param speed - Current speed (positive = forward, negative = backward)
   * @param wheelRadius - Radius of the wheel
   */
  updateRotation(speed: number, wheelRadius: number): void {
    // Convert linear speed to angular rotation
    // Negate to get correct rotation direction
    this.wheelRotation -= speed / wheelRadius;
  }

  /**
   * Set steering angle directly (for remote players receiving network data)
   * @param angle - Steering angle in radians
   */
  setSteeringAngle(angle: number): void {
    this.steeringAngle = angle;
  }

  /**
   * Get current steering angle (for networking)
   * @returns Current steering angle in radians
   */
  getSteeringAngle(): number {
    return this.steeringAngle;
  }

  /**
   * Apply rotations to ALL wheel meshes (tire + rim + all components).
   * Must be called every frame to animate wheels.
   * Uses TEMP's exact rotation logic.
   */
  animate(): void {
    // Calculate visual steering angle (negated and reduced by 50%)
    const wheelSteeringAngle = -this.steeringAngle * STEERING_VISUAL_MULTIPLIER;

    // Front left: steering + rolling
    this.frontLeftMeshes.forEach((mesh) => {
      mesh.rotation.order = WHEEL_ROTATION_ORDER;
      mesh.rotation.z = wheelSteeringAngle;
      mesh.rotation.y = this.wheelRotation;
      mesh.rotation.x = 0;
    });

    // Front right: steering + rolling
    this.frontRightMeshes.forEach((mesh) => {
      mesh.rotation.order = WHEEL_ROTATION_ORDER;
      mesh.rotation.z = wheelSteeringAngle;
      mesh.rotation.y = this.wheelRotation;
      mesh.rotation.x = 0;
    });

    // Rear left: rolling only (no steering)
    this.rearLeftMeshes.forEach((mesh) => {
      mesh.rotation.order = WHEEL_ROTATION_ORDER;
      mesh.rotation.z = 0;
      mesh.rotation.y = this.wheelRotation;
      mesh.rotation.x = 0;
    });

    // Rear right: rolling only (no steering)
    this.rearRightMeshes.forEach((mesh) => {
      mesh.rotation.order = WHEEL_ROTATION_ORDER;
      mesh.rotation.z = 0;
      mesh.rotation.y = this.wheelRotation;
      mesh.rotation.x = 0;
    });
  }

  /**
   * Check if wheel animator is properly initialized
   * @returns True if front wheels were detected
   */
  isInitialized(): boolean {
    return this.frontLeftMeshes.length > 0 && this.frontRightMeshes.length > 0;
  }
}
