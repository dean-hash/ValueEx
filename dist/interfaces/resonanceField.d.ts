import { ResonanceMetrics, ResonanceState } from '../types/resonanceTypes';
import { Observable } from 'rxjs';
import { ResonancePattern } from '../types/resonancePattern';
export interface IResonanceField {
  initialize(): Promise<void>;
  getCurrentState(): {
    patterns: any[];
    metrics: Record<string, any>;
  };
  analyzeCode?(content: string): Promise<number>;
  monitorQAMetrics?(metric: string, value: number): void | Promise<void>;
  observePatterns?(): Observable<ResonancePattern>;
  calculateResonance?(supply: ResonanceState, demand: ResonanceState): ResonanceMetrics;
}
export declare enum ResonanceEvents {
  PATTERN_DETECTED = 'pattern',
  STATE_CHANGED = 'stateChanged',
  METRIC_UPDATED = 'metricUpdated',
}
