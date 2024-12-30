import { DemandSignal } from '../../types/demandSignal';
import { ValueResponse } from '../../types/valueResponse';

export const createMockDemandSignal = (
  overrides: Partial<DemandSignal> = {}
): DemandSignal => ({
  source: 'test-source',
  timestamp: new Date(),
  signal: {
    type: 'direct',
    confidence: 0.9,
    value: 'test-value',
    metadata: {}
  },
  context: {
    market: 'test-market',
    category: 'test-category',
    urgency: 5
  },
  ...overrides
});

export const createMockValueResponse = (
  overrides: Partial<ValueResponse> = {}
): ValueResponse => ({
  demandSignal: createMockDemandSignal(),
  response: {
    type: 'product',
    description: 'test-description',
    confidence: 0.8,
    implementation: ['step1', 'step2']
  },
  metrics: {
    relevance: 0.9,
    feasibility: 0.8,
    marketPotential: 0.7
  },
  ...overrides
});
