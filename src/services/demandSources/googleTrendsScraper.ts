import { DemandSource } from './demandSourceManager';
import { ScrapedDemandSignal } from '../../types/demandTypes';
import { logger } from '../../utils/logger';
import {
  GoogleTrendsResult,
  GoogleTrendsTimelineData,
  TrendData,
  TrendMetrics,
} from '../../types/googleTrendsTypes';
import googleTrends from 'google-trends-api';

export class GoogleTrendsScraper implements DemandSource {
  name = 'googleTrends';
  weight = 0.25;

  async scrape(query: string, options?: any): Promise<ScrapedDemandSignal[]> {
    try {
      const [interestOverTime, relatedQueries, regionalInterest] = await Promise.all([
        this.getInterestOverTime(query),
        this.getRelatedQueries(query),
        this.getRegionalInterest(query),
      ]);

      const trendMetrics = this.analyzeTrends(interestOverTime, regionalInterest);
      const signal = this.createSignal(query, trendMetrics, relatedQueries);

      return [signal];
    } catch (error) {
      logger.error('Error scraping Google Trends', { error, query });
      return [];
    }
  }

  private async getInterestOverTime(keyword: string): Promise<TrendData> {
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

    const result = await googleTrends.interestOverTime({
      keyword,
      startTime: oneYearAgo,
      granularTimeResolution: true,
    });

    const data: GoogleTrendsResult = JSON.parse(result);
    const timeline = data.default.timelineData.map((point) => ({
      timestamp: point.time,
      value: point.value[0],
    }));

    const values = timeline.map((t) => t.value);
    const average = values.reduce((a, b) => a + b, 0) / values.length;
    const momentum = this.calculateMomentum(values);
    const seasonality = this.calculateSeasonality(values);

    return {
      keyword,
      timeline,
      average,
      momentum,
      seasonality,
    };
  }

  private async getRelatedQueries(
    keyword: string
  ): Promise<Array<{ query: string; correlation: number }>> {
    const result = await googleTrends.relatedQueries({ keyword });
    const data = JSON.parse(result);

    return data.default.rankedList[0].rankedKeyword.map((item: any) => ({
      query: item.query,
      correlation: item.value / 100,
    }));
  }

  private async getRegionalInterest(keyword: string): Promise<{ global: number; local: number }> {
    const result = await googleTrends.interestByRegion({
      keyword,
      resolution: 'COUNTRY',
    });

    const data = JSON.parse(result);
    const values = data.default.geoMapData.map((item: any) => item.value);

    return {
      global: Math.max(...values) / 100,
      local: values.reduce((a: number, b: number) => a + b, 0) / values.length / 100,
    };
  }

  private calculateMomentum(values: number[]): number {
    if (values.length < 2) return 0;

    const recentValues = values.slice(-12); // Last 12 data points
    const olderValues = values.slice(-24, -12); // Previous 12 data points

    const recentAvg = recentValues.reduce((a, b) => a + b, 0) / recentValues.length;
    const olderAvg = olderValues.reduce((a, b) => a + b, 0) / olderValues.length;

    return (recentAvg - olderAvg) / olderAvg;
  }

  private calculateSeasonality(values: number[]): number {
    if (values.length < 52) return 0; // Need at least a year of data

    const weeklyAverages = new Array(52).fill(0);
    values.forEach((value, index) => {
      const week = index % 52;
      weeklyAverages[week] += value;
    });

    const yearsOfData = Math.floor(values.length / 52);
    weeklyAverages.forEach((sum, index) => {
      weeklyAverages[index] = sum / yearsOfData;
    });

    const totalAverage = weeklyAverages.reduce((a, b) => a + b, 0) / 52;
    const seasonalityScore =
      weeklyAverages.reduce((acc, val) => {
        const deviation = Math.abs(val - totalAverage);
        return acc + deviation / totalAverage;
      }, 0) / 52;

    return seasonalityScore;
  }

  private calculateVolatility(values: number[]): number {
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const squaredDiffs = values.map((v) => Math.pow(v - mean, 2));
    const variance = squaredDiffs.reduce((a, b) => a + b, 0) / values.length;
    return Math.sqrt(variance) / mean; // Coefficient of variation
  }

