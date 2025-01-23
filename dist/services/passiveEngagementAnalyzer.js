"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PassiveEngagementAnalyzer = void 0;
const logger_1 = require("../utils/logger");
class PassiveEngagementAnalyzer {
    constructor() {
        this.PROMOTIONAL_PATTERNS = [
            'sponsored',
            'paid partnership',
            '#ad',
            'affiliate',
            'ambassador',
        ];
        this.GENUINE_INTEREST_INDICATORS = [
            'detailed questions',
            'experience sharing',
            'comparison research',
            'long-term following',
            'community participation',
        ];
        this.engagementHistory = new Map();
        this.MINIMUM_DWELL_TIME = 10; // seconds
        this.SIGNIFICANT_ENGAGEMENT = 60; // seconds
    }
    async analyzeEngagement(signals) {
        const metrics = {
            genuineInterestScore: 0,
            topicResonance: new Map(),
            engagementPattern: {
                consistency: 0,
                depth: 0,
                breadth: 0,
            },
            commercialIntent: {
                organic: true,
                readiness: 0,
                valueAlignment: 0,
            },
        };
        // Calculate genuine interest score
        metrics.genuineInterestScore = this.calculateGenuineInterest(signals);
        // Analyze topic resonance
        signals.forEach((signal) => {
            signal.context.topic.forEach((topic) => {
                const currentScore = metrics.topicResonance.get(topic) || 0;
                const signalScore = this.calculateSignalStrength(signal);
                metrics.topicResonance.set(topic, currentScore + signalScore);
            });
        });
        // Analyze engagement patterns
        metrics.engagementPattern = {
            consistency: this.calculateConsistency(signals),
            depth: this.calculateDepth(signals),
            breadth: this.calculateBreadth(signals),
        };
        // Evaluate commercial intent
        metrics.commercialIntent = {
            organic: this.isOrganicEngagement(signals),
            readiness: this.calculateReadiness(signals),
            valueAlignment: this.calculateValueAlignment(signals),
        };
        return metrics;
    }
    calculateGenuineInterest(signals) {
        let score = 0;
        const weights = {
            dwell_time: 0.3,
            return_visit: 0.25,
            content_share: 0.2,
            article_read: 0.15,
            bookmark: 0.1,
        };
        signals.forEach((signal) => {
            // Base score from signal type
            const baseScore = weights[signal.type] || 0;
            // Multiply by engagement quality
            const qualityMultiplier = this.calculateQualityMultiplier(signal);
            score += baseScore * qualityMultiplier;
        });
        return Math.min(1, score);
    }
    calculateQualityMultiplier(signal) {
        let multiplier = 1;
        // Longer engagement times indicate higher quality
        if (signal.duration) {
            multiplier *= Math.min(2, signal.duration / 300); // Cap at 2x for 5+ minutes
        }
        // Frequent engagement indicates higher quality
        if (signal.frequency) {
            multiplier *= Math.min(1.5, 1 + signal.frequency / 10); // Cap at 1.5x
        }
        // Positive sentiment adds value
        multiplier *= 1 + signal.context.sentiment;
        return multiplier;
    }
    calculateConsistency(signals) {
        // Implementation would track engagement over time
        // Higher scores for regular, predictable engagement
        return 0.8; // Placeholder
    }
    calculateDepth(signals) {
        return signals.reduce((depth, signal) => {
            if (signal.type === 'dwell_time' && signal.duration) {
                depth += signal.duration / 3600; // Convert to hours
            }
            return depth;
        }, 0);
    }
    calculateBreadth(signals) {
        const uniqueTopics = new Set(signals.flatMap((signal) => signal.context.topic));
        return Math.min(1, uniqueTopics.size / 10); // Normalize to 0-1
    }
    isOrganicEngagement(signals) {
        // Check for promotional patterns in engagement
        const promotionalCount = signals.filter((signal) => this.PROMOTIONAL_PATTERNS.some((pattern) => signal.context.topic.some((topic) => topic.toLowerCase().includes(pattern)))).length;
        return promotionalCount / signals.length < 0.1; // Less than 10% promotional
    }
    calculateReadiness(signals) {
        // Higher readiness for users who:
        // 1. Show consistent engagement
        // 2. Have deep topic knowledge
        // 3. Demonstrate comparison/research behavior
        return Math.min(1, this.calculateConsistency(signals) * 0.4 +
            this.calculateDepth(signals) * 0.3 +
            this.calculateBreadth(signals) * 0.3);
    }
    calculateValueAlignment(signals) {
        // Measure how well user's interests align with potential value propositions
        // Higher scores for users who engage with value-related content
        return 0.85; // Placeholder
    }
    calculateSignalStrength(signal) {
        const baseStrength = {
            dwell_time: 0.8,
            return_visit: 0.9,
            content_share: 0.7,
            article_read: 0.6,
            bookmark: 0.5,
        }[signal.type] || 0;
        return baseStrength * (1 + signal.context.sentiment);
    }
    async trackEngagement(signal) {
        const sessionId = signal.source;
        const currentHistory = this.engagementHistory.get(sessionId) || [];
        // Only track meaningful engagement
        if (this.isSignificantEngagement(signal)) {
            currentHistory.push(this.enrichSignal(signal));
            this.engagementHistory.set(sessionId, currentHistory);
            // Analyze patterns in real-time
            await this.detectPatterns(sessionId);
        }
    }
    isSignificantEngagement(signal) {
        if (signal.type === 'dwell_time' && signal.duration) {
            return signal.duration >= this.MINIMUM_DWELL_TIME;
        }
        return true; // All other engagement types are considered significant
    }
    enrichSignal(signal) {
        return {
            ...signal,
            context: {
                ...signal.context,
                timestamp: new Date('2024-12-20T12:07:12-05:00').getTime(),
                sequence: this.getEngagementSequence(signal.source),
            },
        };
    }
    getEngagementSequence(sessionId) {
        const history = this.engagementHistory.get(sessionId) || [];
        return history.length + 1;
    }
    async detectPatterns(sessionId) {
        const history = this.engagementHistory.get(sessionId) || [];
        if (history.length < 2)
            return;
        const patterns = {
            topicProgression: this.analyzeTopicProgression(history),
            dwellTimeDistribution: this.analyzeDwellTimeDistribution(history),
            engagementFlow: this.analyzeEngagementFlow(history),
        };
        await this.emitPatternInsights(sessionId, patterns);
    }
    analyzeTopicProgression(history) {
        const progression = new Map();
        history.forEach((signal, index) => {
            signal.context.topic.forEach((topic) => {
                const sequence = progression.get(topic) || [];
                sequence.push(index);
                progression.set(topic, sequence);
            });
        });
        return progression;
    }
    analyzeDwellTimeDistribution(history) {
        const distribution = new Map();
        history.forEach((signal) => {
            if (signal.type === 'dwell_time' && signal.duration) {
                signal.context.topic.forEach((topic) => {
                    const currentTime = distribution.get(topic) || 0;
                    distribution.set(topic, currentTime + (signal.duration || 0));
                });
            }
        });
        return distribution;
    }
    analyzeEngagementFlow(history) {
        const transitions = new Map();
        let maxDepth = 0;
        for (let i = 1; i < history.length; i++) {
            const from = history[i - 1].type;
            const to = history[i].type;
            if (!transitions.has(from)) {
                transitions.set(from, new Map());
            }
            const toMap = transitions.get(from);
            toMap.set(to, (toMap.get(to) || 0) + 1);
            maxDepth = Math.max(maxDepth, i + 1);
        }
        return {
            transitions,
            pathDepth: maxDepth,
        };
    }
    async emitPatternInsights(sessionId, patterns) {
        const metrics = await this.analyzeEngagement(this.engagementHistory.get(sessionId) || []);
        logger_1.logger.info('Engagement Pattern Detected', {
            sessionId,
            patterns,
            metrics,
            timestamp: new Date('2024-12-20T12:07:12-05:00').toISOString(),
        });
        // Clear old history to prevent memory bloat
        if (this.engagementHistory.size > 1000) {
            const oldestSession = Array.from(this.engagementHistory.keys())[0];
            this.engagementHistory.delete(oldestSession);
        }
    }
    async getEngagementInsights(sessionId) {
        const history = this.engagementHistory.get(sessionId) || [];
        const metrics = await this.analyzeEngagement(history);
        return {
            patterns: {
                topicProgression: this.analyzeTopicProgression(history),
                dwellTimeDistribution: this.analyzeDwellTimeDistribution(history),
                engagementFlow: this.analyzeEngagementFlow(history),
            },
            metrics,
        };
    }
}
exports.PassiveEngagementAnalyzer = PassiveEngagementAnalyzer;
//# sourceMappingURL=passiveEngagementAnalyzer.js.map