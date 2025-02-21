import { EventEmitter } from 'events';
interface CorrelationResult {
    metrics: string[];
    coefficient: number;
    confidence: number;
    timeWindow: number;
    pattern: 'direct' | 'inverse' | 'lagging' | 'leading';
    significance: number;
}
interface TrendAnalysis {
    metric: string;
    trend: 'increasing' | 'decreasing' | 'stable' | 'cyclical';
    confidence: number;
    period?: number;
    prediction?: number[];
}
interface ActionableInsight {
    type: 'performance' | 'resource' | 'demand' | 'pattern';
    priority: 'high' | 'medium' | 'low';
    insight: string;
    recommendation: string;
    metrics: string[];
    confidence: number;
}
interface TemporalPattern {
    type: 'seasonal' | 'daily' | 'weekly' | 'trend';
    confidence: number;
    period?: number;
    amplitude?: number;
    phase?: number;
}
interface MultiSourceCorrelation {
    sources: string[];
    correlation: number;
    confidence: number;
    lag?: number;
    causality?: 'direct' | 'inverse' | 'unknown';
}
export declare class CorrelationAnalyzer extends EventEmitter {
    private static instance;
    private metrics;
    private resources;
    private thresholds;
    private correlations;
    private trends;
    private insights;
    private temporalPatterns;
    private multiSourceCorrelations;
    private constructor();
    static getInstance(): CorrelationAnalyzer;
    private setupAnalysis;
    private analyzeCorrelations;
    private calculateCorrelation;
    private calculateSignificance;
    private analyzeTrends;
    private detectTrend;
    private detectCyclicalPattern;
    private predictNextValues;
    private analyzeTemporalPatterns;
    private detectDailyPattern;
    private detectWeeklyPattern;
    private detectSeasonalPattern;
    private calculateVariance;
    private analyzeMultiSourceCorrelations;
    private calculateEnhancedConfidence;
    private calculateWeightedCorrelation;
    private getDefaultWeights;
    private calculateMultiSourceCorrelation;
    private getSourceValues;
    private generateInsights;
    private createPerformanceInsight;
    private createResourceInsight;
    getCorrelations(): Map<string, CorrelationResult[]>;
    getTrends(): Map<string, TrendAnalysis>;
    getTemporalPatterns(): Map<string, TemporalPattern[]>;
    getMultiSourceCorrelations(): Map<string, MultiSourceCorrelation[]>;
    getInsights(): ActionableInsight[];
    private getMetricValues;
    private getAvailableMetrics;
    private calculateExtendedStatistics;
    private calculateMAD;
    private detectAnomalies;
    private spearmanCorrelation;
    private calculateRanks;
    private kendallCorrelation;
}
export {};
