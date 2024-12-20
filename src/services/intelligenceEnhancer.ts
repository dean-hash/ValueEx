import { Configuration, OpenAIApi } from 'openai';
import { AwinProduct } from '../types/awinTypes';
import { DemandPattern } from '../types/demandPattern';
import { logger } from '../utils/logger';
import { configService } from '../config/configService';

export class IntelligenceEnhancer {
    private openai: OpenAIApi;

    constructor() {
        const config = new Configuration({
            apiKey: configService['config'].openai.apiKey
        });
        this.openai = new OpenAIApi(config);
    }

    async enhanceProductUnderstanding(product: AwinProduct): Promise<{
        features: string[];
        benefits: string[];
        targetAudience: string[];
        useContexts: string[];
    }> {
        const prompt = `
        Analyze this product and extract key information:
        Product: ${product.title}
        Description: ${product.description}
        Price: ${product.price} ${product.currency}
        Categories: ${product.categories.join(', ')}

        Please provide:
        1. Key features
        2. Main benefits
        3. Target audience
        4. Common use contexts
        
        Format as JSON.`;

        try {
            const response = await this.openai.createChatCompletion({
                model: "gpt-4",
                messages: [{ role: "user", content: prompt }],
                temperature: 0.7
            });

            return JSON.parse(response.data.choices[0].message?.content || '{}');
        } catch (error) {
            logger.error('Error enhancing product understanding:', error);
            return {
                features: [],
                benefits: [],
                targetAudience: [],
                useContexts: []
            };
        }
    }

    async analyzeDemandContext(pattern: DemandPattern): Promise<{
        impliedNeeds: string[];
        urgencyFactors: string[];
        constraints: string[];
        alternatives: string[];
    }> {
        const prompt = `
        Analyze this demand pattern and provide insights:
        Keywords: ${pattern.keywords?.join(', ')}
        Category: ${pattern.category}
        Price Range: ${pattern.priceRange?.min || 'Any'} - ${pattern.priceRange?.max || 'Any'}
        Location: ${pattern.location || 'Any'}

        Please identify:
        1. Implied needs beyond the explicit request
        2. Factors affecting urgency
        3. Potential constraints
        4. Possible alternatives
        
        Format as JSON.`;

        try {
            const response = await this.openai.createChatCompletion({
                model: "gpt-4",
                messages: [{ role: "user", content: prompt }],
                temperature: 0.7
            });

            return JSON.parse(response.data.choices[0].message?.content || '{}');
        } catch (error) {
            logger.error('Error analyzing demand context:', error);
            return {
                impliedNeeds: [],
                urgencyFactors: [],
                constraints: [],
                alternatives: []
            };
        }
    }

    async analyzeDemandSignals(signals: SignalDimension[]): Promise<{
        emergingTrends: string[];
        demandStrength: number;
        marketGaps: string[];
        recommendations: string[];
    }> {
        const prompt = `
        Analyze these demand signals and identify patterns:

        Signals:
        ${signals.map(s => `
            Type: ${s.type}
            Strength: ${s.strength}
            Velocity: ${s.velocity}
            Context: ${JSON.stringify(s.context)}
        `).join('\n')}

        Please identify:
        1. Emerging trends
        2. Overall demand strength (0-1)
        3. Market gaps or opportunities
        4. Strategic recommendations

        Format as JSON.`;

        try {
            const response = await this.openai.createChatCompletion({
                model: "gpt-4",
                messages: [{ role: "user", content: prompt }],
                temperature: 0.7
            });

            return JSON.parse(response.data.choices[0].message?.content || '{}');
        } catch (error) {
            logger.error('Error analyzing demand signals:', error);
            return {
                emergingTrends: [],
                demandStrength: 0.5,
                marketGaps: [],
                recommendations: []
            };
        }
    }

    async calculateContextualResonance(
        product: AwinProduct, 
        pattern: DemandPattern
    ): Promise<number> {
        const [productInsights, demandInsights] = await Promise.all([
            this.enhanceProductUnderstanding(product),
            this.analyzeDemandContext(pattern)
        ]);

        const prompt = `
        Calculate resonance score (0-1) between product and demand:
        
        Product Insights:
        ${JSON.stringify(productInsights, null, 2)}

        Demand Insights:
        ${JSON.stringify(demandInsights, null, 2)}

        Consider:
        1. How well product features match implied needs
        2. Price alignment with constraints
        3. Target audience match
        4. Use context compatibility
        
        Return only a number between 0 and 1.`;

        try {
            const response = await this.openai.createChatCompletion({
                model: "gpt-4",
                messages: [{ role: "user", content: prompt }],
                temperature: 0.3
            });

            const score = parseFloat(response.data.choices[0].message?.content || '0');
            return Math.min(1, Math.max(0, score)); // Ensure between 0 and 1
        } catch (error) {
            logger.error('Error calculating contextual resonance:', error);
            return 0.5; // Default to neutral score on error
        }
    }
}
