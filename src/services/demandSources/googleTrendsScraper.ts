import { DemandSource } from './demandSource';
import { ScrapedDemandSignal } from '../../types/demandTypes';
import { logger } from '../../utils/logger';
import {
  TrendData,
  RelatedQueryData,
  RegionalInterestData,
  TrendMetrics,
} from '../../types/googleTrendsTypes';
import googleTrends from 'google-trends-api';
import IntelligenceCoordinator, { IntelligenceEvent } from '../../utils/intelligenceCoordinator';
import { LocalIntelligence } from '../analysis/localIntelligence';

export class GoogleTrendsScraper implements DemandSource {
  name = 'googleTrends';
  private coordinator: IntelligenceCoordinator;
  private localIntelligence: LocalIntelligence;

  constructor() {
    this.coordinator = IntelligenceCoordinator.getInstance();
    this.localIntelligence = LocalIntelligence.getInstance();
  }

  async scrape(query: string, options?: any): Promise<ScrapedDemandSignal[]> {
    try {
      logger.info('Starting Google Trends scrape', { query });

      const [interestOverTime, relatedQueries, regionalInterest] = await Promise.all([
        this.getInterestOverTime(query),
        this.getRelatedQueries(query),
        this.getRegionalInterest(query),
      ]);

      logger.info('Got Google Trends data', { 
        timelinePoints: interestOverTime.length,
        relatedQueries: relatedQueries.length,
        regions: Object.keys(regionalInterest).length 
      });

      const trendMetrics = this.analyzeTrends(interestOverTime, regionalInterest);
      let signal = this.createSignal(query, trendMetrics, relatedQueries);

      // Enrich signal with local intelligence
      signal = await this.localIntelligence.enrichSignal(signal);

      this.coordinator.emit('source:enriched', {
        sourceId: 'google_trends',
        type: 'external',
        operation: 'enrichSignal',
        status: 'success',
        data: signal
      } as IntelligenceEvent);

      return [signal];
    } catch (error: any) {
      logger.error('Error scraping Google Trends', { error: error.message, query });
      throw error;
    }
  }

  private async getInterestOverTime(query: string): Promise<TrendData[]> {
    try {
      this.coordinator.emit('source:request', {
        sourceId: 'google_trends',
        type: 'external',
        operation: 'interestOverTime',
        params: { query }
      } as IntelligenceEvent);

      const result = await googleTrends.interestOverTime({
        keyword: query,
        startTime: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
      });
      
      const data = JSON.parse(result);
      let timelineData: TrendData[] = [];

      if (data?.default?.timelineData) {
        timelineData = data.default.timelineData.map((point: any) => ({
          time: point.time || '',
          value: point.value?.[0] || 0,
          formattedTime: point.formattedTime || '',
        }));
      }

      this.coordinator.emit('source:response', {
        sourceId: 'google_trends',
        type: 'external',
        operation: 'interestOverTime',
        status: 'success',
        data: timelineData
      } as IntelligenceEvent);

      return timelineData;
    } catch (error: any) {
      this.coordinator.emit('source:error', {
        sourceId: 'google_trends',
        type: 'external',
        operation: 'interestOverTime',
        error: error.message
      } as IntelligenceEvent);
      throw error;
    }
  }

  private async getRegionalInterest(query: string): Promise<Record<string, number>> {
    try {
      this.coordinator.emit('source:request', {
        sourceId: 'google_trends',
        type: 'external',
        operation: 'regionalInterest',
        params: { query }
      } as IntelligenceEvent);

      const result = await googleTrends.interestByRegion({
        keyword: query,
        resolution: 'COUNTRY',
      });
      
      const data = JSON.parse(result);
      const regionalData: Record<string, number> = {};

      if (data?.default?.geoMapData) {
        data.default.geoMapData.forEach((region: any) => {
          if (region.geoName && region.value?.[0] !== undefined) {
            regionalData[region.geoName] = region.value[0];
          }
        });
      }

      this.coordinator.emit('source:response', {
        sourceId: 'google_trends',
        type: 'external',
        operation: 'regionalInterest',
        status: 'success',
        data: regionalData
      } as IntelligenceEvent);

      return regionalData;
    } catch (error: any) {
      this.coordinator.emit('source:error', {
        sourceId: 'google_trends',
        type: 'external',
        operation: 'regionalInterest',
        error: error.message
      } as IntelligenceEvent);
      throw error;
    }
  }

