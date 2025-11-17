import * as THREE from 'three';

/**
 * Manages car color customization by targeting the 'yellow' material
 * used for the car body in the E36 model.
 */
export class CarColorManager {
  /**
   * Apply color to car body by targeting the 'yellow' material
   * @param model - The car model group
   * @param hexColor - Hex color string (e.g., '#FF0000')
   */
  static applyColor(model: THREE.Group, hexColor: string): void {
    const color = new THREE.Color(hexColor);
    
    model.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        const material = child.material as THREE.MeshStandardMaterial;
        if (material && material.name === 'yellow') {
          material.color.copy(color);
        }
      }
    });
  }
}



