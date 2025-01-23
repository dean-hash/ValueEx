import { DemandSignal, ValuePattern, MatchRecommendation } from '../types';
/**
 * ValueSignalProcessor
 *
 * Core engine for processing value signals and identifying authentic value connections.
 * Focuses on removing exploitative practices and fostering genuine value exchange.
 */
export declare class ValueSignalProcessor {
    private signals;
    private patterns;
    /**
     * Process an incoming value signal
     * @param signal Raw demand signal
     * @returns Processed signal with authenticity metrics
     */
    processSignal(signal: DemandSignal): Promise<DemandSignal>;
    /**
     * Enrich signal with authenticity metrics and value indicators
     */
    private enrichSignal;
    /**
     * Measure how organic/authentic a signal is vs. manufactured demand
     */
    private measureOrganicNature;
    /**
     * Analyze value patterns across signals
     */
    private updatePatterns;
    /**
     * Find potential matches that maximize authentic value exchange
     */
    findValueMatches(signal: DemandSignal): Promise<MatchRecommendation[]>;
    /**
     * Calculate comprehensive value score for a potential match
     */
    private calculateValueScore;
    /**
     * Predict future value patterns and opportunities
     */
    predictValueTrends(): Promise<ValuePattern[]>;
    private isRecent;
    private checkTemporalPatterns;
    private analyzeRequirementCoherence;
    private evaluateConstraintRealism;
    private findFeaturePatterns;
    private analyzeValueDistribution;
    private detectTemporalTrends;
    private searchPotentialMatches;
    private enrichMatchWithValueMetrics;
    private isAuthenticMatch;
    private assessFeatureAlignment;
    private evaluateConstraintSatisfaction;
    private calculateMutualBenefit;
    private assessLongTermValue;
    private analyzeHistoricalPatterns;
    private identifyEmergingTrends;
    private forecastOpportunities;
    private synthesizePredictions;
}
