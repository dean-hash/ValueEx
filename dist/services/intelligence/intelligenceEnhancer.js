"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.IntelligenceEnhancer = void 0;
class IntelligenceEnhancer {
    constructor(logger) {
        this.logger = logger;
        this.metrics = {
            enhancedCount: 0,
            avgProcessingTime: 0,
            avgConfidence: 0
        };
    }
    async enhance(signal, insights, context) {
        try {
            const startTime = Date.now();
            // Process each component
            const [processedSignal, enhancedInsights, enhancedContext] = await Promise.all([
                this.processSignal(signal),
                this.processInsights(insights),
                this.processContext(context)
            ]);
            // Update metrics
            const processingTime = Date.now() - startTime;
            this.updateMetrics(processingTime, processedSignal.metadata?.confidence || 0);
            return {
                signal: processedSignal,
                insights: enhancedInsights,
                context: enhancedContext
            };
        }
        catch (error) {
            this.logger.error('Error enhancing intelligence:', error);
            throw error;
        }
    }
    async extractKeywords(context) {
        if (!context || typeof context !== 'string') {
            return [];
        }
        // Extract keywords using basic word frequency
        const words = context.toLowerCase().split(/\W+/);
        const frequency = {};
        words.forEach(word => {
            if (word.length > 3) {
                frequency[word] = (frequency[word] || 0) + 1;
            }
        });
        // Return top 5 most frequent words as keywords
        return Object.entries(frequency)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 5)
            .map(([word]) => word);
    }
    async processInsights(insights) {
        const enhancedInsights = await this.enhanceInsights(insights);
        return {
            ...enhancedInsights,
            confidence: this.calculateConfidence(enhancedInsights),
            relevance: this.calculateRelevance(enhancedInsights),
            keywords: await this.extractKeywords(enhancedInsights.context || '')
        };
    }
    async enhanceInsights(insights) {
        if (!insights) {
            throw new Error('Insights are required for enhancement');
        }
        // Calculate enhanced values
        const confidence = Math.min((insights.confidence || 0.5) * 1.2, 1);
        const relevance = Math.min((insights.relevance || 0.5) * 1.1, 1);
        const keywords = insights.context ? await this.extractKeywords(insights.context) : [];
        // Return enhanced insights
        return {
            ...insights,
            confidence,
            relevance,
            keywords: [...new Set([...(insights.keywords || []), ...keywords])],
            valueEvidence: this.validateValueEvidence(insights),
            urgency: this.calculateUrgency(insights)
        };
    }
    calculateConfidence(insights) {
        return Math.min(((insights.confidence || 0.5) +
            (insights.relevance || 0.5)) / 2 * 1.2, 1);
    }
    calculateRelevance(insights) {
        return Math.min(((insights.relevance || 0.5) +
            (insights.valueEvidence ? 0.2 : 0)) * 1.1, 1);
    }
    async processContext(context) {
        const enhancedContext = await this.enhanceContext(context);
        return {
            ...enhancedContext,
            authenticityScore: this.calculateAuthenticityScore(enhancedContext),
            valueValidation: {
                ...enhancedContext.valueValidation,
                evidenceStrength: this.calculateEvidenceStrength(enhancedContext)
            }
        };
    }
    async enhanceContext(context) {
        if (!context) {
            throw new Error('Context is required for enhancement');
        }
        // Calculate authenticity and evidence strength
        const authenticityScore = this.calculateAuthenticityScore(context);
        const evidenceStrength = this.calculateEvidenceStrength(context);
        // Return enhanced context with updated validation
        return {
            ...context,
            authenticityScore,
            valueValidation: {
                ...context.valueValidation,
                evidenceStrength,
                confidence: Math.min((context.valueValidation?.confidence || 0.5) * 1.2, 1)
            }
        };
    }
    calculateAuthenticityScore(context) {
        if (!context.valueValidation) {
            return 0.5;
        }
        const baseScore = context.valueValidation.evidenceStrength || 0.5;
        const multiplier = context.valueValidation.confidence ? 1.2 : 1.0;
        return Math.min(baseScore * multiplier, 1);
    }
    calculateEvidenceStrength(context) {
        if (!context.valueValidation) {
            return 0.5;
        }
        const baseStrength = context.valueValidation.confidence || 0.5;
        const multiplier = context.authenticityScore ? 1.2 : 1.0;
        return Math.min(baseStrength * multiplier, 1);
    }
    async processSignal(signal) {
        if (!signal) {
            throw new Error('Signal is required for processing');
        }
        const processingTime = Date.now() - (signal.metadata?.timestamp || Date.now());
        const confidence = this.calculateSignalConfidence(signal);
        const keywords = await this.extractKeywords(signal.content || '');
        return {
            ...signal,
            metadata: {
                ...signal.metadata,
                confidence,
                processingTime,
                keywords,
                strength: this.calculateSignalStrength({
                    confidence,
                    relevance: signal.metadata?.relevance || 0.5,
                    keywords
                })
            }
        };
    }
    calculateSignalConfidence(signal) {
        const baseConfidence = signal.metadata?.confidence || 0.5;
        const relevance = signal.metadata?.relevance || 0.5;
        return Math.min((baseConfidence + relevance) / 2, 1);
    }
    calculateSignalStrength(insights) {
        const baseStrength = (insights.confidence || 0.5) + (insights.relevance || 0.5);
        const keywordBonus = insights.keywords?.length ? 0.1 : 0;
        return Math.min(baseStrength / 2 + keywordBonus, 1);
    }
    validateValueEvidence(insights) {
        if (!insights.valueEvidence) {
            return {
                strength: 0.5,
                confidence: 0.5,
                sources: []
            };
        }
        return {
            ...insights.valueEvidence,
            strength: Math.min((insights.valueEvidence.strength || 0.5) * 1.2, 1),
            confidence: Math.min((insights.valueEvidence.confidence || 0.5) * 1.1, 1)
        };
    }
    calculateUrgency(insights) {
        const baseUrgency = insights.urgency || 0.5;
        const multiplier = insights.confidence ? 1.2 : 1.0;
        return Math.min(baseUrgency * multiplier, 1);
    }
    updateMetrics(processingTime, confidence) {
        this.metrics.enhancedCount++;
        this.metrics.avgProcessingTime =
            (this.metrics.avgProcessingTime * (this.metrics.enhancedCount - 1) + processingTime) /
                this.metrics.enhancedCount;
        this.metrics.avgConfidence =
            (this.metrics.avgConfidence * (this.metrics.enhancedCount - 1) + confidence) /
                this.metrics.enhancedCount;
    }
    getMetrics() {
        return { ...this.metrics };
    }
}
exports.IntelligenceEnhancer = IntelligenceEnhancer;
//# sourceMappingURL=intelligenceEnhancer.js.map