import { spawn } from 'child_process';
import { DemandSignal, DemandContext } from '../../../types/mvp/demand';

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
  maxConcurrency?: number;
  modelConfig?: {
    [key: string]: {
      temperature: number;
      maxTokens: number;
    };
  };
}

interface ProviderMetrics {
  processedCount: number;
  errorCount: number;
  avgProcessingTime: number;
}

interface IntelligenceProvider {
  name: string;
  type: 'processing' | 'validation' | 'enrichment' | 'research';
  status: ProviderStatus;
  metrics?: ProviderMetrics;
  confidence: number;
  config: ProviderConfig;

  processSignal(signal: DemandSignal): Promise<ProcessedSignal>;
  processSignalBatch(signals: DemandSignal[]): Promise<ProcessedSignal[]>;
  validateAlignment(): Promise<boolean>;
  getStatus(): ProviderStatus;
}

export class ResearchIntelligenceProvider implements IntelligenceProvider {
  name = 'ResearchIntelligence';
  type = 'research' as const;
  status: ProviderStatus = { status: 'ready' };
  metrics?: ProviderMetrics;
  confidence = 0.9;
  config: ProviderConfig = {
    maxBatchSize: 1,
    timeout: 60000,
    retryAttempts: 2,
    cacheEnabled: true,
    maxConcurrency: 1,
    modelConfig: {
      llama2: { temperature: 0.7, maxTokens: 2048 },
    },
  };

  private model: string;

  constructor(model = 'llama2') {
    this.model = model;
  }

  private async queryModel(prompt: string): Promise<string> {
    return new Promise<string>((resolve, reject) => {
      const childProcess = spawn('ollama', ['run', this.model, prompt]);
      let output = '';
      let error = '';

      childProcess.stdout.on('data', (data) => {
        output += data.toString();
      });

      childProcess.stderr.on('data', (data) => {
        error += data.toString();
      });

      childProcess.on('close', (code) => {
        if (code !== 0) {
          reject(new Error(`Model query failed: ${error}`));
        } else {
          resolve(output.trim());
        }
      });
    });
  }

  async processSignal(signal: DemandSignal): Promise<ProcessedSignal> {
    try {
      const prompt = `
      Conduct deep research analysis on this demand signal:
      Query: ${signal.query}
      Market: ${signal.context.market}
      Category: ${signal.context.category}
      Intent: ${signal.context.intent}
      Keywords: ${signal.insights.keywords.join(', ')}
      
      Research objectives:
      1. Market Analysis: Identify market dynamics and trends
      2. Competitive Landscape: Map related markets and opportunities
      3. Value Chain Analysis: Identify potential collaboration points
      4. Innovation Opportunities: Suggest novel approaches
      
      Format response as JSON with fields:
      {
        "marketTrends": string[],
        "competitiveLandscape": string[],
        "valueChainOpportunities": string[],
        "innovationSuggestions": string[],
        "researchConfidence": number (0-1)
      }
      `;

      const response = await this.queryModel(prompt);
      const analysis = JSON.parse(response);

      console.log('Research analysis completed:', analysis);

      return {
        signal,
        context: {
          ...signal.context,
          sentiment: analysis.researchConfidence,
          categories: analysis.marketTrends,
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
    return Promise.all(signals.map((signal) => this.processSignal(signal)));
  }

  async validateAlignment(): Promise<boolean> {
    try {
      // Test model access
      const testPrompt = 'Test model access';
      try {
        await this.queryModel(testPrompt);
      } catch (error) {
        console.error('Model access validation failed:', error);
        return false;
      }

      // Test research pipeline
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

      try {
        await this.processSignal(testSignal);
      } catch (error) {
        console.error('Research pipeline validation failed:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Alignment validation failed:', error);
      return false;
    }
  }

  getStatus(): ProviderStatus {
    return this.status;
  }
}
