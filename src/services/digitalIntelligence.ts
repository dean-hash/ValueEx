import { OpenAI } from 'openai';
import { configService } from '../config/configService';
import { logger } from '../utils/logger';
import { MARKET_VERTICALS, MarketVertical } from '../types/marketTypes';

interface AccuracyMetrics {
  confidence: number;
  signalStrength: number;
  dataPoints: number;
}

interface NeedSignal {
  type: 'market' | 'demand' | 'urgency';
  strength: number;
  source: string;
  timestamp: Date;
  metadata: {
    intent?: string;
    urgencyLevel?: number;
    pricePoint?: number;
    drivers?: string[];
    barriers?: string[];
    demandType?: string;
    targetDemographic?: string[];
    competitiveIntensity?: number;
    timeframe?: string;
    vertical?: MarketVertical;
  };
}

export class DigitalIntelligence {
  private openai: OpenAI;

  constructor() {
    this.openai = new OpenAI({
      apiKey: configService.getOpenAIKey(),
    });
  }

  async analyzeNeed(
    category: string,
    verticalId?: string
  ): Promise<{
    isGenuineNeed: boolean;
    accuracy: AccuracyMetrics;
    signals: NeedSignal[];
    recommendedActions: string[];
    vertical?: MarketVertical;
  }> {
    try {
      // Identify market vertical if not provided
      const vertical = verticalId
        ? MARKET_VERTICALS[verticalId]
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
    } catch (error: unknown) {
      logger.error('Error in digital intelligence analysis:', {
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

  private async identifyVertical(category: string): Promise<MarketVertical> {
    try {
      const analysis = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: `You are a market categorization expert. Given a product category or description, respond with just one word representing the most relevant market vertical from this list: ${Object.keys(MARKET_VERTICALS).join(', ')}`,
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
      return MARKET_VERTICALS[verticalId] || MARKET_VERTICALS.general;
    } catch (error: unknown) {
      logger.error('Error identifying vertical:', {
        error: error instanceof Error ? error.message : String(error),
      });
      return MARKET_VERTICALS.general;
    }
  }

  private transformInsightsToSignals(insights: any, vertical: MarketVertical): NeedSignal[] {
    const now = new Date();
    const signals: NeedSignal[] = [];

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
      const alignmentScore =
        (verticalAlignment.purchaseCycleFit +
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

  private calculateAccuracy(signals: NeedSignal[]): AccuracyMetrics {
    if (!signals.length) {
      return {
        confidence: 0,
        signalStrength: 0,
        dataPoints: 0,
      };
    }

    const alignmentScores = signals.reduce(
      (acc, signal) => ({
        ...acc,
        [signal.type]: signal.strength,
      }),
      {} as Record<string, number>
    );

    const avgAlignmentScore =
      Object.values(alignmentScores).reduce((sum, score) => sum + score, 0) /
      Object.keys(alignmentScores).length;

    return {
      confidence: avgAlignmentScore,
      signalStrength: signals.length > 2 ? 0.8 : 0.5,
      dataPoints: signals.length,
    };
  }

  private validateNeed(insights: any, vertical: MarketVertical): boolean {
    try {
      const { marketTrends, demandPatterns, urgencySignals, confidence, marketViability } =
        insights;

      const alignmentScores = {
        marketTrends: marketTrends.confidence * marketTrends.verticalFit,
        demandStrength: demandPatterns.strength,
        urgencyLevel: urgencySignals.level,
        overallConfidence: confidence,
        viability: marketViability,
      };

      const avgAlignmentScore =
        Object.values(alignmentScores).reduce((sum: number, score: number) => sum + score, 0) /
        Object.keys(alignmentScores).length;

      return avgAlignmentScore > 0.6;
    } catch (error) {
      return false;
    }
  }

  private getRecommendedActions(insights: any, vertical: MarketVertical): string[] {
    try {
      return insights.recommendations || [];
    } catch (error) {
      return [];
    }
  }
}

export const digitalIntelligence = new DigitalIntelligence();
