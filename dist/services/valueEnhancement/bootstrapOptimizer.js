"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BootstrapOptimizer = void 0;
const logger_1 = require("../../utils/logger");
class BootstrapOptimizer {
    constructor() {
        this.searchCache = new Map();
    }
    static getInstance() {
        if (!BootstrapOptimizer.instance) {
            BootstrapOptimizer.instance = new BootstrapOptimizer();
        }
        return BootstrapOptimizer.instance;
    }
    async findValueOpportunity(signal) {
        try {
            // Score the opportunity
            const score = await this.scoreValue(signal);
            // Generate action plan using zero-cost resources
            const actions = this.generateActions(score);
            // Find free resources and tools
            const resources = await this.findFreeResources(signal);
            return { score, actions, resources };
        }
        catch (error) {
            logger_1.logger.error('Error finding value opportunity:', error);
            throw error;
        }
    }
    async scoreValue(signal) {
        // Simple scoring based on signal properties we already have
        const authenticity = this.scoreAuthenticity(signal);
        const utility = this.scoreUtility(signal);
        const sustainability = this.scoreSustainability(signal);
        return { authenticity, utility, sustainability };
    }
    scoreAuthenticity(signal) {
        // Use existing confidence and context
        const hasContext = signal.insights.context?.length > 0;
        const hasKeywords = signal.insights.keywords?.length > 0;
        const highConfidence = signal.insights.confidence > 0.7;
        let score = 0;
        if (hasContext)
            score += 0.4;
        if (hasKeywords)
            score += 0.3;
        if (highConfidence)
            score += 0.3;
        return score;
    }
    scoreUtility(signal) {
        // Check for practical application indicators
        const keywords = signal.insights.keywords || [];
        const practicalTerms = [
            'how',
            'solve',
            'fix',
            'build',
            'create',
            'improve',
            'help',
            'need',
            'want',
            'looking for',
        ];
        const practicalCount = keywords.filter((word) => practicalTerms.some((term) => word.toLowerCase().includes(term))).length;
        return Math.min(practicalCount / 3, 1);
    }
    scoreSustainability(signal) {
        // Evaluate long-term viability
        const hasUrgency = signal.insights.urgency > 0.5;
        const hasDepth = signal.insights.context?.length > 100;
        const hasConfidence = signal.insights.confidence > 0.6;
        let score = 0;
        if (hasUrgency)
            score += 0.3;
        if (hasDepth)
            score += 0.4;
        if (hasConfidence)
            score += 0.3;
        return score;
    }
    generateActions(score) {
        const actions = [];
        // Generate actions based on scores
        if (score.authenticity > 0.7) {
            actions.push('Engage directly with community to validate need');
            actions.push('Document real use cases and pain points');
        }
        if (score.utility > 0.6) {
            actions.push('Create proof-of-concept solution using open source tools');
            actions.push('Share solution approach for community feedback');
        }
        if (score.sustainability > 0.7) {
            actions.push('Build minimal viable solution that creates immediate value');
            actions.push('Establish feedback loop with early adopters');
        }
        // Always include bootstrap-friendly actions
        actions.push('Leverage existing open source solutions');
        actions.push('Build community through knowledge sharing');
        actions.push('Focus on solving immediate pain points');
        return actions;
    }
    async findFreeResources(signal) {
        const cacheKey = signal.query;
        if (this.searchCache.has(cacheKey)) {
            return this.searchCache.get(cacheKey);
        }
        const resources = [
            // Open Source Tools
            'GitHub - Find existing open source solutions',
            'Stack Overflow - Technical knowledge and community',
            'Dev.to - Share progress and get feedback',
            // Free Learning
            'FreeCodeCamp - Build technical skills',
            'MDN Web Docs - Technical documentation',
            'YouTube tutorials - Learn from practitioners',
            // Community Building
            'Reddit - Find communities with similar needs',
            'Discord - Build real-time community',
            'Twitter - Share progress and insights',
            // Free Development Tools
            'VS Code - Development environment',
            'Postman - API testing',
            'Git - Version control',
            // Free Deployment
            'Netlify - Static site hosting',
            'Vercel - Frontend deployment',
            'Heroku - Free tier backend hosting',
        ];
        // Cache the results
        this.searchCache.set(cacheKey, resources);
        return resources;
    }
    async validateValue(signal) {
        const score = await this.scoreValue(signal);
        // Determine viability
        const isViable = score.authenticity > 0.6 && score.utility > 0.5 && score.sustainability > 0.6;
        // Generate bootstrap-friendly next steps
        const nextSteps = [
            'Validate problem with potential users',
            'Create minimal solution with open source tools',
            'Build community around the solution',
            'Gather feedback and iterate quickly',
            'Document success stories and impact',
        ];
        // Identify potential risks
        const risks = [
            'Limited initial functionality',
            'Community growth takes time',
            'Need consistent engagement',
            'Resource constraints',
        ];
        return { isViable, nextSteps, risks };
    }
}
exports.BootstrapOptimizer = BootstrapOptimizer;
//# sourceMappingURL=bootstrapOptimizer.js.map