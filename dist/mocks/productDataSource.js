"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MockProductDataSource = void 0;
/**
 * Mock product data source for development and testing
 * Simulates product data with resonance patterns
 */
class MockProductDataSource {
    constructor() {
        this.products = [
            {
                id: 'mock-001',
                title: 'Indoor Herb Garden Starter Kit',
                description: 'Complete kit for growing organic herbs indoors, perfect for beginners',
                price: 49.99,
                currency: 'USD',
                category: 'Home & Garden',
                resonanceScore: 0, // Will be calculated
                merchant: {
                    id: 'US_GARDEN_ESSENTIALS',
                    name: 'Garden Essentials',
                    rating: 4.8,
                    trustScore: 0.95,
                },
                url: 'https://example.com/herb-garden-kit',
                features: ['LED grow lights', 'Organic soil', 'Non-GMO herb seeds', 'Self-watering system'],
                targetAudience: ['Urban gardeners', 'Beginners', 'Health conscious'],
                pricePoint: 'mid-range',
                insights: {
                    demandLevel: 0.85,
                    competitionLevel: 0.65,
                    marketTrend: 'rising',
                    seasonality: 0.9,
                    valueProposition: [
                        'Fresh herbs year-round',
                        'Space-efficient design',
                        'Perfect for apartments',
                    ],
                },
                resonanceMetrics: {
                    harmony: 0.9,
                    impact: 0.85,
                    sustainability: 0.95,
                    innovation: 0.8,
                    localRelevance: 0.9,
                },
            },
            {
                id: 'mock-002',
                title: 'Stackable LED Indoor Garden System',
                description: 'Vertical hydroponic system with smart controls',
                price: 199.99,
                currency: 'USD',
                category: 'Home & Garden',
                resonanceScore: 0,
                merchant: {
                    id: 'US_SMART_GARDEN',
                    name: 'Smart Garden Technologies',
                    rating: 4.9,
                    trustScore: 0.92,
                },
                url: 'https://example.com/vertical-garden',
                features: [
                    'Stackable design',
                    'Smart phone control',
                    'Hydroponic system',
                    'Automated lighting',
                ],
                targetAudience: ['Tech enthusiasts', 'Space-conscious gardeners', 'Urban professionals'],
                pricePoint: 'premium',
                insights: {
                    demandLevel: 0.9,
                    competitionLevel: 0.55,
                    marketTrend: 'rising',
                    seasonality: 0.85,
                    valueProposition: [
                        'Space-efficient vertical design',
                        'Smart automation',
                        'Year-round growing',
                    ],
                },
                resonanceMetrics: {
                    harmony: 0.85,
                    impact: 0.9,
                    sustainability: 0.9,
                    innovation: 0.95,
                    localRelevance: 0.85,
                },
            },
            {
                id: 'mock-003',
                title: 'Minnesota-Made Indoor Herb Kit',
                description: 'Locally sourced indoor herb growing kit with cold-resistant varieties',
                price: 39.99,
                currency: 'USD',
                category: 'Home & Garden',
                resonanceScore: 0,
                merchant: {
                    id: 'US_MN_LOCAL_GROWTH',
                    name: 'Minnesota Local Growth',
                    rating: 4.7,
                    trustScore: 0.98,
                },
                url: 'https://example.com/mn-herb-kit',
                features: [
                    'Cold-resistant herbs',
                    'Local organic soil',
                    'Minnesota-grown seeds',
                    'Recycled containers',
                ],
                targetAudience: ['Local food enthusiasts', 'Minnesota residents', 'Sustainability focused'],
                pricePoint: 'affordable',
                insights: {
                    demandLevel: 0.95,
                    competitionLevel: 0.45,
                    marketTrend: 'rising',
                    seasonality: 0.95,
                    valueProposition: [
                        'Support local business',
                        'Climate-appropriate varieties',
                        'Sustainable packaging',
                    ],
                },
                resonanceMetrics: {
                    harmony: 0.95,
                    impact: 0.9,
                    sustainability: 0.98,
                    innovation: 0.75,
                    localRelevance: 0.98,
                },
            },
        ];
    }
    async getProducts(pattern) {
        // Simulate API delay
        await new Promise((resolve) => setTimeout(resolve, 500));
        // Filter products based on pattern
        return this.products.filter((product) => {
            const keywordMatch = pattern.keywords.some((keyword) => product.title.toLowerCase().includes(keyword.toLowerCase()) ||
                product.features.some((f) => f.toLowerCase().includes(keyword.toLowerCase())));
            const locationMatch = !pattern.location?.region ||
                product.merchant.id.includes(pattern.location.region.toUpperCase());
            return keywordMatch && locationMatch;
        });
    }
}
exports.MockProductDataSource = MockProductDataSource;
//# sourceMappingURL=productDataSource.js.map