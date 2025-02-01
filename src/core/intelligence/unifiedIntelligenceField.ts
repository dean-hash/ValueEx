import { EventEmitter } from 'events';

export interface ResonanceEvent {
  metric: string;
  value: number;
  timestamp: number;
}

export class UnifiedIntelligenceField extends EventEmitter {
  private static instance: UnifiedIntelligenceField;

  private constructor() {
    super();
  }

  public static getInstance(): UnifiedIntelligenceField {
    if (!UnifiedIntelligenceField.instance) {
      UnifiedIntelligenceField.instance = new UnifiedIntelligenceField();
    }
    return UnifiedIntelligenceField.instance;
  }

  public getDomainResonance(_domain: string): number {
    // Basic implementation for MVP - will be enhanced later
    return Math.random() * 100;
  }

  public emitResonanceChange(anomalies: Array<{ metric: string; value: number }>): void {
    this.emit('resonance-change', anomalies);
  }
}
