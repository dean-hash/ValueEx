import { AwinService } from '../../services/awinService';
import { ResonanceFieldService } from '../../services/resonanceField';
import { Logger } from '../../logger/logger';
describe('Awin Service Tests', () => {
    let awinService;
    let resonanceField;
    let logger;
    beforeEach(() => {
        logger = new Logger();
        resonanceField = new ResonanceFieldService();
        awinService = new AwinService('test-api-key', 'test-publisher-id', {
            timeout: 5000,
            resonanceField // Pass resonanceField to enable product-demand matching
        });
    });
    it('should initialize with correct configuration', () => {
        expect(awinService).toBeDefined();
        expect(resonanceField).toBeDefined();
    });
    it('should handle product search with resonance matching', async () => {
        const searchPattern = {
            id: 'test-pattern',
            signals: [],
            confidence: 0.8,
            coherence: 0.7,
            intensity: 0.9,
            temporalFactors: {
                trend: 0.5,
                seasonality: 0.3,
                volatility: 0.2
            },
            spatialFactors: {
                geographic: ['US'],
                demographic: ['adults'],
                psychographic: ['tech-savvy']
            },
            resonanceFactors: {
                sustainability: 0.8,
                innovationLevel: 0.7,
                localImpact: 0.9
            },
            keywords: ['test', 'product'],
            context: {
                market: 'test',
                category: 'test',
                priceRange: { min: 0, max: 100 },
                intent: 'purchase',
                location: {
                    country: 'US'
                },
                timeframe: 'immediate',
                constraints: [],
                preferences: []
            }
        };
        const products = await awinService.searchProducts(searchPattern);
        // Verify resonance scoring
        expect(products.length).toBeGreaterThanOrEqual(0);
        products.forEach(product => {
            expect(product).toHaveProperty('resonanceScore');
            expect(product.resonanceScore).toBeGreaterThanOrEqual(0);
            expect(product.resonanceScore).toBeLessThanOrEqual(1);
            expect(product).toHaveProperty('resonanceMetrics');
            expect(product.resonanceMetrics).toHaveProperty('harmony');
            expect(product.resonanceMetrics).toHaveProperty('impact');
            expect(product.resonanceMetrics).toHaveProperty('sustainability');
            expect(product.resonanceMetrics).toHaveProperty('innovation');
            expect(product.resonanceMetrics).toHaveProperty('localRelevance');
        });
    });
    it('should fetch merchants successfully', async () => {
        const merchants = await awinService.getMerchants();
        expect(Array.isArray(merchants)).toBe(true);
    });
});
//# sourceMappingURL=awin.test.js.map