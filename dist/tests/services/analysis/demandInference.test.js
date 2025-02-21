import { DemandInference } from '../../../services/analysis/providers/demandInference';
describe('DemandInference', () => {
    let demandInference;
    beforeEach(() => {
        demandInference = new DemandInference();
    });
    describe('Initialization', () => {
        test('should initialize with correct properties', () => {
            expect(demandInference['confidenceThreshold']).toBeDefined();
            expect(demandInference['minKeywords']).toBeDefined();
            expect(demandInference['tokenizer']).toBeDefined();
            expect(demandInference['tfidf']).toBeDefined();
            expect(demandInference['classifier']).toBeDefined();
        });
    });
    describe('Behavior Analysis', () => {
        const mockBehavior = {
            searches: ['best price laptop', 'gaming laptop deals', 'laptop comparison'],
            viewedItems: ['gaming-laptop-1', 'budget-laptop-2'],
            interactions: [
                {
                    type: 'view',
                    item: 'gaming-laptop-1',
                    duration: 120000,
                    timestamp: Date.now(),
                },
                {
                    type: 'compare',
                    item: 'budget-laptop-2',
                    duration: 60000,
                    timestamp: Date.now() - 1000,
                },
            ],
            context: {
                location: 'US',
                device: 'desktop',
                timeOfDay: 'evening',
            },
        };
        test('should infer from search patterns', async () => {
            const signals = await demandInference.inferFromBehavior(mockBehavior);
            expect(signals).toBeDefined();
            expect(Array.isArray(signals)).toBe(true);
            expect(signals.length).toBeGreaterThan(0);
            const searchSignal = signals.find((s) => s.source === 'demand_inference');
            expect(searchSignal).toBeDefined();
            expect(searchSignal.confidence).toBeGreaterThan(0);
            expect(searchSignal.context.keywords.length).toBeGreaterThan(0);
        });
        test('should analyze viewing patterns', async () => {
            const signals = await demandInference.inferFromBehavior({
                ...mockBehavior,
                searches: [],
            });
            const viewSignal = signals.find((s) => s.context.keywords.some((k) => mockBehavior.viewedItems.some((item) => item.includes(k))));
            expect(viewSignal).toBeDefined();
        });
        test('should analyze interactions', async () => {
            const signals = await demandInference.inferFromBehavior({
                ...mockBehavior,
                searches: [],
                viewedItems: [],
            });
            const interactionSignal = signals.find((s) => s.context.urgency > 0 || s.context.sentiment !== 0);
            expect(interactionSignal).toBeDefined();
        });
    });
    describe('TF-IDF Analysis', () => {
        test('should calculate TF-IDF scores correctly', () => {
            const docs = ['laptop gaming price', 'gaming performance', 'laptop price budget'];
            docs.forEach((doc) => demandInference['tfidf'].addDocument(doc.split(' ')));
            const score1 = demandInference['calculateTfIdfScore']('laptop');
            const score2 = demandInference['calculateTfIdfScore']('gaming');
            const score3 = demandInference['calculateTfIdfScore']('nonexistent');
            expect(score1).toBeGreaterThan(0);
            expect(score2).toBeGreaterThan(0);
            expect(score3).toBe(0);
        });
        test('should extract relevant keywords', () => {
            const texts = [
                'high performance gaming laptop',
                'best price for gaming laptop',
                'laptop comparison review',
            ];
            const keywords = demandInference['extractRelevantKeywords'](texts);
            expect(keywords).toBeDefined();
            expect(keywords.length).toBeGreaterThan(0);
            expect(keywords).toContain('gaming');
            expect(keywords).toContain('laptop');
        });
    });
    describe('Signal Consolidation', () => {
        const mockSignals = [
            {
                id: 'test-signal-1',
                title: 'Test Signal',
                content: 'Looking for high-performance gaming laptop',
                url: 'https://example.com/test',
                timestamp: new Date().toISOString(),
                type: 'explicit',
                source: 'test',
                keyPoints: ['gaming', 'laptop', 'performance'],
                confidence: {
                    overall: 0.85,
                    factors: {
                        textQuality: 0.9,
                        communityEngagement: 0.8,
                        authorCredibility: 0.85,
                        contentRelevance: 0.9,
                        temporalRelevance: 0.8,
                    },
                },
                context: {
                    market: 'electronics',
                    category: 'laptops',
                    priceRange: {
                        min: 1000,
                        max: 2500,
                        currency: 'USD',
                    },
                    intent: 'purchase',
                    topics: ['gaming', 'technology'],
                    keywords: ['laptop', 'performance', 'gaming'],
                    sentiment: 0.8,
                    urgency: 0.7,
                    matches: [],
                    marketTrends: {
                        momentum: 0.8,
                        volume: 0.7,
                        growth: 0.85,
                        seasonality: 0.6,
                    },
                    userPreferences: {
                        brands: ['Asus', 'MSI', 'Razer'],
                        pricePoints: ['premium', 'high-end'],
                        features: ['RTX GPU', '32GB RAM', 'SSD'],
                    },
                    competitiveAnalysis: {
                        marketShare: 0.25,
                        competitors: ['Dell', 'HP', 'Lenovo'],
                        positioning: 'premium',
                    },
                },
                trendMetrics: {
                    momentum: 0.8,
                    volume: 0.7,
                    growth: 0.85,
                    seasonality: 0.6,
                },
                analysis: {
                    topics: ['gaming', 'technology'],
                    sentiment: 0.8,
                    urgency: 0.7,
                },
            },
            {
                id: 'test-signal-2',
                title: 'Test Signal 2',
                content: 'Looking for budget gaming laptop',
                url: 'https://example.com/test2',
                timestamp: new Date().toISOString(),
                type: 'explicit',
                source: 'test',
                keyPoints: ['gaming', 'laptop', 'budget'],
                confidence: {
                    overall: 0.8,
                    factors: {
                        textQuality: 0.85,
                        communityEngagement: 0.7,
                        authorCredibility: 0.8,
                        contentRelevance: 0.85,
                        temporalRelevance: 0.7,
                    },
                },
                context: {
                    market: 'electronics',
                    category: 'laptops',
                    priceRange: {
                        min: 500,
                        max: 1500,
                        currency: 'USD',
                    },
                    intent: 'purchase',
                    topics: ['gaming', 'technology'],
                    keywords: ['laptop', 'gaming', 'budget'],
                    sentiment: 0.7,
                    urgency: 0.6,
                    matches: [],
                    marketTrends: {
                        momentum: 0.7,
                        volume: 0.6,
                        growth: 0.8,
                        seasonality: 0.5,
                    },
                    userPreferences: {
                        brands: ['Acer', 'Lenovo', 'HP'],
                        pricePoints: ['budget', 'mid-range'],
                        features: ['Intel Core i5', '8GB RAM', 'HDD'],
                    },
                    competitiveAnalysis: {
                        marketShare: 0.3,
                        competitors: ['Dell', 'Asus', 'MSI'],
                        positioning: 'budget',
                    },
                },
                trendMetrics: {
                    momentum: 0.7,
                    volume: 0.6,
                    growth: 0.8,
                    seasonality: 0.5,
                },
                analysis: {
                    topics: ['gaming', 'technology'],
                    sentiment: 0.7,
                    urgency: 0.6,
                },
            },
        ];
        test('should consolidate similar signals', async () => {
            const consolidated = await demandInference.consolidateSignals(mockSignals);
            expect(consolidated).toBeDefined();
            expect(consolidated.length).toBeLessThan(mockSignals.length);
            const signal = consolidated[0];
            expect(signal.confidence).toBeDefined();
            expect(signal.context.keywords).toContain('laptop');
            expect(signal.context.sentiment).toBeDefined();
            expect(signal.context.urgency).toBeDefined();
        });
        test('should handle empty signal array', async () => {
            await expect(demandInference.consolidateSignals([])).resolves.toEqual([]);
        });
        test('should preserve unique signals', async () => {
            const uniqueSignals = [
                {
                    ...mockSignals[0],
                    source: 'source1',
                },
                {
                    ...mockSignals[1],
                    source: 'source2',
                },
            ];
            const consolidated = await demandInference.consolidateSignals(uniqueSignals);
            expect(consolidated.length).toBe(uniqueSignals.length);
        });
    });
    describe('Error Handling', () => {
        test('should handle invalid behavior data', async () => {
            const invalidBehavior = {
                searches: [],
                viewedItems: [],
                interactions: [],
            };
            const signals = await demandInference.inferFromBehavior(invalidBehavior);
            expect(signals).toBeDefined();
            expect(Array.isArray(signals)).toBe(true);
            expect(signals.length).toBe(0);
        });
        test('should handle malformed signals in consolidation', async () => {
            const malformedSignals = [
                {
                    id: 'signal1',
                    source: 'demand_inference',
                    timestamp: Date.now(),
                    type: 'inferred',
                    confidence: 0.8,
                    context: {
                        market: 'electronics',
                        category: 'laptops',
                        priceRange: { min: 0, max: 100 },
                        intent: 'purchase',
                        topics: ['gaming'],
                        keywords: null, // Invalid
                        sentiment: 0.5,
                        urgency: 0.7,
                        matches: [],
                        marketTrends: ['trend1'],
                        userPreferences: ['pref1'],
                        competitiveAnalysis: {
                            competitors: [],
                            marketShare: 0,
                        },
                    },
                    category: 'electronics',
                },
            ];
            await expect(demandInference.consolidateSignals(malformedSignals)).resolves.not.toThrow();
        });
    });
});
//# sourceMappingURL=demandInference.test.js.map