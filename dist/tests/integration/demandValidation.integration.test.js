import { DemandValidator } from '../../services/analysis/demandValidator';
import { IntelligenceEnhancer } from '../../services/intelligence/intelligenceEnhancer';
describe('Demand Validation Integration Tests', () => {
    let validator;
    let enhancer;
    let mockConfig;
    let mockMetrics;
    let mockLogger;
    beforeEach(() => {
        mockConfig = {
            getOpenAIConfig: jest.fn().mockReturnValue({
                apiKey: process.env.OPENAI_API_KEY,
            }),
        };
        mockMetrics = {
            recordApiMetrics: jest.fn(),
            recordResourceMetric: jest.fn(),
            recordSourceMetric: jest.fn(),
        };
        mockLogger = {
            info: jest.fn(),
            error: jest.fn(),
            warn: jest.fn(),
            debug: jest.fn(),
        };
        validator = new DemandValidator();
        enhancer = new IntelligenceEnhancer(mockConfig, mockMetrics, mockLogger);
    });
    const realWorldScenarios = [
        {
            name: 'High-end Electronics',
            signal: {
                id: 'electronics-001',
                title: 'Gaming Laptop Search',
                content: 'Looking for a high-performance laptop for gaming and video editing, budget around $2000',
                url: 'https://reddit.com/r/suggestalaptop/123',
                timestamp: new Date().toISOString(),
                type: 'Explicit',
                source: 'reddit',
                keyPoints: ['gaming', 'video editing', 'high budget'],
                context: {
                    market: 'electronics',
                    category: 'laptops',
                    priceRange: { min: 1500, max: 2500 },
                    intent: 'purchase',
                    topics: ['gaming', 'video editing'],
                    keywords: ['laptop', 'gaming', 'video editing', 'high performance'],
                    sentiment: 0.8,
                    urgency: 0.7,
                    matches: [],
                    marketTrends: {
                        momentum: 0.75,
                        volume: 0.8,
                        growth: 0.7,
                        seasonality: 0.6,
                    },
                    userPreferences: {
                        brands: ['Razer', 'Alienware', 'MSI'],
                        pricePoints: ['$1500-2000', '$2000-2500'],
                        features: ['RTX GPU', '32GB RAM', '1TB SSD'],
                    },
                    competitiveAnalysis: {
                        competitors: [],
                        marketShare: 0,
                        positioning: 'premium gaming and content creation',
                    },
                },
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
                strength: 0.8,
                analysis: {
                    intent: 'purchase',
                    topics: ['gaming laptops', 'content creation', 'high performance computing'],
                    sentiment: 0.9,
                    urgency: 0.8,
                },
                metadata: {
                    author: 'techEnthusiast123',
                    platform: 'reddit',
                    category: 'gaming',
                    engagement: {
                        views: 1500,
                        likes: 120,
                        comments: 45,
                        shares: 15,
                    },
                },
                query: 'gaming laptop video editing',
                trendMetrics: {
                    momentum: 0.75,
                    volume: 0.8,
                    growth: 0.7,
                    seasonality: 0.6,
                },
            },
        },
        {
            name: 'Sustainable Fashion',
            signal: {
                id: 'fashion-001',
                title: 'Eco-friendly Fashion Search',
                content: 'Need eco-friendly and sustainable clothing brands that use organic materials',
                url: 'https://twitter.com/user/123',
                timestamp: new Date().toISOString(),
                type: 'Implicit',
                source: 'twitter',
                keyPoints: ['sustainability', 'organic materials', 'eco-friendly'],
                context: {
                    market: 'fashion',
                    category: 'sustainable',
                    priceRange: { min: 50, max: 200 },
                    intent: 'research',
                    topics: ['sustainability', 'organic fashion'],
                    keywords: ['eco-friendly', 'sustainable', 'organic', 'clothing'],
                    sentiment: 0.9,
                    urgency: 0.5,
                    matches: [],
                    marketTrends: {
                        momentum: 0.8,
                        volume: 0.7,
                        growth: 0.85,
                        seasonality: 0.5,
                    },
                    userPreferences: {
                        brands: ['Patagonia', 'Everlane', 'Reformation'],
                        pricePoints: ['$50-100', '$100-200'],
                        features: ['Organic Cotton', 'Fair Trade', 'Recycled Materials'],
                    },
                    competitiveAnalysis: {
                        competitors: [],
                        marketShare: 0,
                        positioning: 'eco-conscious fashion',
                    },
                },
                confidence: {
                    overall: 0.9,
                    factors: {
                        textQuality: 0.95,
                        communityEngagement: 0.85,
                        authorCredibility: 0.9,
                        contentRelevance: 0.95,
                        temporalRelevance: 0.85,
                    },
                },
                strength: 0.75,
                analysis: {
                    intent: 'research',
                    topics: ['sustainable fashion', 'eco-friendly materials', 'ethical manufacturing'],
                    sentiment: 0.85,
                    urgency: 0.6,
                },
                metadata: {
                    author: 'ecoFashionista',
                    platform: 'twitter',
                    category: 'fashion',
                    engagement: {
                        views: 2500,
                        likes: 350,
                        comments: 75,
                        shares: 80,
                    },
                },
                query: 'sustainable eco-friendly fashion',
                trendMetrics: {
                    momentum: 0.8,
                    volume: 0.7,
                    growth: 0.85,
                    seasonality: 0.5,
                },
            },
        },
        {
            name: 'Home Fitness Equipment',
            signal: {
                id: 'fitness-001',
                title: 'Compact Home Gym Search',
                content: 'Looking for compact home gym equipment for a small apartment, need something versatile',
                url: 'https://instagram.com/p/123',
                timestamp: new Date().toISOString(),
                type: 'Explicit',
                source: 'instagram',
                keyPoints: ['compact', 'home gym', 'apartment friendly'],
                context: {
                    market: 'fitness',
                    category: 'home equipment',
                    priceRange: { min: 200, max: 1000 },
                    intent: 'purchase',
                    topics: ['home fitness', 'compact equipment'],
                    keywords: ['home gym', 'compact', 'versatile', 'apartment'],
                    sentiment: 0.7,
                    urgency: 0.8,
                    matches: [],
                    marketTrends: {
                        momentum: 0.7,
                        volume: 0.8,
                        growth: 0.9,
                        seasonality: 0.4,
                    },
                    userPreferences: {
                        brands: ['Bowflex', 'NordicTrack', 'Peloton'],
                        pricePoints: ['$200-500', '$500-1000'],
                        features: ['Compact', 'Multi-function', 'Smart Features'],
                    },
                    competitiveAnalysis: {
                        competitors: [],
                        marketShare: 0,
                        positioning: 'space-efficient home fitness',
                    },
                },
                confidence: {
                    overall: 0.8,
                    factors: {
                        textQuality: 0.85,
                        communityEngagement: 0.75,
                        authorCredibility: 0.8,
                        contentRelevance: 0.85,
                        temporalRelevance: 0.75,
                    },
                },
                strength: 0.85,
                analysis: {
                    intent: 'purchase',
                    topics: ['home fitness', 'space-saving equipment', 'smart fitness'],
                    sentiment: 0.8,
                    urgency: 0.85,
                },
                metadata: {
                    author: 'fitnessFanatic',
                    platform: 'instagram',
                    category: 'fitness',
                    engagement: {
                        views: 3500,
                        likes: 450,
                        comments: 95,
                        shares: 60,
                    },
                },
                query: 'compact home gym equipment',
                trendMetrics: {
                    momentum: 0.7,
                    volume: 0.8,
                    growth: 0.9,
                    seasonality: 0.4,
                },
            },
        },
    ];
    describe('Real-world Scenario Validation', () => {
        test.each(realWorldScenarios)('should validate $name demand pattern', async ({ signal }) => {
            // First validate the raw signal
            const validation = await validator.validateDemand(signal.content);
            expect(validation.isValid).toBe(true);
            expect(validation.confidence.overall).toBeGreaterThan(0.7);
            expect(validation.confidence.factors.textQuality).toBeGreaterThan(0.6);
            expect(validation.confidence.factors.communityEngagement).toBeGreaterThan(0.6);
            expect(validation.confidence.factors.authorCredibility).toBeGreaterThan(0.6);
            expect(validation.confidence.factors.contentRelevance).toBeGreaterThan(0.6);
            expect(validation.confidence.factors.temporalRelevance).toBeGreaterThan(0.6);
            // Then enhance the signal
            const enhancedSignal = await enhancer.enhanceDemandContext(signal);
            expect(enhancedSignal).toBeDefined();
            // Validate enhanced signal properties
            expect(enhancedSignal.context.market).toBe(signal.context.market);
            expect(enhancedSignal.context.category).toBe(signal.context.category);
            expect(enhancedSignal.context.marketTrends.growth).toBeGreaterThan(0);
            expect(enhancedSignal.context.keywords.length).toBeGreaterThanOrEqual(signal.context.keywords.length);
            // Validate context-specific expectations
            switch (signal.context.market) {
                case 'electronics':
                    expect(enhancedSignal.context.priceRange.min).toBeGreaterThan(1000);
                    expect(enhancedSignal.context.urgency).toBeGreaterThan(0.6);
                    break;
                case 'fashion':
                    expect(enhancedSignal.context.topics).toContain('sustainability');
                    expect(enhancedSignal.context.sentiment).toBeGreaterThan(0.7);
                    break;
                case 'fitness':
                    expect(enhancedSignal.context.keywords).toContain('compact');
                    expect(enhancedSignal.context.urgency).toBeGreaterThan(0.7);
                    break;
            }
        }, 30000);
        it('should identify emerging trends across multiple signals', async () => {
            const signals = realWorldScenarios.map((scenario) => scenario.signal);
            const patterns = await Promise.all(signals.map((signal) => enhancer.enhanceDemandContext(signal)));
            // Verify pattern identification
            expect(patterns).toHaveLength(signals.length);
            patterns.forEach((pattern) => {
                expect(pattern.context.marketTrends.growth).toBeGreaterThan(0);
                expect(pattern.context.userPreferences.brands.length).toBeGreaterThan(0);
            });
            // Verify cross-pattern insights
            const allTrends = patterns.flatMap((p) => p.context.marketTrends);
            const uniqueTrends = new Set(allTrends.map((trend) => trend.growth));
            expect(uniqueTrends.size).toBeGreaterThanOrEqual(2); // Should identify at least 2 unique growth trends
        });
        it('should maintain context consistency across enhancements', async () => {
            const signal = realWorldScenarios[0].signal;
            const firstEnhancement = await enhancer.enhanceDemandContext(signal);
            const secondEnhancement = await enhancer.enhanceDemandContext(signal);
            // Core properties should remain stable
            expect(firstEnhancement.context.market).toBe(secondEnhancement.context.market);
            expect(firstEnhancement.context.category).toBe(secondEnhancement.context.category);
            expect(firstEnhancement.context.intent).toBe(secondEnhancement.context.intent);
            // Confidence levels should be consistent
            const confidenceDiff = Math.abs(firstEnhancement.context.sentiment - secondEnhancement.context.sentiment);
            expect(confidenceDiff).toBeLessThan(0.2);
        });
    });
});
//# sourceMappingURL=demandValidation.integration.test.js.map