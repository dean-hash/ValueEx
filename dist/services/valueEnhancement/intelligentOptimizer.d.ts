import { DemandSignal } from '../../types/mvp/demand';
interface AttentionBid {
    priority: number;
    allocation: number;
    timing: 'immediate' | 'scheduled';
    strategy: string[];
}
interface ResourceMetrics {
    attention: number;
    knowledge: number;
    community: number;
    impact: number;
}
interface OpportunityInsight {
    pattern: string;
    frequency: number;
    effectiveness: number;
    applications: string[];
}
export declare class IntelligentOptimizer {
    private static instance;
    private patterns;
    private resourceMetrics;
    private constructor();
    static getInstance(): IntelligentOptimizer;
    optimizeValue(signal: DemandSignal): Promise<{
        bid: AttentionBid;
        insights: string[];
        learnings: OpportunityInsight[];
    }>;
    private learnFromSignal;
    private extractPatterns;
    private generateAttentionBid;
    private generateStrategy;
    private generateInsights;
    private getRelevantLearnings;
    private updateResourceMetrics;
    getResourceMetrics(): ResourceMetrics;
    getPatternInsights(): Map<string, OpportunityInsight>;
}
export {};
