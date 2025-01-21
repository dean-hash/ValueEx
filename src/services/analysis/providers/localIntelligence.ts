import { ChildProcess, spawn } from 'child_process';
import { DemandInference } from './demandInference';
import { MatchingEngine } from '../../matching/matchingEngine';
import { ParallelProcessor } from './parallelProcessor';
import {
  DemandSignal,
  IntelligenceProvider,
  ProviderStatus,
  ProviderMetrics,
  ProviderConfig,
} from '../../../types/providerTypes';

interface OllamaAnalysis {
  matchQuality: number;
  confidence: number;
  insights: string[];
}

interface Match {
  id: string;
  score: number;
  context: string;
}

interface ProcessError extends Error {
  code?: string;
  signal?: string;
}

interface ProcessedSignal {
  signal: DemandSignal;
  context: any;
}

export class LocalIntelligenceProvider implements IntelligenceProvider {
  name = 'LocalIntelligence';
  type = 'processing' as const;
  status: ProviderStatus = 'ready';
  metrics?: ProviderMetrics;
  config: ProviderConfig = {
    maxBatchSize: 10,
    timeout: 30000,
    retryAttempts: 3,
    cacheEnabled: true,
  };

  private model: string;
  private demandInference: DemandInference;
  private matchingEngine: MatchingEngine;
  private isOllamaAvailable: boolean = false;
  private parallelProcessor: ParallelProcessor;
  private googleTrends: GoogleTrendsConnector;
  private localCache: Map<string, { data: any; timestamp: number }> = new Map();
  private readonly CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

  constructor(model = 'mistral') {
    this.model = model;
    this.demandInference = new DemandInference();
    this.matchingEngine = new MatchingEngine();
    this.parallelProcessor = new ParallelProcessor();
    this.googleTrends = new GoogleTrendsConnector(configService.get('GOOGLE_TRENDS_API_KEY'));
    this.checkOllamaAvailability();
    this.initializeLocalProcessing();
  }

  private async initializeLocalProcessing(): Promise<void> {
    try {
      // Initialize Ollama with Mistral
      const process = spawn('ollama', ['pull', this.model]);
      process.on('close', (code) => {
        if (code === 0) {
          this.isOllamaAvailable = true;
          console.log(`Successfully initialized ${this.model} model`);
        }
      });

      // Initialize natural.js models
      await this.demandInference.initializeClassifier();

      // Set up caching
      this.setupCacheCleanup();
    } catch (error) {
      console.error('Failed to initialize local processing:', error);
      // Fallback to Google Workspace
      this.setupGoogleWorkspaceFallback();
    }
  }

  private setupCacheCleanup(): void {
    setInterval(
      () => {
        const now = Date.now();
        for (const [key, value] of this.localCache.entries()) {
          if (now - value.timestamp > this.CACHE_TTL) {
            this.localCache.delete(key);
          }
        }
      },
      60 * 60 * 1000
    ); // Clean up every hour
  }

  private async setupGoogleWorkspaceFallback(): Promise<void> {
    // Initialize Google Workspace connections
    // This will be our fallback if local processing fails
    try {
      await this.initializeGoogleAPIs();
    } catch (error) {
      console.error('Failed to initialize Google Workspace fallback:', error);
    }
  }

  private getCachedData(key: string): any | null {
    const cached = this.localCache.get(key);
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return cached.data;
    }
    return null;
  }

  private setCachedData(key: string, data: any): void {
    this.localCache.set(key, {
      data,
      timestamp: Date.now(),
    });
  }

  async processSignal(signal: DemandSignal): Promise<ProcessedSignal> {
    // Try local processing first
    try {
      if (this.isOllamaAvailable) {
        return await this.processLocally(signal);
      }
    } catch (error) {
      console.warn('Local processing failed, falling back to Google Trends:', error);
    }

    // Fallback to Google Trends
    return await this.processWithGoogleTrends(signal);
  }

  private async processLocally(signal: DemandSignal): Promise<ProcessedSignal> {
    const cacheKey = `signal_${signal.id}`;
    const cached = this.getCachedData(cacheKey);
    if (cached) return cached;

    const processed = await this.parallelProcessor.process([
      () => this.demandInference.inferFromBehavior(signal),
      () => this.matchingEngine.findMatches(signal),
      () => this.analyzeWithOllama(signal),
    ]);

    const result: ProcessedSignal = {
      id: signal.id,
      signal,
      timestamp: new Date().toISOString(),
      analysis: {
        sentiment: processed[0].sentiment,
        topics: processed[0].topics.map((topic) => ({
          name: topic,
          confidence: processed[2].confidence,
          keywords: processed[0].keywords || [],
        })),
        features: {
          technical: processed[2].insights.map((insight) => ({
            name: insight,
            sentiment: processed[0].sentiment,
            confidence: processed[2].confidence,
            mentions: 1,
            context: [],
          })),
        },
        relationships: {
          relatedSignals: processed[1].map((match) => match.id),
          crossReferences: [],
        },
      },
      metadata: {
        processingTime: Date.now(),
        provider: this.model,
        confidence: processed[2].confidence,
      },
    };

    this.setCachedData(cacheKey, result);
    return result;
  }

  private async analyzeWithOllama(signal: DemandSignal): Promise<OllamaAnalysis> {
    const prompt = `Analyze this demand signal and provide insights:
      Title: ${signal.title}
      Content: ${signal.content}
      Source: ${signal.source}
      Type: ${signal.type}`;

    return new Promise((resolve, reject) => {
      const process = spawn('ollama', ['run', this.model, prompt], {
        env: {
          ...process.env,
          OLLAMA_ORIGINS: '*',
          OLLAMA_HOST: 'localhost:11434',
        },
      });

      let output = '';
      process.stdout.on('data', (data) => {
        output += data.toString();
      });

      process.on('close', (code) => {
        if (code === 0) {
          try {
            const analysis = JSON.parse(output);
            resolve(analysis);
          } catch (error) {
            reject(new Error('Failed to parse Ollama output'));
          }
        } else {
          reject(new Error(`Ollama process exited with code ${code}`));
        }
      });
    });
  }

  private async processWithGoogleTrends(signal: DemandSignal): Promise<ProcessedSignal> {
    // Use Google Trends for validation and analysis
    const trendData = await this.googleTrends.fetchTrendData(signal.title);

    return {
      id: signal.id,
      signal,
      timestamp: new Date().toISOString(),
      analysis: {
        sentiment: trendData.momentum || 0,
        topics: [
          {
            name: signal.title,
            confidence: trendData.volume || 0.7,
            keywords: signal.keyPoints || [],
          },
        ],
        features: {
          market: signal.keyPoints.map((point) => ({
            name: point,
            sentiment: trendData.momentum || 0,
            confidence: trendData.volume || 0.7,
            mentions: 1,
            context: [],
          })),
        },
        relationships: {
          relatedSignals: [],
          crossReferences: [],
        },
      },
      metadata: {
        processingTime: Date.now(),
        provider: 'google-trends',
        confidence: trendData.volume || 0.7,
      },
    };
  }

  async processSignalBatch(signals: DemandSignal[]): Promise<ProcessedSignal[]> {
    try {
      this.status = 'processing';
      const tasks = signals.map((signal, index) => ({
        id: `task_${index}`,
        signal,
        timestamp: new Date().toISOString(),
      }));

      const results = await this.parallelProcessor.processInParallel(tasks);
      this.status = 'ready';
      return results;
    } catch (error) {
      this.status = 'error';
      throw error;
    }
  }

  getStatus(): ProviderStatus {
    return this.status;
  }
}