  private analyzeTrends(
    interestData: TrendData,
    regionalData: { global: number; local: number }
  ): TrendMetrics {
    const values = interestData.timeline.map((t) => t.value);

    return {
      currentValue: values[values.length - 1] / 100,
      historicalAverage: interestData.average / 100,
      momentum: interestData.momentum,
      seasonalityScore: interestData.seasonality,
      volatility: this.calculateVolatility(values),
      regionalSpread: {
        global: regionalData.global,
        local: regionalData.local,
        ratio: regionalData.local / regionalData.global,
      },
      relatedQueries: [], // Will be filled later
    };
  }

  private createSignal(
    query: string,
    metrics: TrendMetrics,
    relatedQueries: Array<{ query: string; correlation: number }>
  ): ScrapedDemandSignal {
    const timestamp = new Date().toISOString();

    // Calculate confidence based on data quality
    const confidenceFactors = {
      textQuality: 1.0, // Google Trends data is structured
      communityEngagement: metrics.currentValue,
      authorCredibility: 1.0, // Google is authoritative
      contentRelevance: this.calculateRelevance(metrics),
      temporalRelevance: this.calculateTemporalRelevance(metrics),
    };

    const overallConfidence =
      Object.values(confidenceFactors).reduce((sum, score) => sum + score, 0) / 5;

    return {
      id: `google-trends-${query}-${timestamp}`,
      title: `Trend Analysis: ${query}`,
      content: `Market demand analysis for "${query}" shows ${this.describeTrend(metrics)}`,
      url: `https://trends.google.com/trends/explore?q=${encodeURIComponent(query)}`,
      timestamp,
      confidence: {
        overall: overallConfidence,
        factors: confidenceFactors,
      },
      context: {
        thread: {
          id: `trends-${query}`,
          depth: 0,
          isOriginalPost: true,
        },
        author: {
          id: 'google-trends',
        },
        community: {
          name: 'google-trends',
          size: 1e9, // Google's reach is massive
          topicRelevance: 1.0,
          activityLevel: metrics.currentValue,
        },
      },
      analysis: {
        sentiment: this.calculateSentiment(metrics),
        topics: [
          {
            name: query,
            confidence: metrics.currentValue,
            keywords: relatedQueries.map((q) => q.query),
          },
        ],
        pricePoints: [],
        features: {},
        relationships: {
          relatedThreads: [],
          crossReferences: relatedQueries.map((q) => q.query),
          temporalConnections: [],
        },
      },
      metadata: {
        processingTime: Date.now(),
        extractionVersion: '1.0.0',
        dataQualityScore: this.calculateDataQuality(metrics),
        source: 'google-trends',
        sourceWeight: this.weight,
      },
    };
  }

  private calculateRelevance(metrics: TrendMetrics): number {
    return (
      metrics.currentValue * 0.3 +
      metrics.regionalSpread.ratio * 0.3 +
      (1 - metrics.volatility) * 0.4
    );
  }

  private calculateTemporalRelevance(metrics: TrendMetrics): number {
    const momentumFactor = Math.min(Math.max(metrics.momentum + 1, 0), 1);
    const seasonalityFactor = 1 - metrics.seasonalityScore;
    return momentumFactor * 0.7 + seasonalityFactor * 0.3;
  }

  private calculateSentiment(metrics: TrendMetrics): number {
    const momentum = Math.tanh(metrics.momentum); // Normalize to [-1, 1]
    const popularity = metrics.currentValue / metrics.historicalAverage - 1;
    return momentum * 0.7 + Math.tanh(popularity) * 0.3;
  }

  private calculateDataQuality(metrics: TrendMetrics): number {
    return (
      (1 - metrics.volatility) * 0.4 +
      metrics.currentValue * 0.3 +
      (1 - metrics.seasonalityScore) * 0.3
    );
  }

  private describeTrend(metrics: TrendMetrics): string {
    const momentum = metrics.momentum > 0 ? 'increasing' : 'decreasing';
    const intensity = metrics.currentValue > metrics.historicalAverage ? 'above' : 'below';
    const volatility = metrics.volatility > 0.5 ? 'volatile' : 'stable';
    const spread = metrics.regionalSpread.ratio > 1 ? 'concentrated' : 'widespread';

    return (
      `${momentum} interest with ${intensity} average engagement. ` +
      `Trend is ${volatility} and ${spread} geographically.`
    );
  }

  validateSignal(signal: ScrapedDemandSignal): boolean {
    return (
      !!signal.id &&
      !!signal.timestamp &&
      !!signal.confidence?.overall &&
      signal.confidence.overall >= 0 &&
      signal.confidence.overall <= 1
    );
  }
}
