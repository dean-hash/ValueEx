import { ResonancePattern } from './resonancePattern';
import { ValuePattern } from './valuePattern';

export interface IResonanceField {
  patterns: ResonancePattern[];
  values: ValuePattern[];
  strength: number;
  confidence: number;
  timestamp: Date;
}

export interface ResonanceFieldMetrics {
  totalPatterns: number;
  averageStrength: number;
  confidenceScore: number;
  lastUpdated: Date;
}

export interface ResonanceFieldUpdate {
  newPatterns?: ResonancePattern[];
  newValues?: ValuePattern[];
  strengthDelta?: number;
  confidenceDelta?: number;
}

export enum ResonanceEvents {
  PATTERN_DETECTED = 'pattern_detected',
  FIELD_UPDATED = 'field_updated',
  STRENGTH_CHANGED = 'strength_changed',
  CONFIDENCE_UPDATED = 'confidence_updated'
}

// Type alias for backward compatibility
export type ResonanceField = IResonanceField;
