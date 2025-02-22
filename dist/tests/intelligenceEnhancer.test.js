import { IntelligenceEnhancer } from '../services/intelligenceEnhancer';
import { OpenAIClient } from '../clients/openai';
// Mock OpenAIClient
jest.mock('../clients/openai', () => {
    const mockCreateJSONCompletion = jest.fn();
    return {
        OpenAIClient: {
            getInstance: jest.fn().mockReturnValue({
                createJSONCompletion: mockCreateJSONCompletion,
            }),
        },
    };
});
describe('IntelligenceEnhancer', () => {
    let enhancer;
    let mockCreateJSONCompletion;
    const mockProduct = {
        id: '123',
        title: 'Test Product',
        description: 'A test product description',
        price: 99.99,
        currency: 'USD',
        merchant: 'Test Merchant',
        categories: ['Test Category'],
        url: 'http://test.com',
        imageUrl: 'http://test.com/image.jpg',
        confidence: 0.9,
        coherence: 0.8,
    };
    const mockPattern = {
        strength: 0.8,
        confidence: 0.9,
        source: 'market_analysis',
        status: 'active',
        signals: [
            {
                source: 'market_research',
                strength: 0.8,
                confidence: 0.9,
                status: 'active',
                content: 'Strong market demand detected',
                timestamp: new Date().toISOString(),
            },
        ],
        timestamp: new Date().toISOString(),
    };
    beforeEach(() => {
        // Get fresh reference to the mock
        mockCreateJSONCompletion = OpenAIClient.getInstance().createJSONCompletion;
        // Clear all mocks
        jest.clearAllMocks();
        // Get instance of enhancer
        enhancer = IntelligenceEnhancer.getInstance();
    });
    describe('singleton pattern', () => {
        it('should return the same instance', () => {
            const instance1 = IntelligenceEnhancer.getInstance();
            const instance2 = IntelligenceEnhancer.getInstance();
            expect(instance1).toBe(instance2);
        });
    });
    describe('enhanceProductUnderstanding', () => {
        it('should return product insights when successful', async () => {
            const mockInsights = {
                category: 'Enhanced Category',
                features: ['feature1', 'feature2'],
                targetAudience: ['audience1', 'audience2'],
                pricePoint: 'premium',
            };
            mockCreateJSONCompletion.mockResolvedValueOnce(mockInsights);
            const result = await enhancer.enhanceProductUnderstanding(mockProduct);
            expect(result).toEqual(mockInsights);
            expect(mockCreateJSONCompletion).toHaveBeenCalledWith(expect.arrayContaining([
                expect.objectContaining({ role: 'system' }),
                expect.objectContaining({ role: 'user' }),
            ]), expect.objectContaining({ temperature: 0.3 }));
        });
        it('should handle errors gracefully', async () => {
            mockCreateJSONCompletion.mockRejectedValueOnce(new Error('API Error'));
            const result = await enhancer.enhanceProductUnderstanding(mockProduct);
            expect(result).toEqual({
                category: '',
                features: [],
                targetAudience: [],
                pricePoint: '',
            });
        });
    });
    describe('analyzeDemandContext', () => {
        it('should return demand context when successful', async () => {
            const mockContext = {
                marketTrends: ['trend1', 'trend2'],
                competitiveLandscape: ['comp1', 'comp2'],
                consumerBehavior: ['behavior1', 'behavior2'],
            };
            mockCreateJSONCompletion.mockResolvedValueOnce(mockContext);
            const result = await enhancer.analyzeDemandContext(mockPattern);
            expect(result).toEqual(mockContext);
            expect(mockCreateJSONCompletion).toHaveBeenCalledWith(expect.arrayContaining([
                expect.objectContaining({ role: 'system' }),
                expect.objectContaining({ role: 'user' }),
            ]), expect.objectContaining({ temperature: 0.4 }));
        });
        it('should handle errors gracefully', async () => {
            mockCreateJSONCompletion.mockRejectedValueOnce(new Error('API Error'));
            const result = await enhancer.analyzeDemandContext(mockPattern);
            expect(result).toEqual({
                marketTrends: [],
                competitiveLandscape: [],
                consumerBehavior: [],
            });
        });
    });
    describe('calculateContextualResonance', () => {
        it('should calculate average resonance when successful', async () => {
            const mockResonance = {
                resonanceFactors: {
                    temporal: 0.8,
                    content: 0.6,
                    interaction: 0.7,
                },
            };
            mockCreateJSONCompletion.mockResolvedValueOnce(mockResonance);
            const result = await enhancer.calculateContextualResonance(mockProduct, mockPattern);
            expect(result).toBeCloseTo(0.7); // (0.8 + 0.6 + 0.7) / 3
            expect(mockCreateJSONCompletion).toHaveBeenCalledWith(expect.arrayContaining([
                expect.objectContaining({ role: 'system' }),
                expect.objectContaining({ role: 'user' }),
            ]), expect.objectContaining({ temperature: 0.2 }));
        });
        it('should return 0 when no resonance factors', async () => {
            mockCreateJSONCompletion.mockResolvedValueOnce({});
            const result = await enhancer.calculateContextualResonance(mockProduct, mockPattern);
            expect(result).toBe(0);
        });
        it('should handle errors gracefully', async () => {
            mockCreateJSONCompletion.mockRejectedValueOnce(new Error('API Error'));
            const result = await enhancer.calculateContextualResonance(mockProduct, mockPattern);
            expect(result).toBe(0);
        });
    });
    describe('enhanceDemandPattern', () => {
        it('should enhance pattern with new insights when successful', async () => {
            const mockEnhancement = {
                marketTrends: ['newTrend1', 'newTrend2'],
                userPreferences: ['newPref1', 'newPref2'],
                competitiveAnalysis: {
                    marketShare: 0.4,
                    competitorStrength: 0.6,
                    uniqueSellingPoints: ['newUSP1', 'newUSP2'],
                },
            };
            mockCreateJSONCompletion.mockResolvedValueOnce(mockEnhancement);
            const result = await enhancer.enhanceDemandPattern(mockPattern);
            expect(result.context.marketTrends).toEqual([
                ...mockPattern.context.marketTrends,
                ...mockEnhancement.marketTrends,
            ]);
            expect(result.context.userPreferences).toEqual([
                ...mockPattern.context.userPreferences,
                ...mockEnhancement.userPreferences,
            ]);
            expect(result.context.competitiveAnalysis).toEqual({
                ...mockPattern.context.competitiveAnalysis,
                ...mockEnhancement.competitiveAnalysis,
            });
            expect(mockCreateJSONCompletion).toHaveBeenCalledWith(expect.arrayContaining([
                expect.objectContaining({ role: 'system' }),
                expect.objectContaining({ role: 'user' }),
            ]), expect.objectContaining({ temperature: 0.5 }));
        });
        it('should handle null response gracefully', async () => {
            mockCreateJSONCompletion.mockResolvedValueOnce(null);
            const result = await enhancer.enhanceDemandPattern(mockPattern);
            expect(result).toEqual(mockPattern);
        });
        it('should handle errors gracefully', async () => {
            mockCreateJSONCompletion.mockRejectedValueOnce(new Error('API Error'));
            const result = await enhancer.enhanceDemandPattern(mockPattern);
            expect(result).toEqual(mockPattern);
        });
    });
});
//# sourceMappingURL=intelligenceEnhancer.test.js.map