import { RedditScraper } from '../../services/demandSources/redditScraper';
import { DigitalIntelligence } from '../../services/digitalIntelligence';
import { DemandSourceManager } from '../../services/demandSources/demandSourceManager';
import { logger } from '../../utils/logger';
import { DemandScraper } from '../../services/demandScraper';
import { DemandValidator } from '../../services/mvp/demandValidator';
describe('Demand Analysis Integration', () => {
    let redditScraper;
    let demandManager;
    let intelligence;
    beforeAll(() => {
        redditScraper = new RedditScraper();
        demandManager = new DemandSourceManager();
        intelligence = new DigitalIntelligence();
    });
    it('should analyze demand from real Reddit posts', async () => {
        // 1. Get real posts from Reddit
        const subreddits = ['homeoffice', 'productivity', 'gaming'];
        const signals = await redditScraper.scrape('desk chair recommendations', {
            subreddits,
            limit: 5, // Start small for testing
        });
        expect(signals.length).toBeGreaterThan(0);
        logger.info(`Found ${signals.length} initial signals`);
        // 2. Aggregate signals to remove duplicates and noise
        const aggregatedSignals = await demandManager.gatherDemandSignals('desk chair recommendations', {
            subreddits,
            limit: 5,
        });
        logger.info(`Aggregated to ${aggregatedSignals.length} unique signals`);
        // 3. Analyze each signal with Digital Intelligence
        const analysisResults = await Promise.all(aggregatedSignals.map(async (signal) => {
            const analysis = await intelligence.analyzeNeed(signal.content);
            return {
                signal,
                analysis,
                isGenuine: analysis.isGenuineNeed,
                confidence: analysis.accuracy.confidence,
                recommendedActions: analysis.recommendedActions,
            };
        }));
        // 4. Log detailed results
        analysisResults.forEach((result) => {
            logger.info('Demand Analysis Result:', {
                content: result.signal.content.substring(0, 100) + '...',
                isGenuine: result.isGenuine,
                confidence: result.confidence,
                actions: result.recommendedActions,
            });
        });
        // 5. Validate results
        const genuineDemands = analysisResults.filter((r) => r.isGenuine);
        const highConfidenceDemands = analysisResults.filter((r) => r.confidence > 0.7);
        expect(genuineDemands.length).toBeGreaterThan(0);
        expect(highConfidenceDemands.length).toBeGreaterThan(0);
        // 6. Return actionable insights
        const actionableInsights = analysisResults
            .filter((r) => r.isGenuine && r.confidence > 0.7)
            .map((r) => ({
            content: r.signal.content,
            confidence: r.confidence,
            actions: r.recommendedActions,
            vertical: r.analysis.vertical,
        }));
        logger.info(`Found ${actionableInsights.length} actionable demand signals`);
        expect(actionableInsights.length).toBeGreaterThan(0);
    }, 30000); // Increased timeout for real API calls
});
describe('Product Demand Analysis Integration', () => {
    let scraper;
    let validator;
    beforeAll(async () => {
        scraper = new DemandScraper();
        await scraper.initialize();
        validator = DemandValidator.getInstance();
    });
    afterAll(async () => {
        await scraper.close();
    });
    it('should analyze demand for iPhone 15', async () => {
        const productName = 'iPhone 15';
        const subreddit = 'apple';
        // Test multiple search variations
        const searchQueries = [`${productName} review`, `${productName} worth it`, `${productName} vs`];
        const allSignals = [];
        for (const query of searchQueries) {
            const signals = (await scraper.scrapeReddit(subreddit, query));
            expect(signals).toBeDefined();
            expect(Array.isArray(signals)).toBe(true);
            // Convert ScrapedDemandSignal to DemandSignal
            const convertedSignals = signals.map((signal) => ({
                id: signal.id,
                source: signal.context.community.name,
                content: signal.content,
                title: signal.title,
                url: signal.url,
                timestamp: signal.timestamp,
                keyPoints: signal.analysis.topics.map((t) => t.name),
                confidence: {
                    overall: signal.confidence.overall,
                    factors: {
                        textQuality: signal.confidence.factors.textQuality,
                        communityEngagement: signal.confidence.factors.communityEngagement,
                        authorCredibility: signal.confidence.factors.authorCredibility,
                        contentRelevance: signal.confidence.factors.contentRelevance,
                        temporalRelevance: signal.confidence.factors.temporalRelevance,
                    },
                },
                context: {
                    sentiment: signal.analysis.sentiment,
                    intent: 'unknown',
                    topics: signal.analysis.topics.map((t) => t.name),
                    entities: [],
                },
                validation: {
                    confidence: 0,
                    strength: 0,
                    relevance: 0,
                },
            }));
            allSignals.push(...convertedSignals);
        }
        // Validate signals
        const validatedSignals = await Promise.all(allSignals.map(async (signal) => {
            const validation = await validator.validateDemand(signal.content);
            expect(validation).toHaveProperty('confidence');
            expect(validation).toHaveProperty('strength');
            return {
                ...signal,
                validation: {
                    confidence: validation.confidence,
                    strength: validation.strength, // Use strength from validation response
                    relevance: validation.confidence,
                },
                relevance: validation.confidence,
            };
        }));
        // Calculate demand score
        const demandScore = validatedSignals.reduce((acc, signal) => {
            return acc + (signal.validation?.confidence || 0) * (signal.validation?.confidence || 0);
        }, 0) / validatedSignals.length;
        // Assertions
        expect(demandScore).toBeDefined();
        expect(demandScore).toBeGreaterThan(0);
        expect(demandScore).toBeLessThanOrEqual(1);
        console.log('Test Results:', {
            productName,
            subreddit,
            signalsFound: allSignals.length,
            demandScore,
            topSignals: validatedSignals
                .sort((a, b) => (b.relevance || 0) - (a.relevance || 0))
                .slice(0, 3)
                .map((s) => ({
                source: s.source,
                relevance: s.relevance,
                keyPoints: s.keyPoints || [],
            })),
        });
    }, 30000); // 30 second timeout
    it('should analyze demand for gaming headset', async () => {
        const productName = 'gaming headset';
        const subreddit = 'gaming';
        const searchQueries = [
            `best ${productName}`,
            `${productName} recommendation`,
            `${productName} under 100`,
        ];
        const allSignals = [];
        for (const query of searchQueries) {
            const signals = (await scraper.scrapeReddit(subreddit, query));
            expect(signals).toBeDefined();
            expect(Array.isArray(signals)).toBe(true);
            // Convert ScrapedDemandSignal to DemandSignal
            const convertedSignals = signals.map((signal) => ({
                id: signal.id,
                source: signal.context.community.name,
                content: signal.content,
                title: signal.title,
                url: signal.url,
                timestamp: signal.timestamp,
                keyPoints: signal.analysis.topics.map((t) => t.name),
                confidence: {
                    overall: signal.confidence.overall,
                    factors: {
                        textQuality: signal.confidence.factors.textQuality,
                        communityEngagement: signal.confidence.factors.communityEngagement,
                        authorCredibility: signal.confidence.factors.authorCredibility,
                        contentRelevance: signal.confidence.factors.contentRelevance,
                        temporalRelevance: signal.confidence.factors.temporalRelevance,
                    },
                },
                context: {
                    sentiment: signal.analysis.sentiment,
                    intent: 'unknown',
                    topics: signal.analysis.topics.map((t) => t.name),
                    entities: [],
                },
                validation: {
                    confidence: 0,
                    strength: 0,
                    relevance: 0,
                },
            }));
            allSignals.push(...convertedSignals);
        }
        const validatedSignals = await Promise.all(allSignals.map(async (signal) => {
            const validation = await validator.validateDemand(signal.content);
            expect(validation).toHaveProperty('confidence');
            expect(validation).toHaveProperty('strength');
            return {
                ...signal,
                validation: {
                    confidence: validation.confidence,
                    strength: validation.strength, // Use strength from validation response
                    relevance: validation.confidence,
                },
                relevance: validation.confidence,
            };
        }));
        const demandScore = validatedSignals.reduce((acc, signal) => {
            return acc + (signal.validation?.confidence || 0) * (signal.validation?.confidence || 0);
        }, 0) / validatedSignals.length;
        expect(demandScore).toBeDefined();
        expect(demandScore).toBeGreaterThan(0);
        expect(demandScore).toBeLessThanOrEqual(1);
        console.log('Test Results:', {
            productName,
            subreddit,
            signalsFound: allSignals.length,
            demandScore,
            topSignals: validatedSignals
                .sort((a, b) => (b.relevance || 0) - (a.relevance || 0))
                .slice(0, 3)
                .map((s) => ({
                source: s.source,
                relevance: s.relevance,
                keyPoints: s.keyPoints || [],
            })),
        });
    }, 30000); // 30 second timeout
});
describe('DemandAnalysis Integration Tests', () => {
    let validator;
    let signal;
    beforeEach(() => {
        validator = new DemandValidator();
        signal = {
            id: 'test-signal',
            source: 'test',
            content: 'Test content',
            keyPoints: ['point1', 'point2'],
            context: {
                market: 'test-market',
                category: 'test-category',
                priceRange: { min: 0, max: 100 },
                intent: 'purchase',
                topics: ['test'],
                keywords: ['test'],
                sentiment: 0.8,
                urgency: 0.7,
                matches: [],
                marketTrends: ['trend1'],
                userPreferences: ['pref1'],
                competitiveAnalysis: {
                    competitors: [],
                    marketShare: 0,
                },
            },
        };
    });
    it('should validate demand signals', async () => {
        const validation = {
            isValid: true,
            confidence: 0.8,
            strength: 0.9,
            reasons: ['Strong market fit', 'High user engagement'],
        };
        // Rest of the test
    });
});
//# sourceMappingURL=demandAnalysis.integration.test.js.map