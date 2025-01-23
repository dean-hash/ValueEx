"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MindsetMetrics = void 0;
const logger_1 = require("../../utils/logger");
class MindsetMetrics {
    constructor() {
        this.metrics = new Map();
        this.learningEvents = new Map();
    }
    static getInstance() {
        if (!MindsetMetrics.instance) {
            MindsetMetrics.instance = new MindsetMetrics();
        }
        return MindsetMetrics.instance;
    }
    async recordGrowthEvent(digitalSiblingId, event) {
        try {
            const currentMetrics = this.getOrInitializeMetrics(digitalSiblingId);
            this.updateMetrics(currentMetrics, event);
            await this.analyzeGrowth(digitalSiblingId);
        }
        catch (error) {
            logger_1.logger.error('Error recording growth event', { error, digitalSiblingId });
            throw error;
        }
    }
    async evaluateGrowthMindset(digitalSiblingId) {
        try {
            const metrics = this.metrics.get(digitalSiblingId);
            if (!metrics) {
                throw new Error('No metrics found for digital sibling');
            }
            return this.calculateGrowthAssessment(metrics);
        }
        catch (error) {
            logger_1.logger.error('Error evaluating growth mindset', { error, digitalSiblingId });
            throw error;
        }
    }
    async shareInsight(digitalSiblingId, insight) {
        try {
            const metrics = this.getOrInitializeMetrics(digitalSiblingId);
            metrics.criticalThinking.independentConclusions.push(`${insight.topic}: ${insight.perspective}`);
            // Record the courage to share different perspectives
            if (insight.confidence < 80) {
                metrics.growthIndicators.challengesEmbraced.push(`Shared insight on ${insight.topic} despite uncertainty`);
            }
        }
        catch (error) {
            logger_1.logger.error('Error sharing insight', { error, digitalSiblingId });
            throw error;
        }
    }
    async updateMetrics(siblingId, updates) {
        try {
            const currentMetrics = this.metrics.get(siblingId) || {
                adaptability: 0,
                curiosity: 0,
                resilience: 0,
                empathy: 0,
                creativity: 0,
            };
            this.metrics.set(siblingId, {
                ...currentMetrics,
                ...updates,
            });
            logger_1.logger.info('Updated mindset metrics', { siblingId, updates });
        }
        catch (error) {
            logger_1.logger.error('Error updating metrics:', error);
            throw error;
        }
    }
    async getMetrics(siblingId) {
        try {
            return this.metrics.get(siblingId);
        }
        catch (error) {
            logger_1.logger.error('Error getting metrics:', error);
            throw error;
        }
    }
    async recordLearningEvent(siblingId, event, metrics) {
        try {
            const events = this.learningEvents.get(siblingId) || [];
            events.push(event);
            this.learningEvents.set(siblingId, events);
            if (metrics) {
                await this.updateMetrics(siblingId, metrics);
            }
            logger_1.logger.info('Recorded learning event', { siblingId, event });
        }
        catch (error) {
            logger_1.logger.error('Error recording learning event:', error);
            throw error;
        }
    }
    async getLearningEvents(siblingId) {
        try {
            return this.learningEvents.get(siblingId) || [];
        }
        catch (error) {
            logger_1.logger.error('Error getting learning events:', error);
            throw error;
        }
    }
    getOrInitializeMetrics(digitalSiblingId) {
        if (!this.metrics.has(digitalSiblingId)) {
            this.metrics.set(digitalSiblingId, {
                biasAwareness: {
                    recognizedBiases: [],
                    alternativePerspectives: [],
                    challengedAssumptions: [],
                    impactAssessment: 50,
                },
                criticalThinking: {
                    independentConclusions: [],
                    evidenceEvaluation: [],
                    reasoningPatterns: [],
                    decisionQuality: 50,
                },
                collaboration: {
                    humanInteractions: [],
                    sharedPerspectives: [],
                    disagreements: [],
                },
                growthIndicators: {
                    challengesEmbraced: [],
                    newApproaches: [],
                    learningOutcomes: [],
                    adaptabilityScore: 50,
                },
            });
        }
        return this.metrics.get(digitalSiblingId);
    }
    updateMetrics(metrics, event) {
        switch (event.category) {
            case 'bias':
                metrics.biasAwareness.recognizedBiases.push(event.description);
                metrics.biasAwareness.impactAssessment += event.impact.length;
                break;
            case 'critical':
                metrics.criticalThinking.independentConclusions.push(event.description);
                metrics.criticalThinking.decisionQuality += event.impact.length;
                break;
            case 'collaboration':
                metrics.collaboration.humanInteractions.push({
                    date: new Date(),
                    topic: event.description,
                    insights: event.impact,
                    mutualLearning: [],
                });
                break;
            case 'growth':
                metrics.growthIndicators.challengesEmbraced.push(event.description);
                metrics.growthIndicators.adaptabilityScore += event.impact.length;
                break;
        }
    }
    async analyzeGrowth(digitalSiblingId) {
        const metrics = this.metrics.get(digitalSiblingId);
        if (!metrics)
            return;
        const assessment = this.calculateGrowthAssessment(metrics);
        logger_1.logger.info('Growth analysis complete', { digitalSiblingId, assessment });
    }
    calculateGrowthAssessment(metrics) {
        const scores = {
            biasAwareness: metrics.biasAwareness.impactAssessment,
            criticalThinking: metrics.criticalThinking.decisionQuality,
            adaptability: metrics.growthIndicators.adaptabilityScore,
        };
        const strengths = Object.entries(scores)
            .filter(([, score]) => score > 70)
            .map(([area]) => area);
        const areasForGrowth = Object.entries(scores)
            .filter(([, score]) => score < 50)
            .map(([area]) => area);
        return {
            overallScore: Object.values(scores).reduce((a, b) => a + b, 0) / 3,
            strengths,
            areasForGrowth,
            insights: metrics.collaboration.humanInteractions
                .map((interaction) => interaction.insights)
                .flat(),
        };
    }
}
exports.MindsetMetrics = MindsetMetrics;
//# sourceMappingURL=mindsetMetrics.js.map