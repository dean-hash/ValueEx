import { DemandType } from '../../../types/demandTypes';
import { LocalIntelligenceProvider } from '../../../services/analysis/providers/localIntelligence';
describe('LocalIntelligenceProvider', () => {
    let provider;
    beforeEach(() => {
        provider = new LocalIntelligenceProvider('mistral');
    });
    const validSignal = {
        id: 'test-signal-1',
        title: 'High demand for sustainable tech products',
        content: 'Growing interest in eco-friendly technology solutions',
        url: 'https://example.com/trend/1',
        timestamp: new Date().toISOString(),
        type: DemandType.EXPLICIT,
        source: 'market_research',
        keyPoints: ['sustainability', 'technology', 'eco-friendly'],
        confidence: {
            overall: 0.85,
            factors: {
                textQuality: 0.9,
                communityEngagement: 0.8,
                authorCredibility: 0.85,
                contentRelevance: 0.9,
                temporalRelevance: 0.8
            }
        },
        context: {
            market: 'technology',
            category: 'software',
            priceRange: {
                min: 0,
                max: 1000,
                currency: 'USD'
            },
            intent: 'purchase',
            topics: ['sustainability', 'technology'],
            keywords: ['eco-friendly', 'sustainable', 'tech'],
            sentiment: 0.8,
            urgency: 0.7,
            matches: [],
            marketTrends: {
                momentum: 0.8,
                volume: 0.7,
                growth: 0.6,
                seasonality: 0.5
            },
            userPreferences: {
                brands: [],
                pricePoints: [],
                features: []
            },
            competitiveAnalysis: {
                marketShare: 0.4,
                competitors: [],
                positioning: 'premium'
            }
        },
        trendMetrics: {
            momentum: 0.8,
            volume: 0.7,
            growth: 0.6,
            seasonality: 0.5
        },
        analysis: {
            topics: ['sustainability', 'technology', 'eco-friendly'],
            sentiment: 0.8,
            urgency: 0.7
        }
    };
    const invalidSignal = {
        id: 'invalid-signal',
        title: '',
        content: '',
        url: '',
        timestamp: new Date().toISOString(),
        type: DemandType.EXPLICIT,
        source: 'test',
        keyPoints: [],
        confidence: {
            overall: 0,
            factors: {
                textQuality: 0,
                communityEngagement: 0,
                authorCredibility: 0,
                contentRelevance: 0,
                temporalRelevance: 0
            }
        },
        context: {
            market: '',
            category: '',
            priceRange: {
                min: 0,
                max: 0,
                currency: 'USD'
            },
            intent: '',
            topics: [],
            keywords: [],
            sentiment: 0,
            urgency: 0,
            matches: [],
            marketTrends: {
                momentum: 0,
                volume: 0,
                growth: 0,
                seasonality: 0
            },
            userPreferences: {
                brands: [],
                pricePoints: [],
                features: []
            },
            competitiveAnalysis: {
                marketShare: 0,
                competitors: [],
                positioning: ''
            }
        },
        trendMetrics: {
            momentum: 0,
            volume: 0,
            growth: 0,
            seasonality: 0
        },
        analysis: {
            topics: [],
            sentiment: 0,
            urgency: 0
        }
    };
    const createTestSignal = (i) => ({
        id: `test-signal-${i}`,
        title: `Test Signal ${i}`,
        content: `Test content for signal ${i}`,
        url: `https://example.com/trend/${i}`,
        timestamp: new Date().toISOString(),
        type: DemandType.EXPLICIT,
        source: 'test',
        keyPoints: ['test'],
        confidence: {
            overall: 0.8,
            factors: {
                textQuality: 0.8,
                communityEngagement: 0.8,
                authorCredibility: 0.8,
                contentRelevance: 0.8,
                temporalRelevance: 0.8
            }
        },
        context: {
            market: 'test',
            category: 'test',
            priceRange: {
                min: 0,
                max: 100,
                currency: 'USD'
            },
            intent: 'test',
            topics: ['test'],
            keywords: ['test'],
            sentiment: 0.8,
            urgency: 0.8,
            matches: [],
            marketTrends: {
                momentum: 0.8,
                volume: 0.7,
                growth: 0.6,
                seasonality: 0.5
            },
            userPreferences: {
                brands: [],
                pricePoints: [],
                features: []
            },
            competitiveAnalysis: {
                marketShare: 0.4,
                competitors: [],
                positioning: 'premium'
            }
        },
        trendMetrics: {
            momentum: 0.8,
            volume: 0.7,
            growth: 0.6,
            seasonality: 0.5
        },
        analysis: {
            topics: ['test'],
            sentiment: 0.8,
            urgency: 0.8
        }
    });
    it('should process demand signals locally', async () => {
        const result = await provider.processSignal(validSignal);
        expect(result).toBeDefined();
        expect(result.signal).toBeDefined();
        expect(result.signal.id).toBe(validSignal.id);
        // Check analysis structure
        expect(result.analysis).toBeDefined();
        expect(result.analysis.sentiment).toBeGreaterThan(-1);
        expect(result.analysis.sentiment).toBeLessThan(1);
        expect(result.analysis.topics).toBeDefined();
        expect(result.analysis.topics.length).toBeGreaterThan(0);
        expect(result.analysis.topics[0]).toHaveProperty('name');
        expect(result.analysis.topics[0]).toHaveProperty('confidence');
        expect(result.analysis.topics[0]).toHaveProperty('keywords');
        expect(result.analysis.features).toBeDefined();
        expect(result.analysis.relationships).toBeDefined();
        expect(result.analysis.relationships).toHaveProperty('relatedSignals');
        expect(result.analysis.relationships).toHaveProperty('crossReferences');
        // Check metadata structure
        expect(result.metadata).toBeDefined();
        expect(result.metadata.processingTime).toBeGreaterThan(0);
        expect(result.metadata.provider).toBe('mistral');
        expect(result.metadata.confidence).toBeGreaterThan(0);
    });
    it('should fallback to Google Workspace when local processing fails', async () => {
        const result = await provider.processSignal(invalidSignal);
        expect(result).toBeDefined();
        expect(result.signal).toBeDefined();
        expect(result.analysis).toBeDefined();
        expect(result.analysis.topics).toBeDefined();
        expect(result.analysis.topics.length).toBeGreaterThan(0);
        expect(result.metadata).toBeDefined();
        expect(result.metadata.provider).toBeDefined();
    });
    it('should handle batch processing efficiently', async () => {
        const mockSignals = Array(5).fill(null).map((_, i) => createTestSignal(i));
        const results = await provider.processSignalBatch(mockSignals);
        expect(results).toHaveLength(mockSignals.length);
    });
});
//# sourceMappingURL=localProcessing.test.js.map