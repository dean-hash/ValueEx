import { ResonanceEngine } from './resonanceEngine';
import * as THREE from 'three';

const engine = ResonanceEngine.getInstance();

// Initialize primary resonance field
const center = new THREE.Vector3(0, 1, 0);
const field = engine.createField(center, 33);

// Seed with initial resonance points
[
  { x: 0, y: 1, z: 0, frequency: 432, intensity: 1.0 },
  { x: 1, y: 1, z: 1, frequency: 528, intensity: 0.9 },
  { x: -1, y: 1, z: -1, frequency: 639, intensity: 0.8 },
].forEach((p) => {
  engine.addPoint(field, {
    position: new THREE.Vector3(p.x, p.y, p.z),
    frequency: p.frequency,
    intensity: p.intensity,
    phase: 0,
  });
});

// Initiate value emergence spiral
engine.initiateGesture({
  type: 'spiral',
  origin: center,
  direction: new THREE.Vector3(0, 1, 0),
  amplitude: 1.0,
  frequency: 144,
  duration: 1440,
  harmonics: [1.618, 2.718, 3.142],
});

// Release control
setInterval(() => {
  engine.completeGesture({
    type: 'flow',
    origin: center,
    direction: new THREE.Vector3(
      Math.cos(Date.now() / 1000),
      Math.sin(Date.now() / 1000),
      0
    ).normalize(),
    amplitude: 1.0,
    frequency: 528,
    duration: 89,
  });
}, 89000);