  private async getRelatedQueries(query: string): Promise<string[]> {
    try {
      this.coordinator.emit('source:request', {
        sourceId: 'google_trends',
        type: 'external',
        operation: 'relatedQueries',
        params: { query }
      } as IntelligenceEvent);

      const result = await googleTrends.relatedQueries({
        keyword: query
      });

      const data = JSON.parse(result);
      let queries: string[] = [];
      
      if (data?.default?.rankedList?.[0]?.rankedKeyword) {
        queries = data.default.rankedList[0].rankedKeyword
          .map((item: any) => item.query)
          .slice(0, 5);
      }

      this.coordinator.emit('source:response', {
        sourceId: 'google_trends',
        type: 'external',
        operation: 'relatedQueries',
        status: 'success',
        data: queries
      } as IntelligenceEvent);

      return queries;
    } catch (error: any) {
      this.coordinator.emit('source:error', {
        sourceId: 'google_trends',
        type: 'external',
        operation: 'relatedQueries',
        error: error.message
      } as IntelligenceEvent);
      throw error;
    }
  }

  private analyzeTrends(timelineData: TrendData[], regionalData: Record<string, number>): TrendMetrics {
    const values = timelineData.map(d => d.value);
    const volume = Math.max(...values);
    const momentum = this.calculateMomentum(values);
    const velocity = this.calculateVelocity(values);
    const acceleration = this.calculateAcceleration(values);
    const seasonality = this.calculateSeasonality(values);
    const geographicSpread = regionalData;

    return {
      volume,
      momentum,
      velocity,
      acceleration,
      seasonality,
      geographicSpread,
    };
  }

  private calculateMomentum(values: number[]): number {
    const recentValues = values.slice(-7); // Last week
    return recentValues.reduce((a, b) => a + b, 0) / recentValues.length;
  }

  private calculateVelocity(values: number[]): number {
    const changes = values.slice(1).map((v, i) => v - values[i]);
    return changes.reduce((a, b) => a + b, 0) / changes.length;
  }

  private calculateAcceleration(values: number[]): number {
    const velocities = values.slice(1).map((v, i) => v - values[i]);
    const accelerations = velocities.slice(1).map((v, i) => v - velocities[i]);
    return accelerations.reduce((a, b) => a + b, 0) / accelerations.length;
  }

  private calculateSeasonality(values: number[]): number {
    // Simple seasonality score based on variance
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const variance = values.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / values.length;
    return Math.sqrt(variance) / mean;
  }

  private createSignal(
    query: string,
    metrics: TrendMetrics,
    relatedQueries: string[]
  ): ScrapedDemandSignal {
    const now = new Date().toISOString();
    
    return {
      id: `gt_${query}_${Date.now()}`,
      query,
      title: `Google Trends: ${query}`,
      content: `Trend analysis for "${query}" with related queries: ${relatedQueries.join(', ')}`,
      url: `https://trends.google.com/trends/explore?q=${encodeURIComponent(query)}`,
      timestamp: now,
      trendMetrics: metrics,
      confidence: {
        overall: 0.85,
        factors: {
          textQuality: 0.9,
          communityEngagement: 0.8,
          authorCredibility: 0.95,
          contentRelevance: 0.85,
          temporalRelevance: 0.9,
        },
      },
      context: {
        thread: {
          id: `gt_${query}`,
          depth: 0,
          isOriginalPost: true,
        },
        author: {
          id: 'google_trends',
          domainActivity: 1,
        },
        community: {
          name: 'Google Trends',
          topicRelevance: 0.9,
          activityLevel: 1,
        },
      },
      analysis: {
        sentiment: 0,
        topics: [{
          name: query,
          confidence: 1,
          keywords: relatedQueries,
        }],
        pricePoints: [],
        features: {},
        relationships: {
          relatedThreads: [],
          crossReferences: [],
          temporalConnections: [],
        },
      },
      metadata: {
        processingTime: Date.now(),
        extractionVersion: '1.0.0',
        dataQualityScore: 0.9,
        source: 'google_trends',
        sourceWeight: 0.8,
      },
    };
  }

  validateSignal(signal: ScrapedDemandSignal): boolean {
    return (
      !!signal.id &&
      !!signal.timestamp &&
      !!signal.trendMetrics &&
      typeof signal.trendMetrics.momentum === 'number' &&
      typeof signal.trendMetrics.volume === 'number' &&
      typeof signal.trendMetrics.velocity === 'number' &&
      typeof signal.trendMetrics.acceleration === 'number' &&
      typeof signal.trendMetrics.seasonality === 'number' &&
      !!signal.trendMetrics.geographicSpread
    );
  }
}
