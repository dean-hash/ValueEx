"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createMockValueResponse = exports.createMockDemandSignal = void 0;
const createMockDemandSignal = (overrides = {}) => ({
    source: 'test-source',
    timestamp: new Date(),
    signal: {
        type: 'direct',
        confidence: 0.9,
        value: 'test-value',
        metadata: {},
    },
    context: {
        market: 'test-market',
        category: 'test-category',
        urgency: 5,
    },
    ...overrides,
});
exports.createMockDemandSignal = createMockDemandSignal;
const createMockValueResponse = (overrides = {}) => ({
    demandSignal: (0, exports.createMockDemandSignal)(),
    response: {
        type: 'product',
        description: 'test-description',
        confidence: 0.8,
        implementation: ['step1', 'step2'],
    },
    metrics: {
        relevance: 0.9,
        feasibility: 0.8,
        marketPotential: 0.7,
    },
    ...overrides,
});
exports.createMockValueResponse = createMockValueResponse;
//# sourceMappingURL=testUtils.js.map