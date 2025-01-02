/**
 * Core types for the ValueEx system
 */

export interface DemandSignal {
    id: string;
    category: string;
    subcategory?: string;
    timestamp: string;
    
    // Core requirements
    requirements: {
        features: string[];
        constraints: {
            priceRange?: {
                min: number;
                max: number;
                period?: string;
            };
            deployment?: string;
            availability?: string;
            support?: string;
        };
        volume?: {
            users?: string;
            transactions?: string;
            quantity?: number;
        };
    };

    // Location and urgency
    location?: string;
    urgency?: 'low' | 'medium' | 'high';

    // Authenticity metrics (added by processor)
    authenticity?: {
        organic: number;      // How natural/unmanufactured the demand is
        consistent: number;   // How consistent with observed patterns
        valuable: number;     // Potential for genuine value exchange
    };

    // Value metrics (added by processor)
    valueMetrics?: {
        utility: number;      // Practical usefulness
        sustainability: number; // Long-term viability
        fairness: number;     // Equitable value distribution
    };
}

export interface ValuePattern {
    id: string;
    type: 'feature' | 'price' | 'temporal' | 'geographic';
    confidence: number;
    
    // Pattern details
    pattern: {
        description: string;
        metrics: {
            strength: number;
            stability: number;
            growth: number;
        };
        signals: string[];  // IDs of contributing signals
    };

    // Value implications
    implications: {
        opportunities: string[];
        risks: string[];
        recommendations: string[];
    };

    // Temporal aspects
    emergence: string;    // When pattern first detected
    lastUpdated: string;  // Last time pattern was confirmed
    prediction: {
        trend: 'rising' | 'stable' | 'declining';
        confidence: number;
    };
}

export interface MatchRecommendation {
    id: string;
    demandId: string;    // ID of the demand signal
    supplyId: string;    // ID of the matching supply
    
    // Match quality
    valueScore: number;  // Overall value alignment score
    confidence: number;  // Confidence in the match
    
    // Value breakdown
    valueMetrics: {
        featureAlignment: number;
        constraintSatisfaction: number;
        mutualBenefit: number;
        longTermValue: number;
    };
    
    // Practical details
    gaps: string[];      // Any unmet requirements
    enhancements: string[]; // Potential improvements
    risks: string[];     // Potential risks to consider
    
    // Implementation
    nextSteps: string[]; // Recommended actions
    timeline: string;    // Estimated implementation timeline
}

export interface ValuePrediction {
    id: string;
    timestamp: string;
    
    // Prediction details
    prediction: {
        type: 'demand' | 'pattern' | 'opportunity';
        description: string;
        probability: number;
        impact: number;
    };
    
    // Supporting evidence
    evidence: {
        patterns: string[];    // Related pattern IDs
        signals: string[];     // Supporting signal IDs
        confidence: number;
    };
    
    // Actionable insights
    recommendations: {
        immediate: string[];
        shortTerm: string[];
        longTerm: string[];
    };
}
