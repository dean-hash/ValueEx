"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.digitalIntelligence = exports.DigitalIntelligence = void 0;
const openai_1 = require("openai");
const configService_1 = require("../config/configService");
const logger_1 = require("../utils/logger");
const marketTypes_1 = require("../types/marketTypes");
class DigitalIntelligence {
    constructor() {
        this.confidenceThreshold = 0.7;
        this.model = new openai_1.OpenAI({
            apiKey: configService_1.configService.get('OPENAI_API_KEY'),
        });
    }
    async analyzeNeed(category, verticalId) {
        try {
            // Identify market vertical if not provided
            const vertical = verticalId
                ? marketTypes_1.MARKET_VERTICALS[verticalId]
                : await this.identifyVertical(category);
            // Use GPT-4 for comprehensive market analysis
            const analysis = await this.openai.chat.completions.create({
                model: 'gpt-4',
                messages: [
                    {
                        role: 'system',
                        content: `You are an expert market intelligence analyst with deep expertise in consumer behavior and market dynamics.
              
              Market Vertical Context:
              ${JSON.stringify(vertical, null, 2)}
              
              Analyze the given product category and provide insights in the following structure:
              {
                "marketTrends": {
                  "direction": "growing|stable|declining",
                  "confidence": 0.0-1.0,
                  "drivers": string[],
                  "barriers": string[],
                  "verticalFit": 0.0-1.0
                },
                "demandPatterns": {
                  "strength": 0.0-1.0,
                  "type": "immediate|growing|seasonal|cyclical",
                  "optimalPrice": {
                    "min": number,
                    "max": number,
                    "confidence": 0.0-1.0
                  },
                  "targetDemographic": string[],
                  "competitiveIntensity": 0.0-1.0,
                  "verticalAlignment": {
                    "purchaseCycleFit": 0.0-1.0,
                    "seasonalityFit": 0.0-1.0,
                    "marginPotential": 0.0-1.0
                  }
                },
                "urgencySignals": {
                  "level": 0.0-1.0,
                  "score": 1-5,
                  "drivers": string[],
                  "timeframe": "immediate|short-term|medium-term|long-term",
                  "verticalConsiderations": string[]
                },
                "confidence": 0.0-1.0,
                "marketViability": 0.0-1.0,
                "recommendations": string[],
                "verticalSpecificInsights": {
                  "competitiveAdvantages": string[],
                  "entryStrategy": string,
                  "riskFactors": string[]
                }
              }`,
                    },
                    {
                        role: 'user',
                        content: `Analyze the market for: ${category}
              
              Consider the following vertical-specific factors:
              1. Purchase Cycle: ${vertical.characteristics.purchaseCycle}
              2. Price Elasticity: ${vertical.characteristics.priceElasticity}
              3. Seasonality: ${vertical.characteristics.seasonality}
              4. Tech Dependency: ${vertical.characteristics.techDependency}
              
              Key Metrics to Consider:
              - Average Margin: ${vertical.keyMetrics.avgMargin}
              - Customer Lifetime: ${vertical.keyMetrics.customerLifetime} months
              - Acquisition Cost: $${vertical.keyMetrics.acquisitionCost}
              - Repeat Purchase Rate: ${vertical.keyMetrics.repeatPurchaseRate}
              
              Competitive Landscape:
              - Entry Barriers: ${vertical.competitiveFactors.entryBarriers}
              - Substitute Threat: ${vertical.competitiveFactors.substituteThreat}
              - Supplier Power: ${vertical.competitiveFactors.supplierPower}
              - Buyer Power: ${vertical.competitiveFactors.buyerPower}
              
              Provide specific, actionable insights with confidence levels.`,
                    },
                ],
                temperature: 0.7,
                max_tokens: 1000,
                top_p: 1,
                frequency_penalty: 0,
                presence_penalty: 0,
            });
            if (!analysis.choices[0].message.content) {
                throw new Error('No content in GPT response');
            }
            const insights = JSON.parse(analysis.choices[0].message.content);
            // Transform GPT analysis into our signal format
            const signals = this.transformInsightsToSignals(insights, vertical);
            const accuracy = this.calculateAccuracy(signals);
            return {
                isGenuineNeed: this.validateNeed(insights, vertical),
                accuracy,
                signals,
                recommendedActions: this.getRecommendedActions(insights, vertical),
                vertical,
            };
        }
        catch (error) {
            logger_1.logger.error('Error in digital intelligence analysis:', {
                error: error instanceof Error ? error.message : String(error),
            });
            return {
                isGenuineNeed: false,
                accuracy: {
                    confidence: 0,
                    signalStrength: 0,
                    dataPoints: 0,
                },
                signals: [],
                recommendedActions: [],
                vertical: undefined,
            };
        }
    }
    async validateDemandAuthenticity(signal) {
        try {
            // Analyze signal context and metadata
            const analysis = await this.analyzeSignalContext(signal);
            // Check for authentic need indicators
            const isAuthentic = analysis.isGenuineNeed && !analysis.isManipulated && analysis.hasRealWorldContext;
            logger_1.logger.info(`Demand authenticity validation: ${isAuthentic ? 'AUTHENTIC' : 'INAUTHENTIC'}`, {
                signalId: signal.id,
                analysis,
            });
            return isAuthentic;
        }
        catch (error) {
            logger_1.logger.error('Error validating demand authenticity:', error);
            return false;
        }
    }
    async findMatchingProducts(signal) {
        try {
            // First validate the demand is authentic
            const isAuthentic = await this.validateDemandAuthenticity(signal);
            if (!isAuthentic) {
                return [];
            }
            // Find products that genuinely meet the need
            const matches = await this.searchProductDatabase(signal);
            // Filter and rank by authentic value alignment
            const rankedMatches = await this.rankByValueAlignment(matches, signal);
            return rankedMatches;
        }
        catch (error) {
            logger_1.logger.error('Error finding matching products:', error);
            return [];
        }
    }
    async analyzeSignalContext(signal) {
        // Analyze signal using AI to detect authenticity markers
        const prompt = this.buildAuthenticityPrompt(signal);
        const response = await this.model.chat.completions.create({
            model: 'gpt-4',
            messages: [
                {
                    role: 'system',
                    content: 'Analyze the following demand signal for authenticity markers. Focus on identifying genuine needs versus manufactured demand.',
                },
                {
                    role: 'user',
                    content: prompt,
                },
            ],
        });
        // Parse response to determine authenticity indicators
        const analysis = this.parseAuthenticityAnalysis(response.choices[0].message.content);
        return {
            isGenuineNeed: analysis.genuineNeedScore > this.confidenceThreshold,
            isManipulated: analysis.manipulationScore > 0.3,
            hasRealWorldContext: analysis.contextScore > this.confidenceThreshold,
        };
    }
    buildAuthenticityPrompt(signal) {
        return `
Analyze this demand signal for authenticity:

Query: ${signal.query}
Source: ${signal.source}
Keywords: ${signal.insights.keywords?.join(', ')}
Context: ${signal.insights.context || 'None provided'}
Urgency Level: ${signal.insights.urgency}
Intent: ${signal.insights.intent || 'Unknown'}

Please evaluate:
1. Is this a genuine need or manufactured demand?
2. Are there signs of manipulation or artificial urgency?
3. Is there real-world context supporting this need?
4. What is the confidence level in this being authentic?
`;
    }
    parseAuthenticityAnalysis(content) {
        // Implementation note: This is a simplified version.
        // In production, we'd use more sophisticated NLP to parse the AI response.
        const lines = content.toLowerCase().split('\n');
        return {
            genuineNeedScore: this.extractScore(lines, 'genuine'),
            manipulationScore: this.extractScore(lines, 'manipulat'),
            contextScore: this.extractScore(lines, 'context'),
        };
    }
    extractScore(lines, keyword) {
        const relevantLine = lines.find((line) => line.includes(keyword));
        if (!relevantLine)
            return 0;
        // Extract any number between 0 and 1 from the line
        const matches = relevantLine.match(/0?\.[0-9]+/);
        return matches ? parseFloat(matches[0]) : 0;
    }
    async searchProductDatabase(signal) {
        // Implementation note: This would connect to your actual product database
        // For MVP, we're returning an empty array
        return [];
    }
    async rankByValueAlignment(products, signal) {
        // Score each product by how well it authentically meets the need
        const scoredProducts = await Promise.all(products.map(async (product) => {
            const valueScore = await this.calculateValueAlignment(product, signal);
            return { product, valueScore };
        }));
        // Sort by value alignment and return products
        return scoredProducts
            .filter(({ valueScore }) => valueScore > this.confidenceThreshold)
            .sort((a, b) => b.valueScore - a.valueScore)
            .map(({ product }) => product);
    }
    async calculateValueAlignment(product, signal) {
        // Calculate how well the product authentically meets the need
        const needAlignment = await this.analyzeNeedAlignment(product, signal);
        const priceAlignment = this.analyzePriceAlignment(product, signal);
        const merchantTrust = await this.analyzeMerchantTrust(product);
        // Weight the factors (adjust weights based on importance)
        return needAlignment * 0.5 + priceAlignment * 0.3 + merchantTrust * 0.2;
    }
    async analyzeNeedAlignment(product, signal) {
        // Use AI to analyze how well product meets the need
        const prompt = `
Analyze how well this product meets the expressed need:

Need: ${signal.query}
Product: ${product.name}
Description: ${product.description}
Features: ${product.features?.join(', ')}

Rate alignment from 0 to 1, considering:
1. Direct need fulfillment
2. Quality of solution
3. Potential drawbacks
`;
        const response = await this.model.chat.completions.create({
            model: 'gpt-4',
            messages: [
                {
                    role: 'system',
                    content: 'Analyze product-need alignment focusing on authentic value delivery.',
                },
                {
                    role: 'user',
                    content: prompt,
                },
            ],
        });
        // Extract alignment score from response
        return this.extractScore(response.choices[0].message.content.toLowerCase().split('\n'), 'alignment');
    }
    analyzePriceAlignment(product, signal) {
        if (!signal.insights.priceRange)
            return 0.5;
        const { min, max } = signal.insights.priceRange;
        const price = product.price;
        if (price >= min && price <= max)
            return 1;
        // Calculate how far outside the range, with penalty for being too expensive
        const midPoint = (min + max) / 2;
        const maxDeviation = midPoint * 0.5;
        if (price < min) {
            const deviation = (min - price) / maxDeviation;
            return Math.max(0, 1 - deviation * 0.5); // Smaller penalty for being cheaper
        }
        const deviation = (price - max) / maxDeviation;
        return Math.max(0, 1 - deviation * 2); // Larger penalty for being more expensive
    }
    async analyzeMerchantTrust(product) {
        // Implementation note: This would connect to your merchant rating system
        // For MVP, we're returning a default trust score
        return product.merchantRating ? product.merchantRating / 5 : 0.5;
    }
    async identifyVertical(category) {
        try {
            const analysis = await this.openai.chat.completions.create({
                model: 'gpt-4',
                messages: [
                    {
                        role: 'system',
                        content: `You are a market categorization expert. Given a product category or description, respond with just one word representing the most relevant market vertical from this list: ${Object.keys(marketTypes_1.MARKET_VERTICALS).join(', ')}`,
                    },
                    {
                        role: 'user',
                        content: category,
                    },
                ],
            });
            if (!analysis.choices[0].message.content) {
                throw new Error('No content in GPT response');
            }
            const verticalId = analysis.choices[0].message.content.trim().toLowerCase();
            return marketTypes_1.MARKET_VERTICALS[verticalId] || marketTypes_1.MARKET_VERTICALS.general;
        }
        catch (error) {
            logger_1.logger.error('Error identifying vertical:', {
                error: error instanceof Error ? error.message : String(error),
            });
            return marketTypes_1.MARKET_VERTICALS.general;
        }
    }
    transformInsightsToSignals(insights, vertical) {
        const now = new Date();
        const signals = [];
        if (insights.marketTrends) {
            signals.push({
                type: 'market',
                strength: insights.marketTrends.confidence * insights.marketTrends.verticalFit,
                source: 'gpt_analysis',
                timestamp: now,
                metadata: {
                    intent: insights.marketTrends.direction,
                    drivers: insights.marketTrends.drivers,
                    barriers: insights.marketTrends.barriers,
                    vertical,
                },
            });
        }
        if (insights.demandPatterns) {
            const verticalAlignment = insights.demandPatterns.verticalAlignment;
            const alignmentScore = (verticalAlignment.purchaseCycleFit +
                verticalAlignment.seasonalityFit +
                verticalAlignment.marginPotential) /
                3;
            signals.push({
                type: 'demand',
                strength: insights.demandPatterns.strength * alignmentScore,
                source: 'gpt_analysis',
                timestamp: now,
                metadata: {
                    pricePoint: insights.demandPatterns.optimalPrice?.max,
                    demandType: insights.demandPatterns.type,
                    targetDemographic: insights.demandPatterns.targetDemographic,
                    competitiveIntensity: insights.demandPatterns.competitiveIntensity,
                    vertical,
                },
            });
        }
        if (insights.urgencySignals) {
            signals.push({
                type: 'urgency',
                strength: insights.urgencySignals.level,
                source: 'gpt_analysis',
                timestamp: now,
                metadata: {
                    urgencyLevel: insights.urgencySignals.score,
                    drivers: insights.urgencySignals.drivers,
                    timeframe: insights.urgencySignals.timeframe,
                    vertical,
                },
            });
        }
        return signals;
    }
    calculateAccuracy(signals) {
        if (!signals.length) {
            return {
                confidence: 0,
                signalStrength: 0,
                dataPoints: 0,
            };
        }
        const alignmentScores = signals.reduce((acc, signal) => ({ ...acc, [signal.type]: signal.strength }), {});
        const avgAlignmentScore = Object.values(alignmentScores).reduce((sum, score) => sum + score, 0) /
            Object.keys(alignmentScores).length;
        return {
            confidence: avgAlignmentScore,
            signalStrength: signals.length > 2 ? 0.8 : 0.5,
            dataPoints: signals.length,
        };
    }
    validateNeed(insights, vertical) {
        try {
            const { marketTrends, demandPatterns, urgencySignals, confidence, marketViability } = insights;
            const alignmentScores = {
                marketTrends: marketTrends.confidence * marketTrends.verticalFit,
                demandStrength: demandPatterns.strength,
                urgencyLevel: urgencySignals.level,
                overallConfidence: confidence,
                viability: marketViability,
            };
            const avgAlignmentScore = Object.values(alignmentScores).reduce((sum, score) => sum + score, 0) /
                Object.keys(alignmentScores).length;
            return avgAlignmentScore > 0.6;
        }
        catch (error) {
            return false;
        }
    }
    getRecommendedActions(insights, vertical) {
        try {
            return insights.recommendations || [];
        }
        catch (error) {
            return [];
        }
    }
}
exports.DigitalIntelligence = DigitalIntelligence;
exports.digitalIntelligence = new DigitalIntelligence();
//# sourceMappingURL=digitalIntelligence.js.map