"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PortfolioAnalyzer = void 0;
const intelligenceField_1 = require("../../core/unified/intelligenceField");
const domainAnalyzer_1 = require("./domainAnalyzer");
class PortfolioAnalyzer {
    constructor() {
        this.field = intelligenceField_1.UnifiedIntelligenceField.getInstance();
        this.analyzer = new domainAnalyzer_1.DomainAnalyzer();
    }
    static getInstance() {
        if (!PortfolioAnalyzer.instance) {
            PortfolioAnalyzer.instance = new PortfolioAnalyzer();
        }
        return PortfolioAnalyzer.instance;
    }
    async analyzeDomainMetrics(domain) {
        // Get domain resonance from our intelligence field
        const resonance = await this.field.getDomainResonance(domain);
        // Analyze domain characteristics
        const analysis = await this.analyzer.analyzeDomain(domain);
        // Determine optimal monetization strategy
        const strategy = this.determineStrategy(analysis);
        return {
            domain,
            seoValue: analysis.seoValue || resonance.seoStrength,
            marketDemand: analysis.marketDemand || resonance.demandStrength,
            affiliatePotential: analysis.affiliateFit || resonance.affiliateResonance,
            estimatedValue: this.calculateDomainValue(analysis),
            recommendedStrategy: strategy.strategy,
            niche: strategy.niche,
        };
    }
    determineStrategy(analysis) {
        const strategies = {
            DEVELOPMENT: 'Full website development',
            PARKING: 'Domain parking with PPC',
            AFFILIATE: 'Affiliate marketing focus',
            SALE: 'List for sale',
            HOLD: 'Hold for future potential',
        };
        // AI/Tech domains
        if (analysis.domain.includes('ai') || analysis.domain.includes('tech')) {
            return {
                strategy: strategies.DEVELOPMENT,
                niche: 'Technology & AI',
            };
        }
        // Business domains
        if (analysis.domain.includes('business') || analysis.domain.includes('corp')) {
            return {
                strategy: strategies.DEVELOPMENT,
                niche: 'Business Services',
            };
        }
        // Determine based on metrics
        if (analysis.seoValue > 0.8 && analysis.marketDemand > 0.7) {
            return {
                strategy: strategies.DEVELOPMENT,
                niche: this.determineNiche(analysis.domain),
            };
        }
        if (analysis.affiliateFit > 0.8) {
            return {
                strategy: strategies.AFFILIATE,
                niche: this.determineNiche(analysis.domain),
            };
        }
        return {
            strategy: strategies.PARKING,
            niche: 'General',
        };
    }
    determineNiche(domain) {
        const niches = new Map([
            ['tech', 'Technology'],
            ['ai', 'Artificial Intelligence'],
            ['farm', 'Agriculture'],
            ['eco', 'Environment'],
            ['health', 'Healthcare'],
            ['edu', 'Education'],
            ['finance', 'Finance'],
            ['travel', 'Travel'],
            ['food', 'Food & Beverage'],
        ]);
        for (const [keyword, niche] of niches) {
            if (domain.includes(keyword)) {
                return niche;
            }
        }
        return 'General';
    }
    calculateDomainValue(analysis) {
        const baseValue = 1000; // Base value for any domain
        let multiplier = 1;
        // Adjust based on TLD
        const tld = analysis.domain.split('.').pop();
        const tldMultipliers = {
            ai: 2.5,
            com: 2.0,
            org: 1.8,
            net: 1.5,
            io: 2.2,
        };
        multiplier *= tldMultipliers[tld] || 1;
        // Adjust for domain length
        const domainLength = analysis.domain.split('.')[0].length;
        if (domainLength < 6)
            multiplier *= 1.5;
        if (domainLength > 15)
            multiplier *= 0.7;
        // Adjust for metrics
        multiplier *= 1 + analysis.seoValue;
        multiplier *= 1 + analysis.marketDemand;
        multiplier *= 1 + analysis.affiliateFit;
        return Math.round(baseValue * multiplier);
    }
    async getAffiliateRecommendations(domain) {
        const analysis = await this.analyzer.analyzeDomain(domain);
        const niche = this.determineNiche(domain);
        // This would normally call our affiliate network APIs
        // For now, returning mock recommendations
        return [
            {
                network: 'Amazon Associates',
                relevance: 0.9,
                averageCommission: '4%',
                products: ['Tech Gadgets', 'Books', 'Software'],
            },
            {
                network: 'ClickBank',
                relevance: 0.85,
                averageCommission: '50%',
                products: ['Digital Products', 'Online Courses'],
            },
            {
                network: 'CJ Affiliate',
                relevance: 0.8,
                averageCommission: '10%',
                products: ['SaaS Products', 'Business Services'],
            },
        ];
    }
}
exports.PortfolioAnalyzer = PortfolioAnalyzer;
//# sourceMappingURL=portfolioAnalyzer.js.map