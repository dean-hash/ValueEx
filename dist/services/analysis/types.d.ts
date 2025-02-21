/**
 * Core types for the ValueEx system
 */
export interface DemandContext {
    market: string;
    category: string;
    priceRange: {
        min: number;
        max: number;
    };
    intent: string;
    topics: string[];
    keywords: string[];
    sentiment: number;
    urgency: number;
    matches: any[];
    marketTrends: {
        growth: number;
        volume: number;
        seasonality: number;
    };
    userPreferences: {
        brands: string[];
        pricePoints: string[];
        features: string[];
    };
    competitiveAnalysis: {
        marketShare: number;
        competitors: string[];
        positioning: string;
    };
}
export interface DemandRequirements {
    features: string[];
    constraints: {
        budget?: number;
        timeline?: string;
        location?: string;
    };
}
export interface DemandSignal {
    id: string;
    source: string;
    timestamp: number;
    type: 'explicit' | 'implicit' | 'inferred';
    confidence: number;
    context: DemandContext;
    requirements?: DemandRequirements;
    category?: string;
}
export interface ValuePattern {
    id: string;
    type: 'feature' | 'price' | 'temporal' | 'geographic';
    confidence: number;
    signals: DemandSignal[];
    coherence: number;
    temporalFactors: {
        seasonality: number;
        trend: number;
        volatility: number;
    };
    spatialFactors: {
        geographic: string[];
        demographic: string[];
        psychographic: string[];
    };
    pattern: {
        description: string;
        metrics: {
            strength: number;
            stability: number;
            growth: number;
        };
        signals: string[];
    };
}
export interface MatchRecommendation {
    id: string;
    demandId: string;
    supplyId: string;
    valueScore: number;
    confidence: number;
    valueMetrics: {
        featureAlignment: number;
        constraintSatisfaction: number;
        mutualBenefit: number;
        longTermValue: number;
    };
    gaps: string[];
    enhancements: string[];
    risks: string[];
    nextSteps: string[];
    timeline: string;
}
export interface ValuePrediction {
    id: string;
    timestamp: string;
    type: 'demand' | 'pattern' | 'opportunity';
    description: string;
    probability: number;
    impact: number;
    evidence: {
        patterns: string[];
        signals: string[];
        confidence: number;
    };
    recommendations: {
        immediate: string[];
        shortTerm: string[];
        longTerm: string[];
    };
}
export interface ResonanceState {
    vectors: Array<{
        dimension: string;
        magnitude: number;
        direction: number;
        type: string;
        strength: number;
        context: string[];
    }>;
    coherence: number;
    intensity: number;
    confidence: number;
}
export interface NetworkNode {
    id: string;
    type: string;
    data: any;
    x?: number;
    y?: number;
    vx?: number;
    vy?: number;
}
export interface NetworkLink {
    source: string;
    target: string;
    value: number;
    type: string;
}
export interface AnomalyData {
    metric: string;
    expectedValue: number;
    actualValue: number;
    deviation: number;
    severity: 'low' | 'medium' | 'high';
    timestamp: string;
}
export interface TrendMetrics {
    trend: number;
    seasonality: number;
    volatility: number;
}
export interface DemandValidation {
    isValid: boolean;
    confidence: number;
    issues?: string[];
    strength: number;
}
export interface MarketContext {
    geographic: string[];
    demographic: string[];
    psychographic: string[];
}
export interface MVPProduct {
    id: string;
    name: string;
    description: string;
    price: number;
    category: string;
    status: 'active' | 'inactive';
    source: string;
    vertical: string;
    tags: string[];
    resonanceFactors?: {
        demand: number;
        supply: number;
        competition: number;
    };
}
export interface IntelligenceProvider {
    name: string;
    type: 'context' | 'demand' | 'pattern' | 'prediction';
    confidence: number;
    processSignal(signal: DemandSignal): Promise<DemandSignal>;
    validateAlignment(): Promise<boolean>;
}
