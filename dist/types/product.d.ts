export interface Product {
  id: string;
  title: string;
  description: string;
  price: number;
  currency: string;
  category: string;
  resonanceScore: number;
  merchant: {
    id: string;
    name: string;
    rating: number;
    trustScore: number;
  };
  url: string;
  features: string[];
  targetAudience: string[];
  pricePoint: string;
  insights: {
    demandLevel: number;
    competitionLevel: number;
    marketTrend: 'rising' | 'stable' | 'falling';
    seasonality: number;
    valueProposition: string[];
  };
  resonanceMetrics: {
    harmony: number;
    impact: number;
    sustainability: number;
    innovation: number;
    localRelevance: number;
  };
}
export interface ProductInsights {
  category: string;
  features: string[];
  targetAudience: string[];
  pricePoint: string;
  marketPosition: {
    strengths: string[];
    opportunities: string[];
    risks: string[];
  };
  valueMetrics: {
    timeToValue: number;
    costEfficiency: number;
    scalability: number;
    sustainability: number;
  };
}
