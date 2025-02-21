"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DemandMatcher = void 0;
const correlationAnalyzer_1 = require("../analysis/correlationAnalyzer");
const demandSignalEnhancer_1 = require("../analysis/demandSignalEnhancer");
const influenceAnalyzer_1 = require("../analysis/influenceAnalyzer");
const intelligenceCoordinator_1 = require("../analysis/intelligenceCoordinator");
const demandInference_1 = require("../analysis/providers/demandInference");
const valueSignalProcessor_1 = require("../analysis/providers/valueSignalProcessor");
const contextManager_1 = require("../analysis/providers/contextManager");
const logger_1 = require("../../utils/logger");
const rxjs_1 = require("rxjs");
class DemandMatcher {
    constructor() {
        this.correlationAnalyzer = correlationAnalyzer_1.CorrelationAnalyzer.getInstance();
        this.signalEnhancer = demandSignalEnhancer_1.DemandSignalEnhancer.getInstance();
        this.influenceAnalyzer = influenceAnalyzer_1.InfluenceAnalyzer.getInstance();
        this.intelligence = intelligenceCoordinator_1.IntelligenceCoordinator.getInstance();
        this.demandInference = new demandInference_1.DemandInference();
        this.valueProcessor = new valueSignalProcessor_1.ValueSignalProcessor();
        this.contextManager = new contextManager_1.ContextManager();
    }
    static getInstance() {
        if (!DemandMatcher.instance) {
            DemandMatcher.instance = new DemandMatcher();
        }
        return DemandMatcher.instance;
    }
    async findMatches(signal) {
        try {
            // 1. Enhance signal with NLP and sentiment analysis
            const enhancedSignal = await (0, rxjs_1.firstValueFrom)(this.signalEnhancer.enhanceSignal(signal));
            // 2. Analyze influence and value metrics
            const influenceMetrics = await this.influenceAnalyzer.analyzeInfluence(enhancedSignal);
            // 3. Get behavioral patterns and inferences
            const behaviorSignals = await this.demandInference.inferFromBehavior({
                searches: [signal.query],
                viewedItems: [],
                interactions: [],
                context: signal.context,
            });
            // 4. Process value signals
            const valueSignals = await this.valueProcessor.processSignals([enhancedSignal]);
            // 5. Get temporal patterns and correlations
            const patterns = this.correlationAnalyzer.getTemporalPatterns();
            const correlations = this.correlationAnalyzer.getMultiSourceCorrelations();
            // 6. Coordinate intelligence gathering
            const intelligenceResults = await Promise.all([
                this.intelligence.gatherLocalInsights(enhancedSignal),
                this.intelligence.gatherResearchInsights(enhancedSignal),
                this.intelligence.gatherSystemResources(enhancedSignal),
            ]);
            // 7. Build rich context
            const context = await this.contextManager.buildContext({
                signal: enhancedSignal,
                influence: influenceMetrics,
                behavior: behaviorSignals,
                value: valueSignals,
                intelligence: intelligenceResults,
                patterns,
                correlations,
            });
            // 8. Find initial matches using all available intelligence
            const matches = await this.findInitialMatches(context);
            if (!matches.length) {
                logger_1.logger.info(`No initial matches found for signal ${signal.id}`);
                return [];
            }
            // 9. Enhance matches with full context
            const enhancedMatches = await this.enhanceWithContext(matches, context);
            // 10. Rank by comprehensive value creation potential
            return this.rankByValueCreation(enhancedMatches, context);
        }
        catch (error) {
            logger_1.logger.error('Error in findMatches:', error);
            return [];
        }
    }
    async findInitialMatches(context) {
        const products = await this.intelligence.findRelevantProducts(context.signal);
        return products.filter((product) => {
            // Basic alignment checks
            const categoryMatch = product.category === context.signal.vertical.name;
            const verticalMatch = product.vertical.id === context.signal.vertical.id;
            // Price range validation
            const priceMatch = !context.signal.insights.priceRange ||
                (product.price >= context.signal.insights.priceRange.min &&
                    product.price <= context.signal.insights.priceRange.max);
            // Value signal matching
            const valueMatch = context.value.some((signal) => signal.matches.includes(product.id));
            // Behavioral pattern matching
            const behaviorMatch = context.behavior.some((signal) => signal.matches.includes(product.id));
            return categoryMatch && verticalMatch && priceMatch && valueMatch && behaviorMatch;
        });
    }
    async enhanceWithContext(products, context) {
        return Promise.all(products.map(async (product) => {
            const resonanceFactors = await this.calculateResonanceFactors(product, context);
            return {
                ...product,
                resonanceFactors,
            };
        }));
    }
    async calculateResonanceFactors(product, context) {
        // Calculate demand match using pattern coherence and influence
        const demandMatch = context.patterns.get(product.category)?.confidence ?? 0 * context.influence.expertiseMatch;
        // Calculate market fit using correlations and intelligence
        const marketFit = (context.correlations.get(product.category)?.correlation ?? 0) *
            context.intelligence[0].confidence;
        // Calculate value alignment using value signals
        const valueAlignment = context.value.reduce((acc, signal) => {
            if (signal.matches.includes(product.id)) {
                acc += signal.confidence;
            }
            return acc;
        }, 0) / context.value.length;
        // Calculate practical utility using behavior signals
        const practicalUtility = context.behavior.reduce((acc, signal) => {
            if (signal.matches.includes(product.id)) {
                acc += signal.confidence;
            }
            return acc;
        }, 0) / context.behavior.length;
        // Calculate sustainable value using temporal patterns
        const sustainableValue = (context.patterns.get(product.category)?.period ?? 0) > 168 ? 0.8 : 0.4;
        return {
            demandMatch,
            marketFit,
            valueAlignment,
            practicalUtility,
            sustainableValue,
        };
    }
    rankByValueCreation(products, context) {
        return products.sort((a, b) => {
            const aFactors = a.resonanceFactors;
            const bFactors = b.resonanceFactors;
            if (!aFactors || !bFactors)
                return 0;
            // Weight factors based on context confidence
            const weights = {
                valueAlignment: context.value.length ? 0.3 : 0.2,
                practicalUtility: context.behavior.length ? 0.3 : 0.2,
                sustainableValue: context.patterns.size ? 0.2 : 0.1,
                demandMatch: context.influence.expertiseMatch > 0.7 ? 0.1 : 0.2,
                marketFit: context.intelligence[0].confidence > 0.8 ? 0.1 : 0.3,
            };
            const aScore = aFactors.valueAlignment * weights.valueAlignment +
                aFactors.practicalUtility * weights.practicalUtility +
                aFactors.sustainableValue * weights.sustainableValue +
                aFactors.demandMatch * weights.demandMatch +
                aFactors.marketFit * weights.marketFit;
            const bScore = bFactors.valueAlignment * weights.valueAlignment +
                bFactors.practicalUtility * weights.practicalUtility +
                bFactors.sustainableValue * weights.sustainableValue +
                bFactors.demandMatch * weights.demandMatch +
                bFactors.marketFit * weights.marketFit;
            return bScore - aScore;
        });
    }
}
exports.DemandMatcher = DemandMatcher;
//# sourceMappingURL=demandMatcher.js.map