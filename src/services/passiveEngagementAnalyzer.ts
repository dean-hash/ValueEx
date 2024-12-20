import { SignalDimension, EmergentContext } from './demandPrecognition';
import { logger } from '../utils/logger';

interface EngagementSignal {
    type: 'article_read' | 'content_share' | 'bookmark' | 'return_visit' | 'dwell_time';
    source: string;
    duration?: number;  // in seconds
    frequency?: number; // number of occurrences
    context: {
        category: string;
        topic: string[];
        sentiment: number;  // -1 to 1
    };
}

interface PassiveEngagementMetrics {
    genuineInterestScore: number;  // 0 to 1
    topicResonance: Map<string, number>;
    engagementPattern: {
        consistency: number;    // How regular is their engagement
        depth: number;         // How deeply they engage (time spent, etc.)
        breadth: number;       // Variety of related topics engaged with
    };
    commercialIntent: {
        organic: boolean;      // Is this likely organic interest vs. paid/promotional
        readiness: number;     // How likely they are to respond to offers
        valueAlignment: number; // How well they align with value propositions
    };
}

export class PassiveEngagementAnalyzer {
    private readonly PROMOTIONAL_PATTERNS = [
        'sponsored',
        'paid partnership',
        '#ad',
        'affiliate',
        'ambassador'
    ];

    private readonly GENUINE_INTEREST_INDICATORS = [
        'detailed questions',
        'experience sharing',
        'comparison research',
        'long-term following',
        'community participation'
    ];

    async analyzeEngagement(signals: EngagementSignal[]): Promise<PassiveEngagementMetrics> {
        const metrics: PassiveEngagementMetrics = {
            genuineInterestScore: 0,
            topicResonance: new Map(),
            engagementPattern: {
                consistency: 0,
                depth: 0,
                breadth: 0
            },
            commercialIntent: {
                organic: true,
                readiness: 0,
                valueAlignment: 0
            }
        };

        // Calculate genuine interest score
        metrics.genuineInterestScore = this.calculateGenuineInterest(signals);

        // Analyze topic resonance
        signals.forEach(signal => {
            signal.context.topic.forEach(topic => {
                const currentScore = metrics.topicResonance.get(topic) || 0;
                const signalScore = this.calculateSignalStrength(signal);
                metrics.topicResonance.set(topic, currentScore + signalScore);
            });
        });

        // Analyze engagement patterns
        metrics.engagementPattern = {
            consistency: this.calculateConsistency(signals),
            depth: this.calculateDepth(signals),
            breadth: this.calculateBreadth(signals)
        };

        // Evaluate commercial intent
        metrics.commercialIntent = {
            organic: this.isOrganicEngagement(signals),
            readiness: this.calculateReadiness(signals),
            valueAlignment: this.calculateValueAlignment(signals)
        };

        return metrics;
    }

    private calculateGenuineInterest(signals: EngagementSignal[]): number {
        let score = 0;
        const weights = {
            dwell_time: 0.3,
            return_visit: 0.25,
            content_share: 0.2,
            article_read: 0.15,
            bookmark: 0.1
        };

        signals.forEach(signal => {
            // Base score from signal type
            const baseScore = weights[signal.type] || 0;

            // Multiply by engagement quality
            const qualityMultiplier = this.calculateQualityMultiplier(signal);

            score += baseScore * qualityMultiplier;
        });

        return Math.min(1, score);
    }

    private calculateQualityMultiplier(signal: EngagementSignal): number {
        let multiplier = 1;

        // Longer engagement times indicate higher quality
        if (signal.duration) {
            multiplier *= Math.min(2, signal.duration / 300); // Cap at 2x for 5+ minutes
        }

        // Frequent engagement indicates higher quality
        if (signal.frequency) {
            multiplier *= Math.min(1.5, 1 + (signal.frequency / 10)); // Cap at 1.5x
        }

        // Positive sentiment adds value
        multiplier *= (1 + signal.context.sentiment);

        return multiplier;
    }

    private calculateConsistency(signals: EngagementSignal[]): number {
        // Implementation would track engagement over time
        // Higher scores for regular, predictable engagement
        return 0.8; // Placeholder
    }

    private calculateDepth(signals: EngagementSignal[]): number {
        return signals.reduce((depth, signal) => {
            if (signal.type === 'dwell_time' && signal.duration) {
                depth += signal.duration / 3600; // Convert to hours
            }
            return depth;
        }, 0);
    }

    private calculateBreadth(signals: EngagementSignal[]): number {
        const uniqueTopics = new Set(
            signals.flatMap(signal => signal.context.topic)
        );
        return Math.min(1, uniqueTopics.size / 10); // Normalize to 0-1
    }

    private isOrganicEngagement(signals: EngagementSignal[]): boolean {
        // Check for promotional patterns in engagement
        const promotionalCount = signals.filter(signal => 
            this.PROMOTIONAL_PATTERNS.some(pattern => 
                signal.context.topic.some(topic => 
                    topic.toLowerCase().includes(pattern)
                )
            )
        ).length;

        return promotionalCount / signals.length < 0.1; // Less than 10% promotional
    }

    private calculateReadiness(signals: EngagementSignal[]): number {
        // Higher readiness for users who:
        // 1. Show consistent engagement
        // 2. Have deep topic knowledge
        // 3. Demonstrate comparison/research behavior
        return Math.min(1, 
            (this.calculateConsistency(signals) * 0.4) +
            (this.calculateDepth(signals) * 0.3) +
            (this.calculateBreadth(signals) * 0.3)
        );
    }

    private calculateValueAlignment(signals: EngagementSignal[]): number {
        // Measure how well user's interests align with potential value propositions
        // Higher scores for users who engage with value-related content
        return 0.85; // Placeholder
    }

    private calculateSignalStrength(signal: EngagementSignal): number {
        const baseStrength = {
            dwell_time: 0.8,
            return_visit: 0.9,
            content_share: 0.7,
            article_read: 0.6,
            bookmark: 0.5
        }[signal.type] || 0;

        return baseStrength * (1 + signal.context.sentiment);
    }
}
