import { ResonanceMetrics, ResonanceState } from '../types/resonanceTypes';
import { Observable } from 'rxjs';
import { ResonancePattern } from '../types/resonancePattern';

export interface IResonanceField {
  // Core functionality
  initialize(): Promise<void>;

  // State management
  getCurrentState(): { patterns: any[]; metrics: Record<string, any> };

  // Analysis methods
  analyzeCode?(content: string): Promise<number>;
  monitorQAMetrics?(metric: string, value: number): void | Promise<void>;

  // Pattern recognition
  observePatterns?(): Observable<ResonancePattern>;

  // Resonance calculations
  calculateResonance?(supply: ResonanceState, demand: ResonanceState): ResonanceMetrics;
}

// Event names for EventEmitter-based implementations
export enum ResonanceEvents {
  PATTERN_DETECTED = 'pattern',
  STATE_CHANGED = 'stateChanged',
  METRIC_UPDATED = 'metricUpdated',
}
