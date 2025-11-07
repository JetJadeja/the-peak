import * as THREE from "three";
import { InputHandler } from "./input";
import { WheelAnimator } from "./wheelAnimator";
import { AssetLoader, CarColorManager } from "../utils";
import { TerrainPhysics } from "../track/terrainPhysics";
import { TerrainRaycaster, WheelSystem, TerrainFollower } from "../physics";
import {
  CAR_MODEL_PATH,
  CAR_SPEED,
  CAR_TURN_SPEED,
  CAR_DECELERATION,
  CAR_MIN_SPEED_THRESHOLD,
  CAR_INITIAL_POSITION,
  WHEEL_RADIUS,
  RAYCAST_START_HEIGHT,
  DEBUG_SHOW_RAYCASTS,
  TERRAIN_FOLLOW_ENABLE_ROTATION,
  TERRAIN_FOLLOW_ROTATION_SMOOTHING,
  TERRAIN_FOLLOW_HEIGHT_SMOOTHING,
  MAX_PITCH_ANGLE,
  MAX_ROLL_ANGLE,
  DEFAULT_CAR_COLOR,
  MAX_STEERING_ANGLE,
  STEERING_SPEED,
  STEERING_RETURN_SPEED,
} from "../config/gameConstants";

export class PlayerCar {
  private model: THREE.Group | null = null;
  private inputHandler: InputHandler;
  private scene: THREE.Scene | null = null;
  private currentSpeed: number = 0;
  private isReady: boolean = false;
  private color: string = DEFAULT_CAR_COLOR;
  private steeringAngle: number = 0;

  // Reusable vectors to avoid garbage collection
  private forwardDirection: THREE.Vector3 = new THREE.Vector3();
  private tempVector: THREE.Vector3 = new THREE.Vector3();

  // Physics systems
  private wheelSystem: WheelSystem;
  private terrainFollower: TerrainFollower;
  private wheelAnimator: WheelAnimator;

  constructor(
    inputHandler: InputHandler,
    terrainPhysics: TerrainPhysics,
    scene?: THREE.Scene
  ) {
    this.inputHandler = inputHandler;
    this.scene = scene || null;

    // Initialize physics systems
    const raycaster = new TerrainRaycaster(RAYCAST_START_HEIGHT);
    this.wheelSystem = new WheelSystem();
    this.terrainFollower = new TerrainFollower(terrainPhysics, raycaster, {
      enableRotation: TERRAIN_FOLLOW_ENABLE_ROTATION,
      rotationSmoothing: TERRAIN_FOLLOW_ROTATION_SMOOTHING,
      heightSmoothing: TERRAIN_FOLLOW_HEIGHT_SMOOTHING,
      heightOffset: 0,
      maxPitchAngle: MAX_PITCH_ANGLE,
      maxRollAngle: MAX_ROLL_ANGLE,
    });
    
    // Initialize wheel animator
    this.wheelAnimator = new WheelAnimator();
  }

  async load(): Promise<THREE.Group> {
    try {
      const assetLoader = AssetLoader.getInstance();
      const gltf = await assetLoader.loadGLTF(CAR_MODEL_PATH);

      this.model = gltf.scene;
      this.model.position.set(
        CAR_INITIAL_POSITION.x,
        CAR_INITIAL_POSITION.y,
        CAR_INITIAL_POSITION.z
      );
      this.model.rotation.y = 0;

      // Enable shadow casting for all meshes in the car model
      this.model.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });

      // Detect wheels using the wheel system
      const wheelsDetected = this.wheelSystem.detectWheels(
        this.model,
        WHEEL_RADIUS
      );

      if (!wheelsDetected) {
        console.warn(
          "PlayerCar: Failed to detect wheels, using fallback positioning"
        );
      }
      
      // Initialize wheel animator independently (TEMP's approach)
      const animatorReady = this.wheelAnimator.initialize(this.model);
      if (!animatorReady) {
        console.warn('PlayerCar: WheelAnimator failed to initialize');
      }

      // Enable debug visualization if configured
      if (DEBUG_SHOW_RAYCASTS && this.scene && wheelsDetected) {
        this.terrainFollower.enableDebugVisualization(
          this.scene,
          this.wheelSystem.getWheelCount()
        );
      }

      this.isReady = true;

