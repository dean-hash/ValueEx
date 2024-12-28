import { DemandPattern } from '../types/demandTypes';

export type TestScenario = {
  name: string;
  description: string;
  input: {
    demandPattern: DemandPattern;
    threshold?: number;
  };
  expected: {
    resonanceScore: number;
    matches: boolean;
  };
};

export const testScenarios: TestScenario[] = [
  {
    name: 'High Resonance Pattern',
    description: 'Tests a pattern with strong demand signals and clear market fit',
    input: {
      demandPattern: {
        strength: 0.9,
        confidence: 0.85,
        source: 'market_analysis',
        status: 'active',
        signals: [
          {
            source: 'reddit',
            strength: 0.9,
            confidence: 0.85,
            status: 'active',
            content: 'Strong demand signal',
            timestamp: new Date().toISOString(),
          }
        ],
        timestamp: new Date().toISOString(),
      },
      threshold: 0.8
    },
    expected: {
      resonanceScore: 0.875,
      matches: true
    }
  }
];
