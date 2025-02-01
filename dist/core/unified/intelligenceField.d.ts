import { EventEmitter } from 'events';
import { Observable } from 'rxjs';
import { ResonancePattern } from '../../types/resonancePattern';
import { IResonanceField } from '../../types/resonanceField';
export declare class FieldNode {
  readonly id: string;
  readonly position: [number, number, number];
  value: number;
  readonly connections: Set<string>;
  constructor(id: string, position: [number, number, number], value: number);
}
export declare class IntelligenceField {
  private nodes;
  private resonanceSubject;
  private readonly φ;
  private anomalyThreshold;
  private qaMetrics;
  private patternHistory;
  constructor();
  addNode(id: string, position: [number, number, number], initialValue?: number): void;
  connectNodes(sourceId: string, targetId: string): void;
  emitResonanceWave(nodeId: string, amplitude: number): void;
  private calculateResonanceImpact;
  private calculateDistance;
  getResonanceObservable(): Observable<ResonancePattern>;
  private initialize;
  private calculateResonance;
  private calculateHarmonic;
  private calculateFrequency;
  private calculateCoherence;
  private amplifyResonance;
  monitorQAMetrics(metric: string, value: number): Promise<void>;
  private analyzePatterns;
  private detectAnomalies;
  predictIssue(data: any): Promise<{
    type: any;
    confidence: any;
    timeframe: any;
  }>;
  private analyzePatternTrend;
  private calculateTrend;
}
export declare class UnifiedIntelligenceField extends EventEmitter {
  private intelligenceField;
  constructor();
  private initializeUnified;
  observeResonancePatterns(): Observable<ResonancePattern>;
  addNodeToUnifiedField(
    id: string,
    position: [number, number, number],
    initialValue?: number
  ): void;
  connectNodesInUnifiedField(sourceId: string, targetId: string): void;
  emitResonanceWaveInUnifiedField(nodeId: string, amplitude: number): void;
}
export declare class UnifiedResonanceField extends EventEmitter implements IResonanceField {
  private static instance;
  private intelligenceField;
  private constructor();
  static getInstance(): UnifiedResonanceField;
  initialize(): Promise<void>;
  private setupPatternRecognition;
  analyzeCode(content: string): Promise<number>;
  monitorQAMetrics(metric: string, value: number): Promise<void>;
  getCurrentState(): {
    patterns: any[];
    metrics: {};
  };
  observePatterns(): Observable<ResonancePattern>;
}
export declare const unifiedResonanceField: UnifiedResonanceField;
