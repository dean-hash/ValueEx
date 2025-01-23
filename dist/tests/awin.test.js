import { AwinService } from '../services/awinService';
describe('Awin Service Tests', () => {
    let awinService;
    let mockConfig;
    let mockMetrics;
    let mockLogger;
    beforeEach(() => {
        mockConfig = {
            getAwinConfig: jest.fn().mockReturnValue({
                apiKey: 'test-key',
                publisherId: 'test-publisher',
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
        awinService = new AwinService(mockConfig, mockMetrics, mockLogger);
    });
    test('should connect to Awin API', async () => {
        try {
            const merchants = await awinService.getMerchants();
            expect(merchants).toBeDefined();
            console.log('Successfully connected to Awin');
            console.log(`Found ${merchants.length} merchants`);
        }
        catch (error) {
            console.error('Failed to connect to Awin:', error);
            throw error;
        }
    });
    test('should search products', async () => {
        try {
            const searchParams = {
                searchTerm: 'test product',
                category: 'test',
                minPrice: 0,
                maxPrice: 100,
            };
            const products = await awinService.searchProducts(searchParams);
            expect(products).toBeDefined();
            expect(Array.isArray(products)).toBe(true);
            console.log('Successfully searched products');
            console.log(`Found ${products.length} products`);
        }
        catch (error) {
            console.error('Failed to search products:', error);
            throw error;
        }
    });
});
//# sourceMappingURL=awin.test.js.map