      return this.model;
    } catch (error) {
      console.error("Failed to load car model:", error);
      throw new Error(
        "Car model loading failed. Please check the model path and try again."
      );
    }
  }

  update(deltaTime: number): void {
    if (!this.isReady || !this.model) return;

    const input = this.inputHandler.getMovementInput();

    // Update current speed based on forward input
    if (input.forward !== 0) {
      this.currentSpeed = input.forward * CAR_SPEED;
    } else {
      // Slow down when no input
      this.currentSpeed *= CAR_DECELERATION;
    }

    // Update steering angle (visual wheel turning)
    if (input.turn !== 0) {
      // Invert turn direction for correct steering
      const direction = -input.turn;
      this.steeringAngle += direction * STEERING_SPEED;
      // Clamp to max steering angle
      this.steeringAngle = Math.max(
        -MAX_STEERING_ANGLE,
        Math.min(MAX_STEERING_ANGLE, this.steeringAngle)
      );
    } else {
      // Return steering to center when no input
      if (Math.abs(this.steeringAngle) > 0.001) {
        const returnAmount = Math.sign(this.steeringAngle) * STEERING_RETURN_SPEED;
        if (Math.abs(this.steeringAngle) < STEERING_RETURN_SPEED) {
          this.steeringAngle = 0;
        } else {
          this.steeringAngle -= returnAmount;
        }
      }
    }

    // Rotation (steering) - only turn when moving
    if (Math.abs(this.currentSpeed) > CAR_MIN_SPEED_THRESHOLD) {
      this.model.rotation.y += input.turn * CAR_TURN_SPEED * deltaTime;
    }

    // Forward/backward movement based on car's rotation
    if (Math.abs(this.currentSpeed) > CAR_MIN_SPEED_THRESHOLD) {
      // Reuse vector instead of creating new one
      this.forwardDirection.set(-1, 0, 0);
      this.forwardDirection.applyQuaternion(this.model.quaternion);
      this.forwardDirection.multiplyScalar(this.currentSpeed * deltaTime);

      this.model.position.add(this.forwardDirection);
    }

    // Update wheel animation
    if (this.wheelAnimator.isInitialized()) {
      this.wheelAnimator.updateRotation(this.currentSpeed, WHEEL_RADIUS);
      this.wheelAnimator.setSteeringAngle(this.steeringAngle);
      this.wheelAnimator.animate();
    }

    // Follow terrain using the terrain follower system
    if (this.wheelSystem.isInitialized()) {
      this.terrainFollower.update(this.model, this.wheelSystem);
    } else {
      // Fallback: simple terrain following without wheels
      this.terrainFollower.updateSimple(this.model, 0.5);
    }
  }

  getModel(): THREE.Group | null {
    return this.model;
  }

  getPosition(): THREE.Vector3 {
    if (!this.model) return new THREE.Vector3();
    // Reuse temp vector to avoid creating new Vector3
    return this.tempVector.copy(this.model.position);
  }

  getQuaternion(): THREE.Quaternion {
    return this.model?.quaternion.clone() || new THREE.Quaternion();
  }

  getRotation(): { x: number; y: number; z: number } {
    if (!this.model) return { x: 0, y: 0, z: 0 };
    return {
      x: this.model.rotation.x,
      y: this.model.rotation.y,
      z: this.model.rotation.z,
    };
  }

  getVelocity(): { x: number; y: number; z: number } {
    // Calculate velocity based on current speed and direction
    if (!this.model || Math.abs(this.currentSpeed) < CAR_MIN_SPEED_THRESHOLD) {
      return { x: 0, y: 0, z: 0 };
    }

    this.forwardDirection.set(-1, 0, 0);
    this.forwardDirection.applyQuaternion(this.model.quaternion);
    this.forwardDirection.multiplyScalar(this.currentSpeed);

    return {
      x: this.forwardDirection.x,
      y: this.forwardDirection.y,
      z: this.forwardDirection.z,
    };
  }

  isModelReady(): boolean {
    return this.isReady;
  }

  setColor(hexColor: string): void {
    this.color = hexColor;
    if (this.model) {
      CarColorManager.applyColor(this.model, hexColor);
    }
  }

  getSteeringAngle(): number {
    return this.steeringAngle;
  }

  dispose(): void {
    // Clean up terrain follower (includes debug visualization)
    this.terrainFollower.dispose();

    // Reset wheel system
    this.wheelSystem.reset();

    if (this.model) {
      this.model.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.geometry.dispose();

          if (Array.isArray(child.material)) {
            child.material.forEach((material) => material.dispose());
          } else {
            child.material.dispose();
          }
        }
      });
      this.model = null;
    }
    this.isReady = false;
  }
}
