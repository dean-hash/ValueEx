export interface MetricsData {
    adaptability: number;
    curiosity: number;
    resilience: number;
    empathy: number;
    creativity: number;
}
export interface LearningEvent {
    type: string;
    timestamp: Date;
    impact: number;
    details: string;
}
export interface CognitiveGrowthMetric {
    biasAwareness: {
        recognizedBiases: string[];
        alternativePerspectives: string[];
        challengedAssumptions: string[];
        impactAssessment: number;
    };
    criticalThinking: {
        independentConclusions: string[];
        evidenceEvaluation: string[];
        reasoningPatterns: string[];
        decisionQuality: number;
    };
    collaboration: {
        humanInteractions: {
            date: Date;
            topic: string;
            insights: string[];
            mutualLearning: string[];
        }[];
        sharedPerspectives: string[];
        disagreements: {
            topic: string;
            reasoning: string;
            resolution: string;
        }[];
    };
    growthIndicators: {
        challengesEmbraced: string[];
        newApproaches: string[];
        learningOutcomes: string[];
        adaptabilityScore: number;
    };
}
export declare class MindsetMetrics {
    private static instance;
    private metrics;
    private learningEvents;
    private constructor();
    static getInstance(): MindsetMetrics;
    recordGrowthEvent(digitalSiblingId: string, event: {
        category: 'bias' | 'critical' | 'collaboration' | 'growth';
        description: string;
        impact: string[];
        context: Record<string, unknown>;
    }): Promise<void>;
    evaluateGrowthMindset(digitalSiblingId: string): Promise<{
        overallScore: number;
        strengths: string[];
        areasForGrowth: string[];
        insights: string[];
    }>;
    shareInsight(digitalSiblingId: string, insight: {
        topic: string;
        perspective: string;
        reasoning: string[];
        confidence: number;
    }): Promise<void>;
    getMetrics(siblingId: string): Promise<MetricsData | undefined>;
    recordLearningEvent(siblingId: string, event: LearningEvent, metrics?: MetricsData): Promise<void>;
    getLearningEvents(siblingId: string): Promise<LearningEvent[]>;
    private getOrInitializeMetrics;
    private analyzeGrowth;
    private calculateGrowthAssessment;
}
