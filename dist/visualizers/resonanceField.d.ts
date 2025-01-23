import * as THREE from 'three';
export declare class ResonanceField {
    private scene;
    private points;
    constructor();
    private initializeField;
    addResonancePoint(position: THREE.Vector3, intensity: number): void;
    private updateField;
}
