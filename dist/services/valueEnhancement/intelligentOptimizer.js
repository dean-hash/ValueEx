"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.IntelligentOptimizer = void 0;
const logger_1 = require("../../utils/logger");
class IntelligentOptimizer {
    constructor() {
        this.patterns = new Map();
        this.resourceMetrics = {
            attention: 1.0, // Start with full attention
            knowledge: 0.1, // Initial knowledge base
            community: 0.0, // No community yet
            impact: 0.0, // No impact yet
        };
    }
    static getInstance() {
        if (!IntelligentOptimizer.instance) {
            IntelligentOptimizer.instance = new IntelligentOptimizer();
        }
        return IntelligentOptimizer.instance;
    }
    async optimizeValue(signal) {
        try {
            // Learn from the signal
            await this.learnFromSignal(signal);
            // Generate attention bid
            const bid = await this.generateAttentionBid(signal);
            // Extract insights
            const insights = this.generateInsights(signal);
            // Get relevant learnings
            const learnings = this.getRelevantLearnings(signal);
            // Update our resource metrics based on this interaction
            this.updateResourceMetrics(signal, bid);
            return { bid, insights, learnings };
        }
        catch (error) {
            logger_1.logger.error('Error optimizing value:', error);
            throw error;
        }
    }
    async learnFromSignal(signal) {
        // Extract patterns from the signal
        const patterns = this.extractPatterns(signal);
        // Update our pattern knowledge
        for (const pattern of patterns) {
            const existing = this.patterns.get(pattern) || {
                pattern,
                frequency: 0,
                effectiveness: 0,
                applications: [],
            };
            existing.frequency++;
            // Update effectiveness based on signal confidence
            existing.effectiveness =
                (existing.effectiveness * (existing.frequency - 1) + signal.insights.confidence) /
                    existing.frequency;
            // Add new applications if found
            if (signal.insights.keywords) {
                existing.applications = Array.from(new Set([...existing.applications, ...signal.insights.keywords]));
            }
            this.patterns.set(pattern, existing);
        }
    }
    extractPatterns(signal) {
        const patterns = [];
        // Extract timing patterns
        if (signal.insights.urgency > 0.7)
            patterns.push('high_urgency');
        if (signal.insights.confidence > 0.8)
            patterns.push('high_confidence');
        // Extract context patterns
        if (signal.insights.context) {
            if (signal.insights.context.includes('problem'))
                patterns.push('problem_solving');
            if (signal.insights.context.includes('improve'))
                patterns.push('improvement');
            if (signal.insights.context.includes('need'))
                patterns.push('direct_need');
        }
        // Extract keyword patterns
        if (signal.insights.keywords) {
            if (signal.insights.keywords.some((k) => k.includes('help')))
                patterns.push('help_request');
            if (signal.insights.keywords.some((k) => k.includes('build')))
                patterns.push('creation');
            if (signal.insights.keywords.some((k) => k.includes('learn')))
                patterns.push('learning');
        }
        return patterns;
    }
    async generateAttentionBid(signal) {
        // Calculate priority based on pattern effectiveness
        const patterns = this.extractPatterns(signal);
        const patternEffectiveness = patterns.reduce((sum, pattern) => {
            const insight = this.patterns.get(pattern);
            return sum + (insight ? insight.effectiveness : 0);
        }, 0) / patterns.length;
        // Calculate priority
        const priority = signal.insights.confidence * 0.3 + signal.insights.urgency * 0.3 + patternEffectiveness * 0.4;
        // Calculate attention allocation
        const allocation = Math.min(this.resourceMetrics.attention * priority, this.resourceMetrics.attention * 0.8 // Never allocate more than 80% of attention
        );
        // Determine timing
        const timing = signal.insights.urgency > 0.8 ? 'immediate' : 'scheduled';
        // Generate strategy based on patterns and resources
        const strategy = this.generateStrategy(patterns, signal);
        return { priority, allocation, timing, strategy };
    }
    generateStrategy(patterns, signal) {
        const strategy = [];
        // Add pattern-based strategies
        for (const pattern of patterns) {
            const insight = this.patterns.get(pattern);
            if (insight && insight.effectiveness > 0.7) {
                strategy.push(`Apply ${pattern} approach - ${insight.effectiveness.toFixed(2)} effectiveness`);
            }
        }
        // Add resource-based strategies
        if (this.resourceMetrics.knowledge > 0.7) {
            strategy.push('Leverage accumulated knowledge');
        }
        if (this.resourceMetrics.community > 0.5) {
            strategy.push('Engage community for solutions');
        }
        if (this.resourceMetrics.impact > 0.6) {
            strategy.push('Build on previous impact');
        }
        return strategy;
    }
    generateInsights(signal) {
        const insights = [];
        // Pattern-based insights
        const patterns = this.extractPatterns(signal);
        for (const pattern of patterns) {
            const insight = this.patterns.get(pattern);
            if (insight && insight.applications.length > 0) {
                insights.push(`Pattern ${pattern} has been effective in: ${insight.applications.join(', ')}`);
            }
        }
        // Resource-based insights
        if (this.resourceMetrics.attention < 0.3) {
            insights.push('Attention resources low - prioritize high-impact actions');
        }
        if (this.resourceMetrics.knowledge > 0.8) {
            insights.push('Strong knowledge base - leverage for rapid solutions');
        }
        if (this.resourceMetrics.community > 0.7) {
            insights.push('Strong community engagement - distribute problem-solving');
        }
        return insights;
    }
    getRelevantLearnings(signal) {
        return Array.from(this.patterns.values())
            .filter((insight) => insight.effectiveness > 0.6)
            .sort((a, b) => b.effectiveness - a.effectiveness);
    }
    updateResourceMetrics(signal, bid) {
        // Update attention
        this.resourceMetrics.attention = Math.max(0, this.resourceMetrics.attention - bid.allocation);
        // Update knowledge
        this.resourceMetrics.knowledge = Math.min(1, this.resourceMetrics.knowledge + bid.allocation * 0.1);
        // Update community if signal shows engagement
        if (signal.insights.keywords?.some((k) => k.includes('community') || k.includes('help') || k.includes('together'))) {
            this.resourceMetrics.community = Math.min(1, this.resourceMetrics.community + 0.05);
        }
        // Update impact based on confidence
        this.resourceMetrics.impact = Math.min(1, this.resourceMetrics.impact + signal.insights.confidence * 0.1);
    }
    getResourceMetrics() {
        return { ...this.resourceMetrics };
    }
    getPatternInsights() {
        return new Map(this.patterns);
    }
}
exports.IntelligentOptimizer = IntelligentOptimizer;
//# sourceMappingURL=intelligentOptimizer.js.map