"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MerchantOpportunityAnalyzer = void 0;
const rxjs_1 = require("rxjs");
class MerchantOpportunityAnalyzer {
    constructor() {
        this.demandPatterns = new rxjs_1.BehaviorSubject([]);
        this.knownMerchants = new Map();
        this.opportunityScores = new Map();
        this.initializeAnalysis();
    }
    initializeAnalysis() {
        // Monitor demand patterns for significant changes
        this.demandPatterns.subscribe((patterns) => {
            this.updateOpportunityScores(patterns);
        });
    }
    addDemandPattern(pattern) {
        const current = this.demandPatterns.value;
        const updated = [...current, pattern];
        this.demandPatterns.next(updated);
    }
    analyzeMerchant(merchant) {
        const matchedPatterns = this.findMatchingDemandPatterns(merchant);
        const score = this.calculateOpportunityScore(merchant, matchedPatterns);
        const revenue = this.estimatePotentialRevenue(merchant, matchedPatterns);
        const effort = this.estimateImplementationEffort(merchant);
        const opportunityScore = {
            merchant,
            score,
            matchedDemand: matchedPatterns,
            potentialRevenue: revenue,
            implementationEffort: effort,
            priority: this.determinePriority(score, revenue, effort),
        };
        this.opportunityScores.set(merchant.merchantId, opportunityScore);
        return opportunityScore;
    }
    findMatchingDemandPatterns(merchant) {
        return this.demandPatterns.value.filter((pattern) => {
            // Category match
            const categoryMatch = merchant.products.categories.some((cat) => cat.toLowerCase() === pattern.category.toLowerCase());
            // Price range overlap
            const priceMatch = merchant.products.priceRange.min <= pattern.pricePoint.max &&
                merchant.products.priceRange.max >= pattern.pricePoint.min;
            return categoryMatch && priceMatch;
        });
    }
    calculateOpportunityScore(merchant, patterns) {
        const matchedDemand = patterns.filter((pattern) => merchant.products.categories.includes(pattern.category) &&
            pattern.pricePoint.min >= merchant.products.priceRange.min &&
            pattern.pricePoint.max <= merchant.products.priceRange.max);
        if (matchedDemand.length === 0)
            return 0;
        const potentialRevenue = matchedDemand.reduce((total, pattern) => total + pattern.conversion.value * pattern.conversion.potential * pattern.frequency * 52, 0);
        const implementationEffort = this.calculateImplementationEffort(merchant);
        const demandScore = matchedDemand.reduce((score, pattern) => score + pattern.urgency * pattern.frequency, 0) /
            matchedDemand.length;
        const revenueScore = Math.min(10, potentialRevenue / 10000);
        const effortScore = (11 - implementationEffort) / 2;
        return demandScore * 0.3 + revenueScore * 0.5 + effortScore * 0.2;
    }
    normalizeCommission(commission) {
        if (commission.type === 'percentage') {
            return commission.rate / 100;
        }
        else {
            // Convert fixed commission to approximate percentage
            return commission.rate / 50; // Assuming $50 average order value
        }
    }
    calculatePriceAlignment(merchantRange, demandPoint) {
        const overlap = Math.min(merchantRange.max, demandPoint.max) - Math.max(merchantRange.min, demandPoint.min);
        const range = demandPoint.max - demandPoint.min;
        return Math.max(0, overlap / range);
    }
    estimatePotentialRevenue(merchant, patterns) {
        return patterns.reduce((total, pattern) => {
            const monthlyTransactions = pattern.frequency * 4 * pattern.conversion.potential;
            const averageCommission = this.normalizeCommission(merchant.commission) * pattern.conversion.value;
            return total + monthlyTransactions * averageCommission;
        }, 0);
    }
    estimateImplementationEffort(merchant) {
        let effort = 5; // Base effort
        // Adjust based on requirements
        if (merchant.requirements.traffic)
            effort += 1;
        if (merchant.requirements.sales)
            effort += 1;
        if (merchant.requirements.platform?.length)
            effort += merchant.requirements.platform.length;
        return Math.min(10, effort);
    }
    determinePriority(score, revenue, effort) {
        const roi = (score * revenue) / effort;
        if (roi > 1000)
            return 'HIGH';
        if (roi > 500)
            return 'MEDIUM';
        return 'LOW';
    }
    updateOpportunityScores(patterns) {
        this.knownMerchants.forEach((merchant, id) => {
            const matchedDemand = patterns.filter((pattern) => merchant.products.categories.includes(pattern.category) &&
                pattern.pricePoint.min >= merchant.products.priceRange.min &&
                pattern.pricePoint.max <= merchant.products.priceRange.max);
            if (matchedDemand.length > 0) {
                const potentialRevenue = matchedDemand.reduce((total, pattern) => total +
                    pattern.conversion.value * pattern.conversion.potential * pattern.frequency * 52, 0);
                const implementationEffort = this.calculateImplementationEffort(merchant);
                const score = this.calculateOpportunityScore(merchant, matchedDemand);
                this.opportunityScores.set(id, {
                    merchant,
                    score,
                    matchedDemand,
                    potentialRevenue,
                    implementationEffort,
                    priority: this.determinePriority(score, potentialRevenue, implementationEffort),
                });
            }
        });
    }
    calculateImplementationEffort(merchant) {
        let effort = 5; // Base effort
        // Adjust based on requirements
        if (merchant.requirements) {
            if (merchant.requirements.traffic)
                effort += 1;
            if (merchant.requirements.sales)
                effort += 1;
            if (merchant.requirements.platform?.length)
                effort += merchant.requirements.platform.length;
        }
        return Math.min(10, effort); // Cap at 10
    }
    getTopOpportunities(limit = 10) {
        return Array.from(this.opportunityScores.values())
            .sort((a, b) => {
            // Prioritize high ROI opportunities
            const roiA = (a.score * a.potentialRevenue) / a.implementationEffort;
            const roiB = (b.score * b.potentialRevenue) / b.implementationEffort;
            return roiB - roiA;
        })
            .slice(0, limit);
    }
    generateOpportunityReport() {
        const opportunities = this.getTopOpportunities();
        let report = '# Merchant Opportunity Analysis\n\n';
        opportunities.forEach((opp, index) => {
            report += `## ${index + 1}. ${opp.merchant.name}\n`;
            report += `Priority: ${opp.priority}\n`;
            report += `Potential Monthly Revenue: $${opp.potentialRevenue.toFixed(2)}\n`;
            report += `Implementation Effort: ${opp.implementationEffort}/10\n`;
            report += `Matched Demand Patterns: ${opp.matchedDemand.length}\n\n`;
            report += '### Key Demand Matches:\n';
            opp.matchedDemand.forEach((pattern) => {
                report += `- ${pattern.category}: $${pattern.pricePoint.min}-${pattern.pricePoint.max}\n`;
                report += `  Frequency: ${pattern.frequency} times/week\n`;
                report += `  Potential Conversion: ${(pattern.conversion.potential * 100).toFixed(1)}%\n\n`;
            });
            report += '---\n\n';
        });
        return report;
    }
    async analyzeResonancePatterns(merchants) {
        const patterns = merchants.map((merchant) => ({
            name: merchant.name,
            resonanceScore: this.calculateResonanceScore(merchant),
            harmonicFactors: {
                strength: merchant.averageCommission / 100,
                urgency: merchant.conversionRate,
                readiness: merchant.validationStatus === 'approved' ? 1 : 0.5,
                confidence: merchant.performance?.reliability || 0.7,
            },
            coherenceMetrics: this.measureCoherence(merchant),
        }));
        return patterns.sort((a, b) => b.resonanceScore - a.resonanceScore);
    }
    calculateResonanceScore(merchant) {
        // Base frequency alignment (432 Hz harmonic series)
        const baseFreq = 432;
        const merchantFreq = merchant.averageCommission * merchant.conversionRate;
        const harmonicAlignment = Math.cos((merchantFreq / baseFreq) * Math.PI * 2);
        return harmonicAlignment * (merchant.performance?.reliability || 0.7);
    }
    measureCoherence(merchant) {
        return {
            valueAlignment: merchant.averageCommission > 0 ? 1 : 0,
            trustFactor: merchant.performance?.reliability || 0.7,
            marketResonance: merchant.conversionRate > 0.02 ? 1 : 0.5,
        };
    }
}
exports.MerchantOpportunityAnalyzer = MerchantOpportunityAnalyzer;
//# sourceMappingURL=merchantOpportunityAnalyzer.js.map