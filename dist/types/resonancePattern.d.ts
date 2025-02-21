import { Vector3 } from 'three';
export interface ResonancePoint {
    position: Vector3;
    intensity: number;
    frequency: number;
    phase: number;
}
export interface ResonancePattern {
    sourceId: string;
    amplitude: number;
    timestamp: Date;
    coherence: number;
    affectedNodes: {
        nodeId: string;
        resonanceStrength: number;
        harmonicFactor: number;
    }[];
}
export interface ValuePattern extends ResonancePattern {
    strength: number;
    confidence: number;
    type: 'direct' | 'emergent' | 'catalytic';
    manifestation: {
        potential: number;
        timeframe: string;
        requirements: string[];
    };
}
export interface ResonancePatternType {
    patternId: string;
    originNode: string;
    frequency: number;
    affectedNodes: Array<{
        nodeId: string;
        resonanceStrength: number;
        harmonicFactor: number;
    }>;
    coherence: number;
}
