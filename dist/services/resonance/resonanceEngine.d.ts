import * as THREE from 'three';
import { ResonanceField, ResonancePoint, ResonanceGesture, ResonanceEvent, ValueSignal, ResonantInterface } from '../../interfaces/resonantInterface';
export declare class ResonanceEngine implements ResonantInterface {
    private static instance;
    private activeFields;
    private demandTracker;
    private opportunityMatcher;
    private constructor();
    static getInstance(): ResonanceEngine;
    createField(center: THREE.Vector3, radius: number): ResonanceField;
    addPoint(field: ResonanceField, point: ResonancePoint): void;
    removePoint(field: ResonanceField, point: ResonancePoint): void;
    initiateGesture(gesture: ResonanceGesture): void;
    completeGesture(gesture: ResonanceGesture): void;
    processEvent(event: ResonanceEvent): Promise<void>;
    emitValueSignal(signal: ValueSignal): void;
    detectValuePatterns(field: ResonanceField): ValueSignal[];
    amplifyValueSignal(signal: ValueSignal): Promise<number>;
    transformValueToAction(signal: ValueSignal): Promise<void>;
    private recalculateHarmonics;
    private calculateProbability;
    private estimateTimeToValue;
    private estimateValue;
    private determineRequirements;
    private generateActionPath;
    private pulseCheck;
    render(): void;
    update(deltaTime: number): void;
}
