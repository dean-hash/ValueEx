import { DemandSignal } from '../analysis/adapters/demandSignalAdapter';

export interface Match {
  id: string;
  name: string;
  quality: number;
  features?: string[];
  opportunities?: string[];
  recommendations?: string[];
}

export class MatchingEngine {
  async findMatches(signal: DemandSignal): Promise<Match[]> {
    // For now, return mock matches for testing
    return [
      {
        id: 'match_1',
        name: 'Example Match 1',
        quality: 0.8,
        features: ['feature1', 'feature2'],
        opportunities: ['Potential cost savings', 'Improved efficiency'],
        recommendations: ['Review detailed specifications', 'Schedule demo'],
      },
      {
        id: 'match_2',
        name: 'Example Match 2',
        quality: 0.6,
        features: ['feature2', 'feature3'],
        opportunities: ['Market expansion', 'New capabilities'],
        recommendations: ['Compare pricing', 'Evaluate integration requirements'],
      },
    ];
  }
}
