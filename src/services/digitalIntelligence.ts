import { OpenAI } from 'openai';
import { DemandSignal, DemandContext, DemandInsights } from '../types/mvp/demand';
import { configService } from '../config/configService';
import { MarketVertical } from '../types/marketTypes';

interface ProcessedSignal {
  signal: DemandSignal;
  context: DemandContext;
}

interface ProviderStatus {
  status: 'ready' | 'processing' | 'error';
  error?: string;
}

interface ProviderConfig {
  maxBatchSize: number;
  timeout: number;
  retryAttempts: number;
  cacheEnabled: boolean;
}

interface IntelligenceProvider {
  name: string;
  type: 'processing' | 'validation' | 'enrichment' | 'research';
  status: ProviderStatus;
  confidence: number;
  config: ProviderConfig;

  processSignal(signal: DemandSignal): Promise<ProcessedSignal>;
  processSignalBatch(signals: DemandSignal[]): Promise<ProcessedSignal[]>;
  validateAlignment(): Promise<boolean>;
  getStatus(): ProviderStatus;
}

export class DigitalIntelligenceProvider implements IntelligenceProvider {
  name = 'DigitalIntelligence';
  type = 'processing' as const;
  status: ProviderStatus = { status: 'ready' };
  confidence = 0.9;
  config: ProviderConfig = {
    maxBatchSize: 5,
    timeout: 30000,
    retryAttempts: 2,
    cacheEnabled: true,
  };

  private model: OpenAI;

  constructor() {
    const apiKey = configService.getConfigServiceConfig('OPENAI_API_KEY');
    const orgId = configService.getConfigServiceConfig('OPENAI_ORG_ID');

    if (!apiKey) {
      throw new Error('OpenAI API key not configured');
    }

    this.model = new OpenAI({
      apiKey,
      organization: orgId,
      dangerouslyAllowBrowser: true,
    });
  }

  async processSignal(signal: DemandSignal): Promise<ProcessedSignal> {
    try {
      const prompt = `
        Analyze this demand signal:
        Query: ${signal.query}
        Market: ${signal.context.market}
        Category: ${signal.context.category}
        Intent: ${signal.context.intent}
        
        Provide a sentiment score (0-1) and identify key categories.
      `;

      const response = await this.model.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user' as const, content: prompt }],
        temperature: 0.7,
        max_tokens: 150,
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No response from OpenAI');
      }

      // Parse response and extract sentiment and categories
      const sentiment = 0.7; // Placeholder
      const categories = ['digital', 'technology']; // Placeholder

      return {
        signal,
        context: {
          ...signal.context,
          sentiment,
          categories,
        },
      };
    } catch (err) {
      this.status = {
        status: 'error',
        error: err instanceof Error ? err.message : String(err),
      };
      throw err;
    }
  }

  async processSignalBatch(signals: DemandSignal[]): Promise<ProcessedSignal[]> {
    const processPromises = signals.map((signal) => this.processSignal(signal));
    return Promise.all(processPromises);
  }

  async analyzeNeed(
    category: string,
    verticalId?: string
  ): Promise<{
    isGenuineNeed: boolean;
    accuracy: {
      confidence: number;
      signalStrength: number;
      dataPoints: number;
    };
    signals: Array<{
      type: 'market' | 'demand' | 'urgency';
      strength: number;
      source: string;
      timestamp: Date;
      metadata: Record<string, any>;
    }>;
    recommendedActions: string[];
    vertical?: MarketVertical;
  }> {
    try {
      // Simplified implementation for MVP
      return {
        isGenuineNeed: true,
        accuracy: {
          confidence: 0.8,
          signalStrength: 0.7,
          dataPoints: 1,
        },
        signals: [
          {
            type: 'demand',
            strength: 0.8,
            source: 'analysis',
            timestamp: new Date(),
            metadata: {},
          },
        ],
        recommendedActions: ['Proceed with demand validation'],
      };
    } catch (err) {
      console.error('Error analyzing need:', err);
      throw err;
    }
  }

  async validateAlignment(): Promise<boolean> {
    try {
      const testSignal: DemandSignal = {
        id: 'test',
        query: 'test query',
        source: 'test',
        timestamp: new Date().toISOString(),
        strength: 1,
        vertical: {
          id: 'test',
          name: 'Test Vertical',
          characteristics: {
            purchaseCycle: 'impulse',
            priceElasticity: 0.5,
            seasonality: 0.5,
            techDependency: 0.5,
          },
          keyMetrics: {
            avgMargin: 0.3,
            customerLifetime: 12,
            acquisitionCost: 100,
            repeatPurchaseRate: 0.7,
          },
          competitiveFactors: {
            entryBarriers: 0.5,
            substituteThreat: 0.5,
            supplierPower: 0.5,
            buyerPower: 0.5,
          },
        },
        insights: {
          keywords: [],
          context: '',
          urgency: 0.5,
          intent: 'test',
          confidence: 0.8,
          valueEvidence: {
            authenticityMarkers: [],
            realWorldImpact: [],
            practicalUtility: [],
          },
          demographics: [],
          priceRange: {
            min: 0,
            max: 100,
          },
          demandPatterns: {
            frequency: 0.5,
            consistency: 0.5,
            evidence: [],
          },
        },
        context: {
          market: 'test',
          category: 'test',
          priceRange: '0-100',
          intent: 'test',
          urgency: 0.5,
          volume: 0.5,
          sentiment: 0.5,
          categories: [],
        },
      };

      await this.processSignal(testSignal);
      return true;
    } catch (err) {
      console.error('Validation failed:', err);
      return false;
    }
  }

  getStatus(): ProviderStatus {
    return this.status;
  }
}
