"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MerchantAnalyzer = void 0;
class MerchantAnalyzer {
    constructor() {
        this.merchants = new Map();
        this.categoryInsights = new Map();
        this.initializeKnownMerchants();
    }
    initializeKnownMerchants() {
        // Add Fiverr
        this.addMerchant({
            networkId: 'fiverr',
            merchantId: 'fiverr_main',
            name: 'Fiverr',
            categories: ['services', 'freelance', 'digital'],
            commissionStructure: {
                base: 30,
                notes: 'First-time buyer CPA commission',
            },
            status: 'active',
            notes: 'Strong in digital services, established integration',
        });
        // We'll add Awin merchants as we discover them
    }
    addMerchant(profile) {
        this.merchants.set(profile.merchantId, profile);
        this.updateCategoryAnalysis(profile);
    }
    getMerchantsByCategory(category) {
        return Array.from(this.merchants.values()).filter((m) => m.categories.includes(category));
    }
    getHighValueMerchants() {
        return Array.from(this.merchants.values()).filter((m) => this.calculateMerchantValue(m) > 7);
    }
    calculateMerchantValue(merchant) {
        let score = 0;
        // Base commission weight
        score += merchant.commissionStructure.base * 0.5;
        // Category coverage
        score += merchant.categories.length * 0.3;
        // Status bonus
        if (merchant.status === 'active')
            score += 2;
        return score;
    }
    updateCategoryAnalysis(profile) {
        profile.categories.forEach((category) => {
            const analysis = this.categoryInsights.get(category) || {
                name: category,
                totalMerchants: 0,
                avgCommission: 0,
                topMerchants: [],
                marketGaps: [],
            };
            // Update metrics
            analysis.totalMerchants++;
            // Update average commission
            const currentTotal = analysis.avgCommission * (analysis.totalMerchants - 1);
            analysis.avgCommission =
                (currentTotal + profile.commissionStructure.base) / analysis.totalMerchants;
            // Update top merchants if high value
            if (this.calculateMerchantValue(profile) > 7) {
                if (!analysis.topMerchants.includes(profile.name)) {
                    analysis.topMerchants.push(profile.name);
                }
            }
            this.categoryInsights.set(category, analysis);
        });
    }
    generateActionableInsights() {
        const insights = [];
        // Category gaps
        this.categoryInsights.forEach((analysis, category) => {
            if (analysis.totalMerchants < 3) {
                insights.push(`Need more merchants in ${category} category`);
            }
        });
        // Commission opportunities
        const highValue = this.getHighValueMerchants();
        if (highValue.length < 5) {
            insights.push('Priority: Identify high-commission merchants');
        }
        return insights;
    }
    async analyzeAwinMerchant(merchantId) {
        // TODO: Integrate with Awin API to fetch merchant details
        // For now, we'll manually add merchants as we discover them
    }
    exportMerchantReport() {
        let report = '# Merchant Network Analysis\n\n';
        // Active Merchants
        report += '## Active Merchants\n';
        const active = Array.from(this.merchants.values()).filter((m) => m.status === 'active');
        active.forEach((m) => {
            report += `- ${m.name} (${m.networkId})\n`;
            report += `  Categories: ${m.categories.join(', ')}\n`;
            report += `  Base Commission: ${m.commissionStructure.base}%\n\n`;
        });
        // Opportunities
        report += '## Opportunities\n';
        const insights = this.generateActionableInsights();
        insights.forEach((insight) => {
            report += `- ${insight}\n`;
        });
        return report;
    }
    analyzeCategoryPatterns(merchants) {
        const patterns = [];
        // First level: Major categories
        const majorCategories = this.groupByMajorCategory(merchants);
        for (const [category, categoryMerchants] of majorCategories) {
            // Second level: Sub-categories
            const subPatterns = this.analyzeSubCategories(categoryMerchants);
            // Third level: Service patterns
            const servicePatterns = this.analyzeServicePatterns(categoryMerchants);
            patterns.push({
                category,
                merchantCount: categoryMerchants.length,
                averageCommission: this.calculateAverageCommission(categoryMerchants),
                subPatterns,
                servicePatterns,
                resonanceScore: this.calculateCategoryResonance(categoryMerchants),
            });
        }
        return patterns.sort((a, b) => b.resonanceScore - a.resonanceScore);
    }
    calculateCategoryResonance(merchants) {
        if (merchants.length === 0)
            return 0;
        // Base resonance from merchant count (logarithmic scaling)
        const countResonance = Math.log(merchants.length + 1) / Math.log(10);
        // Commission harmony (how well commission structures align)
        const avgCommission = this.calculateAverageCommission(merchants);
        const commissionVariance = merchants.reduce((acc, m) => acc + Math.pow(m.commissionStructure.base - avgCommission, 2), 0) / merchants.length;
        const commissionHarmony = 1 / (1 + Math.sqrt(commissionVariance));
        // Service coherence (how well services complement each other)
        const serviceCoherence = merchants.reduce((acc, m) => acc + (m.services?.length || 0), 0) / (merchants.length * 3); // Normalize by expected service count
        // Combine factors with golden ratio weighting
        const φ = (1 + Math.sqrt(5)) / 2;
        return (countResonance + φ * commissionHarmony + serviceCoherence) / (1 + φ + 1);
    }
    groupByMajorCategory(merchants) {
        const majorCategories = new Map();
        merchants.forEach((merchant) => {
            const majorCategory = merchant.categories[0];
            if (!majorCategories.has(majorCategory)) {
                majorCategories.set(majorCategory, []);
            }
            const categoryMerchants = majorCategories.get(majorCategory);
            if (categoryMerchants) {
                categoryMerchants.push(merchant);
            }
        });
        return majorCategories;
    }
    analyzeSubCategories(merchants) {
        const subCategories = new Map();
        // Group by sub-categories while maintaining connection to parent
        merchants.forEach((merchant) => {
            merchant.categories.slice(1).forEach((subCategory) => {
                if (!subCategories.has(subCategory)) {
                    subCategories.set(subCategory, []);
                }
                const subCategoryMerchants = subCategories.get(subCategory);
                if (subCategoryMerchants) {
                    subCategoryMerchants.push(merchant);
                }
            });
        });
        // Analyze each sub-category while maintaining parent context
        return Array.from(subCategories.entries()).map(([subCategory, merchantGroup]) => ({
            name: subCategory,
            merchantCount: merchantGroup.length,
            resonanceScore: this.calculateCategoryResonance(merchantGroup),
            parentResonance: this.calculateCategoryResonance(merchants),
            harmonic: this.calculateHarmonicAlignment(merchantGroup, merchants),
        }));
    }
    analyzeServicePatterns(merchants) {
        // Extract service patterns while maintaining category context
        const services = merchants.flatMap((merchant) => merchant.services && merchant.services.length > 0
            ? merchant.services.map((service) => ({
                service,
                merchant,
                categoryContext: merchant.categories,
            }))
            : []);
        // Group similar services
        const patterns = new Map();
        services.forEach(({ service, merchant, categoryContext }) => {
            const key = this.normalizeServiceName(service.name);
            if (!patterns.has(key)) {
                patterns.set(key, []);
            }
            const contextList = patterns.get(key);
            if (contextList) {
                contextList.push({ service, merchant, categoryContext });
            }
        });
        // Analyze patterns with both vertical (category) and horizontal (service) resonance
        return Array.from(patterns.entries()).map(([key, contexts]) => ({
            name: key,
            frequency: contexts.length,
            categoryResonance: this.calculateCrossContextResonance(contexts),
            serviceResonance: this.calculateServiceResonance(contexts),
            coherence: this.calculatePatternCoherence(contexts),
        }));
    }
    calculateHarmonicAlignment(subGroup, parentGroup) {
        const subFreq = this.calculateCategoryResonance(subGroup);
        const parentFreq = this.calculateCategoryResonance(parentGroup);
        // Check if sub-pattern frequency aligns with parent harmonics
        return Math.cos((subFreq / parentFreq) * Math.PI * 2);
    }
    calculateCrossContextResonance(contexts) {
        const categoryFrequencies = contexts.map((ctx) => this.calculateCategoryResonance([ctx.merchant]));
        // Find resonance across different category contexts
        return categoryFrequencies.reduce((acc, freq) => acc + freq, 0) / categoryFrequencies.length;
    }
    calculateServiceResonance(contexts) {
        const baseFreq = 432;
        const avgValue = contexts.reduce((acc, ctx) => acc + ctx.service.value, 0) / contexts.length;
        return (avgValue * Math.log(contexts.length + 1)) / baseFreq;
    }
    calculatePatternCoherence(contexts) {
        const categoryAlignment = this.calculateCrossContextResonance(contexts);
        const serviceAlignment = this.calculateServiceResonance(contexts);
        // Measure how well service patterns align across categories
        return Math.min(1, (categoryAlignment * serviceAlignment) / (432 * 432));
    }
    normalizeServiceName(name) {
        return name.toLowerCase().trim().replace(/\s+/g, '_');
    }
    calculateAverageCommission(merchants) {
        const totalCommission = merchants.reduce((acc, merchant) => acc + merchant.commissionStructure.base, 0);
        return totalCommission / merchants.length;
    }
}
exports.MerchantAnalyzer = MerchantAnalyzer;
//# sourceMappingURL=merchantAnalysis.js.map