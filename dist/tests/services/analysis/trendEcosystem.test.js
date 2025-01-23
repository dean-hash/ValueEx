import { TrendAnalyzer } from '../../../services/analysis/trendAnalyzer';
import { MarketTrendAdapter } from '../../../services/analysis/adapters/marketTrendAdapter';
import { SocialMediaConnector } from '../../../services/connectors/implementations/socialMediaConnector';
import { MarketplaceConnector } from '../../../services/connectors/implementations/marketplaceConnector';
import { IntelligenceCoordinator } from '../../../services/analysis/intelligenceCoordinator';
import { DemandType } from '../../../types/demandTypes';
describe('Trend Analysis Ecosystem', () => {
    let trendAnalyzer;
    let marketTrendAdapter;
    let socialMediaConnector;
    let marketplaceConnector;
    let intelligenceCoordinator;
    beforeEach(() => {
        trendAnalyzer = TrendAnalyzer.getInstance();
        marketTrendAdapter = MarketTrendAdapter.getInstance();
        socialMediaConnector = new SocialMediaConnector({
            platform: 'test',
            endpoint: 'http://localhost:3000/api/social',
            streamEndpoint: 'ws://localhost:3000/ws/social'
        });
        marketplaceConnector = new MarketplaceConnector({
            amazonEndpoint: 'http://localhost:3000/api/amazon',
            ebayEndpoint: 'http://localhost:3000/api/ebay'
        });
        intelligenceCoordinator = IntelligenceCoordinator.getInstance();
    });
    describe('Signal Flow and Transformation', () => {
        it('should process signals through the entire pipeline', async () => {
            // Create a mock demand signal
            const mockSignal = {
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
                    category: 'sustainable_tech',
                    priceRange: { min: 100, max: 500, currency: 'USD' },
                    intent: 'purchase',
                    topics: ['sustainability', 'innovation'],
                    keywords: ['eco-friendly', 'sustainable', 'technology'],
                    sentiment: 0.8,
                    urgency: 0.7,
                    matches: [],
                    marketTrends: {
                        momentum: 0.8,
                        volume: 0.7,
                        growth: 0.6,
                        seasonality: 0.2
                    },
                    userPreferences: {
                        brands: ['eco-tech', 'green-innovations'],
                        pricePoints: ['mid-range'],
                        features: ['sustainable', 'efficient']
                    },
                    competitiveAnalysis: {
                        competitors: ['competitor1', 'competitor2'],
                        marketShare: 0.3,
                        positioning: 'mid-range',
                        uniqueSellingPoints: ['eco-friendly', 'innovative']
                    }
                },
                trendMetrics: {
                    momentum: 0.8,
                    volume: 0.7,
                    growth: 0.6,
                    seasonality: 0.2
                },
                analysis: {
                    topics: ['sustainability', 'technology'],
                    sentiment: 0.8,
                    urgency: 0.7
                }
            };
            // 1. Market Trend Adapter Processing
            const marketTrend = await marketTrendAdapter.analyzeTrend(mockSignal);
            expect(marketTrend).toBeDefined();
            expect(marketTrend.organicGrowth).toBeGreaterThan(0);
            expect(marketTrend.sustainedInterest).toBe(true);
            // 2. Trend Analysis
            const trendMetrics = await trendAnalyzer.analyzeTrend(mockSignal);
            expect(trendMetrics).toBeDefined();
            expect(trendMetrics.organicGrowth).toBeGreaterThan(0);
            expect(trendMetrics.sustainedInterest).toBe(true);
            expect(trendMetrics.realWorldImpact).toBe(true);
            // 3. Social Media Integration
            const socialSignals = await socialMediaConnector.fetchTrendingTopics('sustainable_tech');
            expect(socialSignals).toBeDefined();
            expect(socialSignals.length).toBeGreaterThan(0);
            // 4. Marketplace Validation
            const urgencyScore = await marketplaceConnector.calculateUrgency({
                category: mockSignal.context.category,
                marketTrends: mockSignal.context.marketTrends
            });
            expect(urgencyScore).toBeGreaterThan(0);
            expect(urgencyScore).toBeLessThanOrEqual(1);
            // 5. Intelligence Coordination
            const enhancedSignal = await intelligenceCoordinator.processSignal(mockSignal, 'trend');
            expect(enhancedSignal).toBeDefined();
            expect(enhancedSignal.confidence.overall).toBeGreaterThan(mockSignal.confidence.overall);
        });
        it('should handle conflicting signals appropriately', async () => {
            const conflictingSignals = [
                // Positive signal
                {
                    ...mockBaseSignal(),
                    context: {
                        ...mockBaseContext(),
                        marketTrends: { momentum: 0.9, volume: 0.8, growth: 0.7, seasonality: 0.1 }
                    }
                },
                // Negative signal
                {
                    ...mockBaseSignal(),
                    context: {
                        ...mockBaseContext(),
                        marketTrends: { momentum: 0.3, volume: 0.4, growth: 0.2, seasonality: 0.8 }
                    }
                }
            ];
            const results = await Promise.all(conflictingSignals.map(signal => trendAnalyzer.analyzeTrend(signal)));
            expect(results[0].organicGrowth).toBeGreaterThan(results[1].organicGrowth);
            expect(results[0].sustainedInterest).toBe(true);
            expect(results[1].sustainedInterest).toBe(false);
        });
        it('should detect and handle market manipulation attempts', async () => {
            const manipulatedSignal = {
                ...mockBaseSignal(),
                context: {
                    ...mockBaseContext(),
                    marketTrends: {
                        momentum: 0.95, // Suspiciously high
                        volume: 0.9, // Suspiciously high
                        growth: 0.85, // Suspiciously high
                        seasonality: 0.1
                    }
                }
            };
            const trendMetrics = await trendAnalyzer.analyzeTrend(manipulatedSignal);
            expect(trendMetrics.organicGrowth).toBeLessThan(0.5); // Should downgrade suspicious growth
        });
    });
    describe('Temporal Analysis', () => {
        it('should track trend evolution over time', async () => {
            const timeframes = ['-7d', '-1m', '-3m'];
            const category = 'sustainable_tech';
            const trendEvolution = await Promise.all(timeframes.map(timeframe => marketTrendAdapter.analyzeTrend({
                ...mockBaseSignal(),
                context: {
                    ...mockBaseContext(),
                    category,
                    marketTrends: {
                        momentum: 0.7,
                        volume: 0.6,
                        growth: 0.5,
                        seasonality: 0.3
                    }
                }
            })));
            expect(trendEvolution).toHaveLength(timeframes.length);
            trendEvolution.forEach(trends => {
                expect(trends).toBeDefined();
                expect(trends.organicGrowth).toBeGreaterThan(0);
                expect(trends.engagement).toBeDefined();
            });
        });
    });
    describe('Cross-Platform Correlation', () => {
        it('should correlate trends across different platforms', async () => {
            const category = 'sustainable_tech';
            const signal = {
                ...mockBaseSignal(),
                context: {
                    ...mockBaseContext(),
                    category,
                    marketTrends: {
                        momentum: 0.7,
                        volume: 0.6,
                        growth: 0.5,
                        seasonality: 0.3
                    }
                }
            };
            const [marketMetrics, socialMetrics] = await Promise.all([
                marketplaceConnector.calculateUrgency(signal),
                socialMediaConnector.fetchTrendingTopics(category)
            ]);
            expect(marketMetrics).toBeGreaterThan(0);
            expect(socialMetrics.length).toBeGreaterThan(0);
        });
    });
});
// Helper functions for creating base mock objects
function mockBaseSignal() {
    return {
        id: 'test-signal',
        title: 'Test Signal',
        content: 'Test content',
        url: 'https://example.com',
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
        }
    };
}
function mockBaseContext() {
    return {
        market: 'test_market',
        category: 'test_category',
        priceRange: { min: 0, max: 100, currency: 'USD' },
        intent: 'test',
        topics: ['test'],
        keywords: ['test'],
        sentiment: 0,
        urgency: 0.5,
        matches: [],
        marketTrends: {
            momentum: 0.5,
            volume: 0.5,
            growth: 0.5,
            seasonality: 0.5
        },
        userPreferences: {
            brands: [],
            pricePoints: [],
            features: []
        },
        competitiveAnalysis: {
            competitors: [],
            marketShare: 0,
            positioning: 'mid',
            uniqueSellingPoints: []
        }
    };
}
//# sourceMappingURL=trendEcosystem.test.js.map