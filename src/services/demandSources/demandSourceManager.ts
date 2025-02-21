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
    const activeSourceWeights = new Map(this.sourceWeights);

    await Promise.all(
      Array.from(this.sources.entries()).map(async ([name, source]) => {
        try {
          const signals = await source.scrape(query, options);
          const validSignals = signals.filter((signal) => source.validateSignal(signal));

          // Apply source weight to confidence scores
          const weight = activeSourceWeights.get(name) || 0;
          validSignals.forEach((signal) => {
            signal.confidence *= weight;
            signal.source = name;
          });

          allSignals.push(...validSignals);
        } catch (error) {
          logger.error(`Error gathering signals from ${name}:`, error);
          errors.push(error as Error);
          // Remove failed source from active weights
          activeSourceWeights.delete(name);
          // Renormalize remaining weights
          const totalWeight = Array.from(activeSourceWeights.values()).reduce(
            (sum, w) => sum + w,
            0
          );
          if (totalWeight > 0) {
            for (const [src, weight] of activeSourceWeights) {
              activeSourceWeights.set(src, weight / totalWeight);
            }
          }
        }
      })
    );

    if (errors.length === this.sources.size) {
      throw new Error('All demand sources failed to gather signals');
    }

    return allSignals;
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
