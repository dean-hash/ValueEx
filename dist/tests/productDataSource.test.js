import { MockProductDataSource } from '../mocks/productDataSource';
describe('Product Data Source Tests', () => {
    let productDataSource;
    beforeEach(() => {
        productDataSource = new MockProductDataSource();
    });
    it('should find products matching demand pattern', async () => {
        const mockDemandPattern = {
            id: 'test-pattern',
            signals: [],
            confidence: {
                overall: 0.75,
                factors: {
                    textQuality: 0.8,
                    communityEngagement: 0.7,
                    authorCredibility: 0.75,
                    contentRelevance: 0.8,
                    temporalRelevance: 0.7,
                },
            },
            coherence: 0.8,
            intensity: 0.7,
            context: {
                keywords: ['test', 'product'],
                sentiment: 0,
                urgency: 0.5,
                matches: [],
            },
            requirements: {
                features: ['test-feature'],
                constraints: {},
            },
        };
        const products = await productDataSource.findMatchingProducts(mockDemandPattern);
        expect(Array.isArray(products)).toBe(true);
        products.forEach((product) => {
            expect(product).toHaveProperty('name');
            expect(product).toHaveProperty('price');
            expect(product).toHaveProperty('category');
            expect(product).toHaveProperty('source');
            expect(product).toHaveProperty('status');
        });
    });
    it('should handle empty demand pattern gracefully', async () => {
        const emptyPattern = {
            strength: 0,
            confidence: 0,
            source: 'manual',
            status: 'inactive',
            signals: [],
            timestamp: new Date().toISOString(),
        };
        const products = await productDataSource.findMatchingProducts(emptyPattern);
        expect(Array.isArray(products)).toBe(true);
        expect(products).toHaveLength(0);
    });
});
//# sourceMappingURL=productDataSource.test.js.map