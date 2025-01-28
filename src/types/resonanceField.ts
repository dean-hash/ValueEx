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

export interface ResonanceField {
  id: string;
  strength: number;
  direction: 'positive' | 'negative' | 'neutral';
  confidence: number;
  impact: number;
  source: string;
  timestamp: number;
  metadata?: Record<string, unknown>;
}

export interface ResonanceMetrics {
  harmony: number;
  impact: number;
  sustainability: number;
  innovation: number;
  localRelevance: number;
}

export enum ResonanceEvents {
  PATTERN_DETECTED = 'pattern_detected',
  FIELD_UPDATED = 'field_updated',
  STRENGTH_CHANGED = 'strength_changed',
  CONFIDENCE_UPDATED = 'confidence_updated',
}

export interface ResonanceUpdate {
  fieldId: string;
  strengthDelta?: number;
  confidenceDelta?: number;
  metadata?: Record<string, unknown>;
}

// Type alias for backward compatibility
export type ResonanceField = IResonanceField;
