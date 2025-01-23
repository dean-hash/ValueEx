"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mockDemandPatterns = exports.mockProducts = void 0;
const demandTypes_1 = require("../types/demandTypes");
exports.mockProducts = [
    {
        id: 'prod1',
        title: 'Smart Home Hub Pro',
        description: 'Advanced home automation hub with AI capabilities',
        price: 199.99,
        currency: 'USD',
        merchant: 'TechVille',
        categories: ['Smart Home', 'Electronics', 'IoT'],
        url: 'http://localhost:3000/products/1',
        imageUrl: 'https://picsum.photos/200/300',
        confidence: 0.85,
        coherence: 0.92,
    },
    {
        id: 'prod2',
        title: 'Eco-Friendly Water Bottle',
        description: 'Self-cleaning water bottle with temperature control',
        price: 45.99,
        currency: 'USD',
        merchant: 'GreenLife',
        categories: ['Lifestyle', 'Eco-Friendly', 'Health'],
        url: 'http://localhost:3000/products/2',
        imageUrl: 'https://picsum.photos/200/300',
        confidence: 0.78,
        coherence: 0.85,
    },
    {
        id: 'prod3',
        title: 'AI Writing Assistant Pro',
        description: 'Professional writing tool powered by advanced AI',
        price: 29.99,
        currency: 'USD',
        merchant: 'AITools',
        categories: ['Software', 'Productivity', 'AI'],
        url: 'http://localhost:3000/products/3',
        imageUrl: 'https://picsum.photos/200/300',
        confidence: 0.95,
        coherence: 0.88,
    },
];
exports.mockDemandPatterns = [
    {
        id: 'dp1',
        timeframe: '2024-Q1',
        intensity: 0.85,
        confidence: 0.92,
        coherence: 0.88,
        signals: [
            {
                id: 'signal1',
                title: 'Growing demand for AI writing tools',
                content: 'Discussion about AI writing assistants and their impact on productivity',
                url: 'https://reddit.com/r/productivity/ai-writing',
                source: 'reddit',
                type: demandTypes_1.DemandType.IMPLICIT,
                timestamp: new Date().toISOString(),
                keyPoints: ['Increased productivity', 'AI integration', 'Writing assistance'],
                confidence: {
                    overall: 0.85,
                    factors: {
                        textQuality: 0.88,
                        communityEngagement: 0.82,
                        authorCredibility: 0.85,
                        contentRelevance: 0.9,
                        temporalRelevance: 0.8,
                    },
                },
                context: {
                    market: 'AI Writing Tools',
                    category: 'Software',
                    priceRange: {
                        min: 20,
                        max: 100,
                        currency: 'USD',
                    },
                    intent: 'purchase',
                    topics: ['AI', 'Writing', 'Productivity'],
                    keywords: ['AI writing', 'content generation', 'writing assistant'],
                    sentiment: 0.8,
                    urgency: 0.7,
                    matches: ['product1', 'product2'],
                    marketTrends: {
                        momentum: 0.85,
                        volume: 10000,
                        growth: 0.25,
                        seasonality: 0.7,
                    },
                    userPreferences: {
                        brands: ['AITools', 'WriterPro'],
                        pricePoints: ['premium', 'enterprise'],
                        features: ['easy to use', 'integration capabilities'],
                    },
                    competitiveAnalysis: {
                        marketShare: 0.35,
                        competitors: ['Grammarly', 'ProWritingAid'],
                        positioning: 'Premium AI writing assistant with advanced features',
                    },
                },
                trendMetrics: {
                    momentum: 0.8,
                    volume: 0.7,
                    growth: 0.85,
                    seasonality: 0.6,
                },
                analysis: {
                    topics: ['AI', 'productivity', 'software'],
                    sentiment: 0.75,
                    urgency: 0.65,
                },
            },
        ],
        temporalFactors: {
            trend: 0.85,
            seasonality: 0.7,
            volatility: 0.6,
        },
        spatialFactors: {
            geographic: ['North America', 'Europe', 'Asia'],
            demographic: ['Professionals', 'Students', 'Content Creators'],
            psychographic: ['Tech-savvy', 'Productivity-focused', 'Quality-conscious'],
        },
        context: {
            marketTrends: {
                momentum: 0.85,
                volume: 10000,
                growth: 0.25,
                seasonality: 0.7,
            },
            userPreferences: {
                brands: ['AITools', 'WriterPro'],
                pricePoints: ['premium', 'enterprise'],
                features: ['easy to use', 'integration capabilities'],
            },
            competitiveAnalysis: {
                marketShare: 0.45,
                competitors: ['Grammarly', 'ProWritingAid'],
                positioning: 'Market-leading AI writing assistant',
            },
        },
        category: 'Software',
        priceRange: {
            min: 20,
            max: 100,
        },
    },
];
//# sourceMappingURL=mockData.js.map