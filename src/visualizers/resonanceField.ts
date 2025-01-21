import * as THREE from 'three';
import { logger } from '../utils/logger';

interface ResonancePoint {
  position: THREE.Vector3;
  intensity: number;
  connections: THREE.Vector3[];
}

export class ResonanceField {
  private scene: THREE.Scene;
  private points: ResonancePoint[] = [];

  constructor() {
    this.scene = new THREE.Scene();
    this.initializeField();
  }

  private initializeField(): void {
    try {
      const geometry = new THREE.BufferGeometry();
      const material = new THREE.PointsMaterial({ size: 0.1, color: 0xffffff });
      const points = new THREE.Points(geometry, material);
      this.scene.add(points);
    } catch (error) {
      logger.error('Error initializing resonance field:', error);
      throw error;
    }
  }

  addResonancePoint(position: THREE.Vector3, intensity: number): void {
    try {
      this.points.push({
        position,
        intensity,
        connections: [],
      });
      this.updateField();
    } catch (error) {
      logger.error('Error adding resonance point:', error);
      throw error;
    }
  }

  private updateField(): void {
    try {
      const positions = new Float32Array(this.points.length * 3);
      this.points.forEach((point, index) => {
        positions[index * 3] = point.position.x;
        positions[index * 3 + 1] = point.position.y;
        positions[index * 3 + 2] = point.position.z;
      });

      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

      const material = new THREE.PointsMaterial({
        size: 0.1,
        color: 0xffffff,
        transparent: true,
        opacity: 0.8,
      });

      const points = new THREE.Points(geometry, material);
      this.scene.clear();
      this.scene.add(points);
    } catch (error) {
      logger.error('Error updating resonance field:', error);
      throw error;
    }
  }
}
