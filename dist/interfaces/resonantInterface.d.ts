import * as THREE from 'three';
export interface ResonancePoint {
    position: THREE.Vector3;
    intensity: number;
    frequency: number;
    phase: number;
}
export interface ResonanceField {
    points: ResonancePoint[];
    center: THREE.Vector3;
    radius: number;
    harmonics: number[];
}
export interface ResonanceGesture {
    type: 'wave' | 'spiral' | 'pulse' | 'flow';
    origin: THREE.Vector3;
    direction: THREE.Vector3;
    amplitude: number;
    frequency: number;
    duration: number;
    harmonics?: number[];
}
export interface ValueSignal {
    type: 'opportunity' | 'demand' | 'connection' | 'transformation';
    strength: number;
    resonancePattern: ResonanceField;
    probability: number;
    timeToValue: number;
    estimatedValue: number;
    requirements: string[];
    actionPath: string[];
}
export interface ResonanceEvent {
    type: 'initiation' | 'amplification' | 'harmonization' | 'dissolution' | 'valueEmergence';
    source: ResonancePoint;
    target?: ResonancePoint;
    intensity: number;
    timestamp: number;
    valueSignal?: ValueSignal;
    effects: {
        visual?: THREE.Object3D;
        audio?: AudioNode;
        data?: any;
    };
}
export interface ResonantInterface {
    createField(center: THREE.Vector3, radius: number): ResonanceField;
    addPoint(field: ResonanceField, point: ResonancePoint): void;
    removePoint(field: ResonanceField, point: ResonancePoint): void;
    initiateGesture(gesture: ResonanceGesture): void;
    completeGesture(gesture: ResonanceGesture): void;
    processEvent(event: ResonanceEvent): void;
    emitValueSignal(signal: ValueSignal): void;
    harmonize(field: ResonanceField): void;
    amplify(point: ResonancePoint, factor: number): void;
    dissolve(field: ResonanceField): void;
    detectValuePatterns(field: ResonanceField): ValueSignal[];
    amplifyValueSignal(signal: ValueSignal): Promise<number>;
    transformValueToAction(signal: ValueSignal): Promise<void>;
    render(): void;
    update(deltaTime: number): void;
}
