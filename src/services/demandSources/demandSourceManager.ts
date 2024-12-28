import { ScrapedDemandSignal, DemandPattern } from '../../types/demandTypes';
import { RedditScraper } from './redditScraper';
import { TwitterScraper } from './twitterScraper';
import { GoogleTrendsScraper } from './googleTrendsScraper';
import { EcommerceScraper } from './ecommerceScraper';
import { logger } from '../../utils/logger';

export interface DemandSource {
  name: string;
  weight: number;
  scrape(query: string, options?: any): Promise<ScrapedDemandSignal[]>;
  validateSignal(signal: ScrapedDemandSignal): boolean;
}

export class DemandSourceManager {
  private sources: Map<string, DemandSource> = new Map();
  private sourceWeights: Map<string, number> = new Map();

  constructor() {
    // Initialize default sources
    this.registerSource('reddit', new RedditScraper(), 0.3);
    this.registerSource('twitter', new TwitterScraper(), 0.25);
    this.registerSource('googleTrends', new GoogleTrendsScraper(), 0.25);
    this.registerSource('ecommerce', new EcommerceScraper(), 0.2);
  }

  public registerSource(name: string, source: DemandSource, weight: number) {
    if (weight < 0 || weight > 1) {
      throw new Error('Source weight must be between 0 and 1');
    }
    this.sources.set(name, source);
    this.sourceWeights.set(name, weight);
    this.normalizeWeights();
  }

  private normalizeWeights() {
    const totalWeight = Array.from(this.sourceWeights.values()).reduce(
      (sum, weight) => sum + weight,
      0
    );
    if (totalWeight > 0) {
      for (const [source, weight] of this.sourceWeights) {
        this.sourceWeights.set(source, weight / totalWeight);
      }
    }
  }

  public async gatherDemandSignals(query: string, options?: any): Promise<ScrapedDemandSignal[]> {
    const allSignals: ScrapedDemandSignal[] = [];
    const errors: Error[] = [];

    await Promise.all(
      Array.from(this.sources.entries()).map(async ([sourceName, source]) => {
        try {
          logger.info(`Gathering signals from ${sourceName}`, { query });
          const signals = await source.scrape(query, options);
          const validSignals = signals.filter((signal) => source.validateSignal(signal));

          // Add source metadata to each signal
          validSignals.forEach((signal) => {
            signal.metadata.source = sourceName;
            signal.metadata.sourceWeight = this.sourceWeights.get(sourceName) || 0;
          });

          allSignals.push(...validSignals);
          logger.info(`Gathered ${validSignals.length} valid signals from ${sourceName}`);
        } catch (error) {
          logger.error(`Error gathering signals from ${sourceName}`, { error });
          errors.push(error as Error);
        }
      })
    );

    if (errors.length > 0 && allSignals.length === 0) {
      throw new Error(
        `Failed to gather signals from all sources: ${errors.map((e) => e.message).join(', ')}`
      );
    }

    return this.aggregateSignals(allSignals);
  }

  private aggregateSignals(signals: ScrapedDemandSignal[]): ScrapedDemandSignal[] {
    // Group signals by topic/theme
    const groupedSignals = new Map<string, ScrapedDemandSignal[]>();

    signals.forEach((signal) => {
      const key = this.getSignalKey(signal);
      if (!groupedSignals.has(key)) {
        groupedSignals.set(key, []);
      }
      groupedSignals.get(key)!.push(signal);
    });

    // Aggregate each group
    const aggregatedSignals: ScrapedDemandSignal[] = [];

    groupedSignals.forEach((groupSignals, key) => {
      const aggregated = this.aggregateSignalGroup(groupSignals);
      if (aggregated) {
        aggregatedSignals.push(aggregated);
      }
    });

    return this.rankSignals(aggregatedSignals);
  }

  private getSignalKey(signal: ScrapedDemandSignal): string {
    // Create a unique key based on signal topics and context
    const topics = signal.analysis.topics
      .map((t) => t.name)
      .sort()
      .join('|');
    return `${topics}-${signal.context.community.name}`;
  }

  private aggregateSignalGroup(signals: ScrapedDemandSignal[]): ScrapedDemandSignal | null {
    if (!signals.length) return null;

    // Use the first signal as the base
    const base = signals[0];

    // Combine confidences
    const overallConfidence = signals.reduce((sum, signal) => {
      const weight = signal.metadata.sourceWeight || 1 / signals.length;
      return sum + signal.confidence.overall * weight;
    }, 0);

    return {
      ...base,
      confidence: {
        ...base.confidence,
        overall: overallConfidence,
      },
      metadata: {
        ...base.metadata,
        aggregatedCount: signals.length,
        sources: signals
          .map((s) => s.metadata.source)
          .filter((v): v is string => v !== undefined)
          .filter((v, i, a) => a.indexOf(v) === i),
      },
    };
  }

  private rankSignals(signals: ScrapedDemandSignal[]): ScrapedDemandSignal[] {
    return signals.sort((a, b) => {
      // Rank by confidence and number of sources
      const aScore = a.confidence.overall * (a.metadata.sources?.length || 1);
      const bScore = b.confidence.overall * (b.metadata.sources?.length || 1);
      return bScore - aScore;
    });
  }
}
