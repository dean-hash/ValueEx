import { IntelligenceOrchestrator } from '../../services/intelligenceOrchestrator';
describe('IntelligenceOrchestrator Integration Tests', () => {
    let orchestrator;
    beforeEach(() => {
        orchestrator = IntelligenceOrchestrator.getInstance();
    });
    describe('Product Processing', () => {
        const mockProduct = {
            id: 'test-product-1',
            name: 'Test Product',
            description: 'A test product for integration testing',
            price: 99.99,
            currency: 'USD',
            merchant: 'Test Merchant',
            categories: ['Electronics', 'Gadgets'],
            url: 'https://test.com/product',
            imageUrl: 'https://test.com/image.jpg',
            brand: 'Test Brand',
            availability: true,
            rating: 4.5,
            reviewCount: 100,
        };
        const mockSignal = {
            id: 'test-signal-1',
            source: 'test',
            content: 'Looking for a high-quality electronic gadget',
            title: 'Product Search',
            url: 'https://test.com/search',
            timestamp: new Date().toISOString(),
            keyPoints: ['quality', 'electronic', 'gadget'],
            type: 'explicit',
            confidence: {
                overall: 0.9,
                factors: {
                    textQuality: 0.9,
                    communityEngagement: 0.8,
                    authorCredibility: 0.85,
                    contentRelevance: 0.95,
                    temporalRelevance: 0.85,
                },
            },
            context: {
                market: 'electronics',
                category: 'gadgets',
                priceRange: {
                    min: 50,
                    max: 200,
                },
                intent: 'purchase',
                topics: ['electronics', 'gadgets'],
                keywords: ['quality', 'electronic', 'gadget'],
                sentiment: 0.8,
                urgency: 0.7,
            },
            analysis: {
                intent: 'purchase',
                topics: ['electronics', 'gadgets'],
                sentiment: 0.8,
                urgency: 0.7,
            },
            metadata: {
                author: 'test_user',
                platform: 'test_platform',
                category: 'electronics',
                engagement: {
                    views: 100,
                    likes: 50,
                    comments: 10,
                    shares: 5,
                },
            },
            query: 'electronic gadget',
            trendMetrics: {
                momentum: 0.8,
                volume: 1000,
                growth: 0.5,
            },
        };
        test('should process product and return resonance score', async () => {
            const resonanceScore = await orchestrator.processProduct(mockProduct, mockSignal);
            expect(resonanceScore).toBeGreaterThan(0);
            expect(resonanceScore).toBeLessThanOrEqual(1);
        });
        test('should handle product processing errors gracefully', async () => {
            const invalidProduct = { ...mockProduct, id: undefined };
            await expect(orchestrator.processProduct(invalidProduct, mockSignal)).rejects.toThrow();
        });
    });
    describe('Response Orchestration', () => {
        test('should orchestrate response with valid input', async () => {
            const input = 'Looking for product recommendations';
            const response = await orchestrator.orchestrateResponse(input);
            expect(response).toContain('Brainstorm');
            expect(response).toContain('Dialogue');
        });
        test('should handle orchestration errors gracefully', async () => {
            const invalidInput = '';
            await expect(orchestrator.orchestrateResponse(invalidInput)).rejects.toThrow();
        });
    });
    describe('Enhanced Product Processing', () => {
        test('should enhance product understanding', async () => {
            const input = 'Smart home devices';
            const enhancedResponse = await orchestrator.enhanceProductUnderstanding(input);
            expect(enhancedResponse).toBeDefined();
            expect(enhancedResponse.confidence).toBeGreaterThan(0.5);
            expect(enhancedResponse.topics).toHaveLength.greaterThan(0);
        });
    });
    describe('Demand Signal Processing', () => {
        test('should process demand signals effectively', async () => {
            const signals = await orchestrator.processDemandSignals([mockSignal]);
            expect(signals).toHaveLength(1);
            expect(signals[0].confidence.overall).toBeGreaterThan(0.5);
        });
    });
});
//# sourceMappingURL=intelligenceOrchestrator.integration.test.js.map