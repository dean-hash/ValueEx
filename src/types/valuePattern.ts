import { ResonancePattern } from './resonancePattern';

export interface ValuePattern {
  type: 'opportunity' | 'trend' | 'synergy' | 'arbitrage';
  resonancePattern: ResonancePattern;
  strength: number;
  probability: number;
  timeToValue: number;
  estimatedValue: number;
  confidence: number;
  requirements: string[];
  dependencies: string[];
  risks: Array<{
    type: string;
    probability: number;
    impact: number;
  }>;
  metadata: {
    discoveredAt: Date;
    lastUpdated: Date;
    source: string;
    validUntil?: Date;
  };
}
