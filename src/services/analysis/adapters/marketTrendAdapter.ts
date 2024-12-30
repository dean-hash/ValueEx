import { EventEmitter } from 'events';

interface MarketTrend {
  category: string;
  region: string;
  trend: number;
  velocity: number;
  signals: {
    source: string;
    strength: number;
    keywords: string[];
  }[];
}

interface TrendSignal {
  timestamp: string;
  value: number;
  source: string;
  keywords: string[];
  confidence: number;
}

export class MarketTrendAdapter extends EventEmitter {
  private static instance: MarketTrendAdapter;
  private activeSignals: Map<string, TrendSignal[]> = new Map();
  private trendCache: Map<string, MarketTrend> = new Map();

  private constructor() {
    super();
    this.setupSignalProcessing();
  }

  public static getInstance(): MarketTrendAdapter {
    if (!MarketTrendAdapter.instance) {
      MarketTrendAdapter.instance = new MarketTrendAdapter();
    }
    return MarketTrendAdapter.instance;
  }

  private setupSignalProcessing(): void {
    // Process signals every minute
    setInterval(() => {
      this.processActiveSignals();
    }, 60000);
  }

  public async addSignal(
    category: string,
    region: string,
    signal: TrendSignal
  ): Promise<void> {
    const key = `${category}_${region}`;
    if (!this.activeSignals.has(key)) {
      this.activeSignals.set(key, []);
    }
    
    const signals = this.activeSignals.get(key)!;
    signals.push(signal);
    
    // Keep only last 24 hours of signals
    const cutoff = new Date();
    cutoff.setHours(cutoff.getHours() - 24);
    
    this.activeSignals.set(
      key,
      signals.filter(s => new Date(s.timestamp) > cutoff)
    );

    // Process immediately if we have enough signals
    if (signals.length >= 10) {
      await this.processSignals(category, region);
    }
  }

  private async processSignals(category: string, region: string): Promise<void> {
    const key = `${category}_${region}`;
    const signals = this.activeSignals.get(key) || [];
    
    if (signals.length === 0) return;

    // Calculate trend
    const sortedSignals = [...signals].sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );

    const trend = this.calculateTrend(sortedSignals);
    const velocity = this.calculateVelocity(sortedSignals);
    
    // Group by source
    const sourceGroups = signals.reduce((groups: Map<string, TrendSignal[]>, signal) => {
      if (!groups.has(signal.source)) {
        groups.set(signal.source, []);
      }
      groups.get(signal.source)!.push(signal);
      return groups;
    }, new Map());

    // Calculate source strengths and collect keywords
    const signalStrengths = Array.from(sourceGroups.entries()).map(([source, sourceSignals]) => ({
      source,
      strength: this.calculateSourceStrength(sourceSignals),
      keywords: this.extractKeywords(sourceSignals)
    }));

    const marketTrend: MarketTrend = {
      category,
      region,
      trend,
      velocity,
      signals: signalStrengths
    };

    this.trendCache.set(key, marketTrend);
    
    this.emit('trend_updated', marketTrend);
  }

  private calculateTrend(signals: TrendSignal[]): number {
    const values = signals.map(s => s.value);
    const weights = signals.map(s => s.confidence);
    
    return values.reduce((sum, val, i) => sum + val * weights[i], 0) / 
           weights.reduce((sum, weight) => sum + weight, 0);
  }

  private calculateVelocity(signals: TrendSignal[]): number {
    if (signals.length < 2) return 0;

    const firstTimestamp = new Date(signals[0].timestamp).getTime();
    const lastTimestamp = new Date(signals[signals.length - 1].timestamp).getTime();
    const timeSpan = (lastTimestamp - firstTimestamp) / (1000 * 60 * 60); // hours

    const firstValue = signals[0].value;
    const lastValue = signals[signals.length - 1].value;

    return (lastValue - firstValue) / timeSpan;
  }

  private calculateSourceStrength(signals: TrendSignal[]): number {
    const recentSignals = signals.filter(s => {
      const signalTime = new Date(s.timestamp).getTime();
      const now = Date.now();
      return (now - signalTime) < 3600000; // Last hour
    });

    if (recentSignals.length === 0) return 0;

    return recentSignals.reduce((sum, s) => sum + s.confidence, 0) / recentSignals.length;
  }

  private extractKeywords(signals: TrendSignal[]): string[] {
    // Collect all keywords
    const keywordCounts = signals
      .flatMap(s => s.keywords)
      .reduce((counts: Map<string, number>, keyword) => {
        counts.set(keyword, (counts.get(keyword) || 0) + 1);
        return counts;
      }, new Map());

    // Sort by frequency and take top 10
    return Array.from(keywordCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([keyword]) => keyword);
  }

  public getTrend(category: string, region: string): MarketTrend | null {
    const key = `${category}_${region}`;
    return this.trendCache.get(key) || null;
  }

  public getAllTrends(): MarketTrend[] {
    return Array.from(this.trendCache.values());
  }

  private async processActiveSignals(): Promise<void> {
    for (const [key, signals] of this.activeSignals.entries()) {
      if (signals.length === 0) continue;
      
      const [category, region] = key.split('_');
      await this.processSignals(category, region);
    }
  }
}
