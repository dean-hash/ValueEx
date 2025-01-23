"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.IntelligenceEnhancer = void 0;
const openai_1 = require("../clients/openai");
const zod_1 = require("zod");
const logger_1 = require("../utils/logger");
const ProductInsightsSchema = zod_1.z.object({
    category: zod_1.z.string(),
    features: zod_1.z.array(zod_1.z.string()),
    targetAudience: zod_1.z.array(zod_1.z.string()),
    pricePoint: zod_1.z.string(),
});
const DemandContextSchema = zod_1.z.object({
    marketTrends: zod_1.z.array(zod_1.z.string()),
    competitiveLandscape: zod_1.z.array(zod_1.z.string()),
    consumerBehavior: zod_1.z.array(zod_1.z.string()),
});
const ResonanceFactorsSchema = zod_1.z.object({
    temporal: zod_1.z.number(),
    content: zod_1.z.number(),
    interaction: zod_1.z.number(),
});
const GPTResponseSchema = zod_1.z.object({
    resonanceFactors: ResonanceFactorsSchema.optional(),
    keywords: zod_1.z.array(zod_1.z.string()).optional(),
});
class IntelligenceEnhancer {
    constructor() {
        this.openaiClient = openai_1.OpenAIClient.getInstance();
    }
    static getInstance() {
        if (!IntelligenceEnhancer.instance) {
            IntelligenceEnhancer.instance = new IntelligenceEnhancer();
        }
        return IntelligenceEnhancer.instance;
    }
    createProductInsights(data) {
        return (data || {
            category: '',
            features: [],
            targetAudience: [],
            pricePoint: '',
        });
    }
    createDemandContext(data) {
        return (data || {
            marketTrends: [],
            competitiveLandscape: [],
            consumerBehavior: [],
        });
    }
    async enhanceProductUnderstanding(product) {
        try {
            const response = await this.openaiClient.createJSONCompletion([
                {
                    role: 'system',
                    content: 'You are a product analyst. Analyze the product and provide insights in JSON format.',
                },
                {
                    role: 'user',
                    content: `Analyze this product: ${JSON.stringify(product)}`,
                },
            ], {
                temperature: 0.3, // Lower temperature for more consistent analysis
            });
            return this.createProductInsights(response || undefined);
        }
        catch (error) {
            logger_1.logger.error('Error enhancing product understanding:', error);
            return this.createProductInsights(undefined);
        }
    }
    async analyzeDemandContext(pattern) {
        try {
            const response = await this.openaiClient.createJSONCompletion([
                {
                    role: 'system',
                    content: 'You are a market analyst. Analyze the demand pattern and provide context in JSON format.',
                },
                {
                    role: 'user',
                    content: `Analyze this demand pattern: ${JSON.stringify(pattern)}`,
                },
            ], {
                temperature: 0.4, // Balanced between creativity and consistency
            });
            return this.createDemandContext(response || undefined);
        }
        catch (error) {
            logger_1.logger.error('Error analyzing demand context:', error);
            return this.createDemandContext(undefined);
        }
    }
    async calculateContextualResonance(product, pattern) {
        try {
            const response = await this.openaiClient.createJSONCompletion([
                {
                    role: 'system',
                    content: 'You are a resonance analyst. Calculate the contextual resonance between product and demand pattern.',
                },
                {
                    role: 'user',
                    content: `Calculate resonance between:\nProduct: ${JSON.stringify(product)}\nPattern: ${JSON.stringify(pattern)}`,
                },
            ], {
                temperature: 0.2, // Lower temperature for more consistent scoring
            });
            if (response?.resonanceFactors) {
                const { temporal, content, interaction } = response.resonanceFactors;
                return (temporal + content + interaction) / 3;
            }
            return 0;
        }
        catch (error) {
            logger_1.logger.error('Error calculating contextual resonance:', error);
            return 0;
        }
    }
    async enhanceDemandPattern(pattern) {
        try {
            const response = await this.openaiClient.createJSONCompletion([
                {
                    role: 'system',
                    content: 'You are a demand pattern analyst. Enhance the given pattern with additional context and insights.',
                },
                {
                    role: 'user',
                    content: `Enhance this pattern: ${JSON.stringify(pattern)}`,
                },
            ], {
                temperature: 0.5, // Balance between consistency and creativity
            });
            if (!response) {
                return pattern;
            }
            return {
                ...pattern,
                context: {
                    marketTrends: [...pattern.context.marketTrends, ...response.marketTrends],
                    userPreferences: [...pattern.context.userPreferences, ...response.userPreferences],
                    competitiveAnalysis: {
                        ...pattern.context.competitiveAnalysis,
                        ...response.competitiveAnalysis,
                    },
                },
            };
        }
        catch (error) {
            logger_1.logger.error('Error enhancing demand pattern:', error);
            return pattern;
        }
    }
}
exports.IntelligenceEnhancer = IntelligenceEnhancer;
//# sourceMappingURL=intelligenceEnhancer.js.map