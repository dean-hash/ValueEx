import { AwinProduct, AwinSearchParams } from '../types/awinTypes';
import { DemandPattern } from '../types/demandTypes';

export const mockProducts: AwinProduct[] = [
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

export const mockDemandPatterns: DemandPattern[] = [
  {
    id: 'dp1',
    timeframe: '2024-Q1',
    intensity: 0.85,
    confidence: 0.92,
    coherence: 0.88,
    signals: [
      {
        source: 'reddit',
        type: 'discussion',
        timestamp: new Date().toISOString(),
        confidence: 0.85,
        analysis: {
          topics: ['AI', 'productivity', 'software'],
          sentiment: 0.75,
          urgency: 0.65,
          intent: 'purchase_intent',
        },
      },
    ],
    temporalFactors: {
      seasonality: 0.7,
      trendStrength: 0.85,
      cyclicality: 0.6,
    },
    spatialFactors: {
      geographicSpread: 0.8,
      marketPenetration: 0.65,
      demographicReach: 0.75,
    },
    context: {
      marketTrends: ['AI automation', 'productivity tools'],
      userPreferences: ['easy to use', 'integration capabilities'],
      competitiveAnalysis: {
        marketShare: 0.45,
        competitorStrength: 0.7,
        uniqueSellingPoints: ['AI-powered', 'seamless integration'],
      },
    },
    category: 'Software',
    priceRange: {
      min: 20,
      max: 100,
    },
  },
];
