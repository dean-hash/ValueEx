import { MockProductDataSource } from '../../mocks/productDataSource';
describe('MockProductDataSource', () => {
    let productSource;
    beforeEach(() => {
        productSource = MockProductDataSource.getInstance();
        // Clear any existing mock products
        productSource.clearMockProducts();
    });
    describe('singleton pattern', () => {
        it('should return the same instance', () => {
            const instance1 = MockProductDataSource.getInstance();
            const instance2 = MockProductDataSource.getInstance();
            expect(instance1).toBe(instance2);
        });
    });
    describe('product management', () => {
        const mockProduct = {
            id: 'test-001',
            title: 'Test Product',
            description: 'A test product for sustainable living',
            price: 99.99,
            currency: 'USD',
            merchant: 'Test Merchant',
            categories: ['Test', 'Sustainable'],
            url: 'https://test.com/product',
            imageUrl: 'https://test.com/image.jpg',
            confidence: 0.9,
            coherence: 0.8,
        };
        it('should add and retrieve mock products', () => {
            productSource.addMockProduct(mockProduct);
            const products = productSource.getAllProducts();
            expect(products).toHaveLength(1);
            expect(products[0]).toEqual(mockProduct);
        });
        it('should clear mock products', () => {
            productSource.addMockProduct(mockProduct);
            productSource.clearMockProducts();
            expect(productSource.getAllProducts()).toHaveLength(0);
        });
    });
    describe('product search', () => {
        const mockPattern = {
            id: 'pattern-001',
            timeframe: '2024-Q1',
            intensity: 0.8,
            confidence: 0.9,
            coherence: 0.85,
            signals: [],
            temporalFactors: {
                seasonality: 0.7,
                trendStrength: 0.8,
                cyclicality: 0.6,
            },
            spatialFactors: {
                geographicSpread: 0.7,
                marketPenetration: 0.6,
                demographicReach: 0.8,
            },
            context: {
                marketTrends: ['sustainable'],
                userPreferences: ['eco-friendly'],
                competitiveAnalysis: {
                    marketShare: 0.3,
                    competitorStrength: 0.7,
                    uniqueSellingPoints: ['green'],
                },
            },
            category: 'Sustainable',
            priceRange: {
                min: 50,
                max: 150,
            },
        };
        const mockProducts = [
            {
                id: 'prod-001',
                title: 'Eco Water Bottle',
                description: 'Sustainable water bottle made from recycled materials',
                price: 99.99,
                currency: 'USD',
                merchant: 'EcoStore',
                categories: ['Sustainable', 'Lifestyle'],
                url: 'https://example.com/bottle',
                imageUrl: 'https://example.com/bottle.jpg',
                confidence: 0.9,
                coherence: 0.85,
            },
            {
                id: 'prod-002',
                title: 'Premium Headphones',
                description: 'High-quality audio experience',
                price: 299.99,
                currency: 'USD',
                merchant: 'AudioStore',
                categories: ['Electronics', 'Audio'],
                url: 'https://example.com/headphones',
                imageUrl: 'https://example.com/headphones.jpg',
                confidence: 0.95,
                coherence: 0.92,
            },
        ];
        beforeEach(() => {
            mockProducts.forEach((product) => productSource.addMockProduct(product));
        });
        it('should filter products by category', async () => {
            const results = await productSource.searchProducts(mockPattern);
            expect(results).toHaveLength(1);
            expect(results[0].id).toBe('prod-001');
        });
        it('should filter products by price range', async () => {
            const results = await productSource.searchProducts(mockPattern);
            expect(results).toHaveLength(1);
            expect(results[0].price).toBeLessThanOrEqual(mockPattern.priceRange.max);
            expect(results[0].price).toBeGreaterThanOrEqual(mockPattern.priceRange.min);
        });
        it('should filter products by market trends', async () => {
            const results = await productSource.searchProducts(mockPattern);
            expect(results).toHaveLength(1);
            expect(results[0].description.toLowerCase()).toContain('sustainable');
        });
        it('should return empty array when no matches found', async () => {
            const noMatchPattern = {
                ...mockPattern,
                category: 'NonExistent',
                context: {
                    ...mockPattern.context,
                    marketTrends: ['nonexistent'],
                },
            };
            const results = await productSource.searchProducts(noMatchPattern);
            expect(results).toHaveLength(0);
        });
    });
});
//# sourceMappingURL=productDataSource.test.js.map