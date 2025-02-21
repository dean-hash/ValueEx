export interface GrowthRate {
    day: number;
    week: number;
    month: number;
}
export interface Engagement {
    depth: number;
    breadth: number;
    consistency: number;
}
export interface MarketValidation {
    realDemand: number;
    problemSolution: number;
    marketFit: number;
}
export interface TrendMetrics {
    organicGrowth: number;
    sustainedInterest: boolean;
    realWorldImpact: boolean;
    growthRate: GrowthRate;
    engagement: Engagement;
    marketValidation: MarketValidation;
    sentiment?: number;
}
export interface TrendSignal {
    timestamp: string;
    value: number;
    source: string;
    keywords: string[];
    confidence: number;
}
export interface TrendSignalStrength {
    source: string;
    strength: number;
    keywords: string[];
}
export interface MarketTrend {
    category: string;
    region: string;
    trend: number;
    velocity: number;
    sentiment?: number;
    strength: number;
    signals: TrendSignalStrength[];
}
export interface DataPointMetadata {
    source: string;
    confidence?: number;
    category?: string;
    region?: string;
    tags?: string[];
    correlations?: {
        strength: number;
        signal: string;
    }[];
}
export interface DataPoint {
    timestamp: number;
    value: number;
    volume: number;
    engagement: number;
    sentiment?: number;
    source: string;
    keywords: string[];
    metadata?: DataPointMetadata;
}
