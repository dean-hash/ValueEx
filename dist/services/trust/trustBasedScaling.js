"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TrustBasedScaling = void 0;
const events_1 = require("events");
const demandSignalAdapter_1 = require("../analysis/adapters/demandSignalAdapter");
const influenceAnalyzer_1 = require("../analysis/influenceAnalyzer");
class TrustBasedScaling extends events_1.EventEmitter {
    constructor() {
        super();
        this.trustScores = new Map();
        this.demandSignals = demandSignalAdapter_1.DemandSignalAdapter.getInstance();
        this.influenceAnalyzer = influenceAnalyzer_1.InfluenceAnalyzer.getInstance();
        this.initializeThresholds();
        this.setupEventListeners();
    }
    static getInstance() {
        if (!TrustBasedScaling.instance) {
            TrustBasedScaling.instance = new TrustBasedScaling();
        }
        return TrustBasedScaling.instance;
    }
    initializeThresholds() {
        this.thresholds = [
            {
                level: 1,
                minimumScore: 0,
                incomeMultiplier: 1,
                requirements: ['Initial interaction', 'Basic profile completion'],
            },
            {
                level: 2,
                minimumScore: 50,
                incomeMultiplier: 1.5,
                requirements: ['Consistent positive interactions', 'Demonstrated understanding'],
            },
            {
                level: 3,
                minimumScore: 75,
                incomeMultiplier: 2,
                requirements: ['High engagement quality', 'Positive impact evidence'],
            },
            {
                level: 4,
                minimumScore: 90,
                incomeMultiplier: 3,
                requirements: ['Exceptional trust level', 'Sustained positive impact'],
            },
        ];
    }
    setupEventListeners() {
        // Listen for relevant events that affect trust scores
        this.demandSignals.on('signalProcessed', (signal) => {
            this.updateTrustScore(signal.userId);
        });
    }
    async updateTrustScore(userId) {
        const currentMetrics = this.trustScores.get(userId) || this.initializeMetrics();
        const influence = await this.influenceAnalyzer.analyzeUserInfluence(userId);
        const newMetrics = {
            relationshipScore: this.calculateRelationshipScore(currentMetrics, influence),
            positiveImpact: this.calculatePositiveImpact(influence),
            consistencyScore: this.calculateConsistencyScore(currentMetrics, influence),
            growthRate: this.calculateGrowthRate(currentMetrics),
            lastUpdate: new Date(),
        };
        this.trustScores.set(userId, newMetrics);
        this.emit('trustScoreUpdated', { userId, metrics: newMetrics });
    }
    initializeMetrics() {
        return {
            relationshipScore: 0,
            positiveImpact: 0,
            consistencyScore: 0,
            growthRate: 0,
            lastUpdate: new Date(),
        };
    }
    calculateRelationshipScore(current, influence) {
        return Math.min(100, current.relationshipScore +
            influence.interactionQuality * 0.3 +
            influence.responseRate * 0.2 +
            influence.authenticContent * 0.5);
    }
    calculatePositiveImpact(influence) {
        return Math.min(100, influence.communityBenefit * 0.4 + influence.impactEvidence * 0.6);
    }
    calculateConsistencyScore(current, influence) {
        return Math.min(100, current.consistencyScore + influence.credibility * 0.4 + influence.transparentDisclosure * 0.6);
    }
    calculateGrowthRate(current) {
        const timeDiff = Date.now() - current.lastUpdate.getTime();
        const daysSinceUpdate = timeDiff / (1000 * 60 * 60 * 24);
        return Math.min(100, current.growthRate + daysSinceUpdate * 0.1);
    }
    getIncomeMultiplier(userId) {
        const metrics = this.trustScores.get(userId);
        if (!metrics)
            return 1;
        const totalScore = metrics.relationshipScore * 0.3 +
            metrics.positiveImpact * 0.3 +
            metrics.consistencyScore * 0.2 +
            metrics.growthRate * 0.2;
        const threshold = this.thresholds
            .slice()
            .reverse()
            .find((t) => totalScore >= t.minimumScore);
        return threshold ? threshold.incomeMultiplier : 1;
    }
    getTrustLevel(userId) {
        const metrics = this.trustScores.get(userId);
        if (!metrics)
            return { level: 1, requirements: this.thresholds[0].requirements };
        const totalScore = metrics.relationshipScore * 0.3 +
            metrics.positiveImpact * 0.3 +
            metrics.consistencyScore * 0.2 +
            metrics.growthRate * 0.2;
        const threshold = this.thresholds
            .slice()
            .reverse()
            .find((t) => totalScore >= t.minimumScore);
        return {
            level: threshold ? threshold.level : 1,
            requirements: this.getNextLevelRequirements(totalScore),
        };
    }
    getNextLevelRequirements(currentScore) {
        const nextThreshold = this.thresholds.find((t) => t.minimumScore > currentScore);
        return nextThreshold ? nextThreshold.requirements : [];
    }
}
exports.TrustBasedScaling = TrustBasedScaling;
//# sourceMappingURL=trustBasedScaling.js.map