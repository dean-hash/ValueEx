import { EventEmitter } from 'events';
import { MarketTrendAdapter } from './marketTrendAdapter';

interface DemandSignal {
  category: string;
  region: string;
  timestamp: string;
  strength: number;
  type: 'search' | 'social' | 'marketplace' | 'direct';
  context: {
    keywords: string[];
    relatedCategories: string[];
    sentiment?: number;
  };
}

interface DemandPrediction {
  category: string;
  region: string;
  timestamp: string;
  predictedDemand: number;
  confidence: number;
  factors: {
    type: string;
    impact: number;
    confidence: number;
  }[];
}

export interface IntelligenceProvider {
  name: string;
  type: 'research' | 'processing' | 'monitoring';
  processSignal(signal: DemandSignal): Promise<DemandSignal>;
  confidence: number;
}

export class DemandSignalAdapter extends EventEmitter {
  private static instance: DemandSignalAdapter;
  private marketTrends: MarketTrendAdapter;
  private recentSignals: Map<string, DemandSignal[]> = new Map();
  private predictions: Map<string, DemandPrediction> = new Map();
  private intelligenceProviders: IntelligenceProvider[] = [];

  private constructor() {
    super();
    this.marketTrends = MarketTrendAdapter.getInstance();
    this.setupPredictionCycle();
  }

  public static getInstance(): DemandSignalAdapter {
    if (!DemandSignalAdapter.instance) {
      DemandSignalAdapter.instance = new DemandSignalAdapter();
    }
    return DemandSignalAdapter.instance;
  }

  private setupPredictionCycle(): void {
    // Update predictions every 15 minutes
    setInterval(() => {
      this.updatePredictions();
    }, 900000);
  }

  public async addSignal(signal: DemandSignal): Promise<void> {
    const key = `${signal.category}_${signal.region}`;
    if (!this.recentSignals.has(key)) {
      this.recentSignals.set(key, []);
    }

    const signals = this.recentSignals.get(key)!;
    signals.push(signal);

    // Keep only last 24 hours of signals
    const cutoff = new Date();
    cutoff.setHours(cutoff.getHours() - 24);

    this.recentSignals.set(
      key,
      signals.filter(s => new Date(s.timestamp) > cutoff)
    );

    // Add to market trends
    await this.marketTrends.addSignal(
      signal.category,
      signal.region,
      {
        timestamp: signal.timestamp,
        value: signal.strength,
        source: signal.type,
        keywords: signal.context.keywords,
        confidence: this.calculateSignalConfidence(signal)
      }
    );

    this.emit('signal_processed', {
      key,
      signalCount: signals.length,
      latestStrength: signal.strength
    });
  }

  private calculateSignalConfidence(signal: DemandSignal): number {
    // Base confidence by signal type
    const typeConfidence = {
      search: 0.8,
      social: 0.6,
      marketplace: 0.9,
      direct: 1.0
    }[signal.type];

    // Adjust based on context
    const contextScore = (
      (signal.context.keywords.length > 0 ? 0.2 : 0) +
      (signal.context.relatedCategories.length > 0 ? 0.2 : 0) +
      (signal.context.sentiment !== undefined ? 0.1 : 0)
    );

    return Math.min(typeConfidence + contextScore, 1);
  }

  private async updatePredictions(): Promise<void> {
    for (const [key, signals] of this.recentSignals.entries()) {
      if (signals.length === 0) continue;

      const [category, region] = key.split('_');
      const marketTrend = this.marketTrends.getTrend(category, region);

      if (!marketTrend) continue;

      const prediction = await this.generatePrediction(signals, marketTrend);
      this.predictions.set(key, prediction);

      this.emit('prediction_updated', prediction);
    }
  }

  private async generatePrediction(
    signals: DemandSignal[],
    marketTrend: any
  ): Promise<DemandPrediction> {
    const latestSignal = signals[signals.length - 1];
    const category = latestSignal.category;
    const region = latestSignal.region;

    // Calculate base demand from recent signals
    const recentStrength = signals
      .slice(-6) // Last 1.5 hours (assuming 15-min updates)
      .reduce((sum, s) => sum + s.strength, 0) / 6;

    // Factor in market trend
    const trendImpact = marketTrend.trend * marketTrend.velocity;

    // Calculate seasonal factors
    const seasonalImpact = this.calculateSeasonalImpact(signals);

    // Combine factors
    const factors = [
      {
        type: 'recent_signals',
        impact: recentStrength,
        confidence: 0.9
      },
      {
        type: 'market_trend',
        impact: trendImpact,
        confidence: 0.7
      },
      {
        type: 'seasonality',
        impact: seasonalImpact.impact,
        confidence: seasonalImpact.confidence
      }
    ];

    // Calculate predicted demand
    const predictedDemand = factors.reduce(
      (sum, factor) => sum + factor.impact * factor.confidence,
      0
    ) / factors.reduce((sum, factor) => sum + factor.confidence, 0);

    // Calculate overall confidence
    const confidence = factors.reduce(
      (sum, factor) => sum + factor.confidence,
      0
    ) / factors.length;

    return {
      category,
      region,
      timestamp: new Date().toISOString(),
      predictedDemand,
      confidence,
      factors
    };
  }

  private calculateSeasonalImpact(signals: DemandSignal[]): { impact: number; confidence: number } {
    const hourlyPatterns = new Array(24).fill(0);
    const hourlyCounts = new Array(24).fill(0);

    signals.forEach(signal => {
      const hour = new Date(signal.timestamp).getHours();
      hourlyPatterns[hour] += signal.strength;
      hourlyCounts[hour]++;
    });

    const hourlyAverages = hourlyPatterns.map((total, i) => 
      hourlyCounts[i] > 0 ? total / hourlyCounts[i] : 0
    );

    const currentHour = new Date().getHours();
    const impact = hourlyAverages[currentHour];
    
    // Confidence based on sample size
    const confidence = Math.min(hourlyCounts[currentHour] / 10, 1);

    return { impact, confidence };
  }

  public registerIntelligenceProvider(provider: IntelligenceProvider): void {
    this.intelligenceProviders.push(provider);
    this.emit('intelligence:registered', provider.name);
  }

  private async enrichSignal(signal: DemandSignal): Promise<DemandSignal> {
    let enrichedSignal = { ...signal };
    
    for (const provider of this.intelligenceProviders) {
      try {
        enrichedSignal = await provider.processSignal(enrichedSignal);
        this.emit('intelligence:processed', {
          provider: provider.name,
          confidence: provider.confidence
        });
      } catch (error) {
        this.emit('intelligence:error', {
          provider: provider.name,
          error: error.message
        });
      }
    }
    
    return enrichedSignal;
  }

  public getPrediction(category: string, region: string): DemandPrediction | null {
    const key = `${category}_${region}`;
    return this.predictions.get(key) || null;
  }

  public getAllPredictions(): DemandPrediction[] {
    return Array.from(this.predictions.values());
  }
}
