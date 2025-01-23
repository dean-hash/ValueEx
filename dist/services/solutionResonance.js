"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SolutionResonance = void 0;
const rxjs_1 = require("rxjs");
class SolutionResonance {
    constructor() {
        this.contextField = new rxjs_1.BehaviorSubject({});
        this.solutionPool = new Map();
        this.resonanceThreshold = 0.7;
        this.initializeSolutionPool();
    }
    initializeSolutionPool() {
        // Start with a small set of well-understood solutions
        // We can expand this dynamically as we learn
    }
    async findBestSolution(need, context) {
        // Update context field
        this.contextField.next({
            ...this.contextField.value,
            ...context,
        });
        // Get all potential solutions
        const candidates = Array.from(this.solutionPool.values());
        // Calculate resonance for each solution
        const resonanceScores = await Promise.all(candidates.map(async (solution) => ({
            solution,
            score: await this.calculateSolutionResonance(need, solution, context),
        })));
        // Filter and sort by resonance score
        return resonanceScores
            .filter(({ score }) => score > this.resonanceThreshold)
            .sort((a, b) => b.score - a.score)
            .map(({ solution }) => solution);
    }
    async calculateSolutionResonance(need, solution, context) {
        const scores = await Promise.all([
            this.calculatePropertyResonance(solution, context),
            this.calculateContextualResonance(solution, context),
            this.calculateHistoricalResonance(solution, context),
            this.calculateSituationalFit(solution, context),
        ]);
        return scores.reduce((sum, score) => sum + score, 0) / scores.length;
    }
    async calculatePropertyResonance(solution, context) {
        let score = 0;
        const prefs = context.userPreferences || {};
        // Price alignment
        if (prefs.pricePreference) {
            score += this.alignmentScore(solution.properties.price, prefs.pricePreference);
        }
        // Time alignment
        if (prefs.timeConstraint) {
            score += this.alignmentScore(solution.properties.deliveryTime, prefs.timeConstraint);
        }
        // Quality alignment
        if (prefs.qualityEmphasis) {
            score += this.alignmentScore(solution.properties.quality, prefs.qualityEmphasis);
        }
        return score / 3;
    }
    alignmentScore(value, preference) {
        // Convert preferences to expected ranges and calculate alignment
        const ranges = {
            value: [0.3, 0.7],
            premium: [0.7, 1.0],
            budget: [0, 0.3],
            urgent: [0.8, 1.0],
            flexible: [0.3, 0.8],
            planned: [0, 0.3],
            high: [0.7, 1.0],
            moderate: [0.3, 0.7],
            basic: [0, 0.3],
        };
        const [min, max] = ranges[preference] || [0, 1];
        return value >= min && value <= max ? 1 : 0;
    }
    async calculateContextualResonance(solution, context) {
        const factors = context.situationalFactors || {
            immediacy: 0.5,
            complexity: 0.5,
            importance: 0.5,
        };
        // Higher flexibility is better for complex situations
        const complexityScore = solution.properties.flexibility * factors.complexity;
        // Quick delivery is better for immediate needs
        const immediacyScore = (1 - solution.properties.deliveryTime) * factors.immediacy;
        // Higher quality is better for important situations
        const importanceScore = solution.properties.quality * factors.importance;
        return (complexityScore + immediacyScore + importanceScore) / 3;
    }
    async calculateHistoricalResonance(solution, context) {
        const history = context.history;
        if (!history || !history.previousSolutions.length)
            return 0.5;
        // Find similar previous solutions
        const similarSolutions = history.previousSolutions
            .map((id, index) => ({
            id,
            satisfaction: history.satisfactionLevels[index],
        }))
            .filter((prev) => this.areSolutionsSimilar(solution.id, prev.id));
        if (!similarSolutions.length)
            return 0.5;
        // Average satisfaction with similar solutions
        return (similarSolutions.reduce((sum, prev) => sum + prev.satisfaction, 0) / similarSolutions.length);
    }
    async calculateSituationalFit(solution, context) {
        // This could include:
        // - Time of day/week/year
        // - Current market conditions
        // - Local availability
        // - Community trends
        return 0.5; // Placeholder for now
    }
    areSolutionsSimilar(id1, id2) {
        const sol1 = this.solutionPool.get(id1);
        const sol2 = this.solutionPool.get(id2);
        if (!sol1 || !sol2)
            return false;
        // Compare solution properties
        const propertyDiff = Object.keys(sol1.properties).reduce((diff, key) => {
            const k = key;
            return diff + Math.abs(sol1.properties[k] - sol2.properties[k]);
        }, 0);
        return propertyDiff < 1; // Threshold for similarity
    }
    // Interface for adding new solutions dynamically
    addSolution(solution) {
        this.solutionPool.set(solution.id, solution);
    }
    // Interface for updating context
    updateContext(newContext) {
        this.contextField.next({
            ...this.contextField.value,
            ...newContext,
        });
    }
}
exports.SolutionResonance = SolutionResonance;
//# sourceMappingURL=solutionResonance.js.map