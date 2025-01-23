interface TestScenario {
    id: string;
    description: string;
    signals: Array<{
        type: 'article_read' | 'content_share' | 'bookmark' | 'return_visit' | 'dwell_time';
        source: string;
        duration?: number;
        context: {
            category: string;
            topic: string[];
            sentiment: number;
        };
    }>;
    expectedPatterns: {
        topicProgression?: string[];
        engagementDepth?: number;
        resonanceThreshold?: number;
    };
}
declare class ResonancePatternTest {
    private analyzer;
    private resonanceField;
    private precognition;
    private testResults;
    constructor();
    private readonly TEST_SCENARIOS;
    runTests(): Promise<void>;
    private runScenario;
    private calculateResonance;
    private analyzeResults;
    private analyzePatternEmergence;
    private calculateProgressionScore;
    private extractKeyPatterns;
    private identifyResonanceFactors;
}
export { ResonancePatternTest };
export type { TestScenario };
