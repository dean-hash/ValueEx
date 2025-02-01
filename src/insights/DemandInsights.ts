import { EventEmitter } from 'events';
import { MetricsCollector } from '../metrics/MetricsCollector';
import { CorrelationAnalyzer } from '../analysis/CorrelationAnalyzer';
import {
  Pattern,
  Correlation,
  Trend,
  ContextualSignal,
  ExtendedCorrelation,
  ExtendedTrend,
  ExtendedContextualSignal
} from '../types';

export interface Signal {
  topic: string;
  confidence: number;
  signals?: string[];
  relationshipStrength?: number;
  averageConfidence?: number;
}

export class DemandInsights extends EventEmitter {
  private static instance: DemandInsights;
  private signals: Signal[] = [];
  private metricsCollector: MetricsCollector;
  private correlationAnalyzer: CorrelationAnalyzer;

  private constructor(metricsCollector: MetricsCollector) {
    super();
    this.metricsCollector = metricsCollector;
    this.correlationAnalyzer = new CorrelationAnalyzer(metricsCollector);
  }

  public static getInstance(metricsCollector: MetricsCollector): DemandInsights {
    if (DemandInsights.instance === undefined || DemandInsights.instance === null) {
      DemandInsights.instance = new DemandInsights(metricsCollector);
    }
    return DemandInsights.instance;
  }

  public getEmergingPatterns(): Signal[] {
    return this.signals;
  }

  public getRelatedTopics(topic: string): Signal[] {
    return this.signals.filter((s) => s.topic !== topic);
  }

  public allSignals(): Signal[] {
    return this.signals;
  }

  public addSignal(signal: Signal): void {
    this.signals.push(signal);
    this.emit('signalAdded', signal);
  }

  public updateSignal(topic: string, updates: Partial<Signal>): void {
    const index = this.signals.findIndex((s) => s.topic === topic);
    if (index !== -1) {
      this.signals[index] = { ...this.signals[index], ...updates };
      this.emit('signalUpdated', this.signals[index]);
    }
  }

  public removeSignal(topic: string): void {
    const index = this.signals.findIndex((s) => s.topic === topic);
    if (index !== -1) {
      const removed = this.signals.splice(index, 1)[0];
      this.emit('signalRemoved', removed);
    }
  }

  public async getCorrelations(): Promise<ExtendedCorrelation[]> {
    const metrics = await this.metricsCollector.getLatestMetricValues();
    const metricIds = metrics.map(m => m.id);
    const correlations = await this.correlationAnalyzer.findCorrelations(metricIds);
    
    return correlations.map(correlation => ({
      ...correlation,
      sourceA: correlation.sources[0],
      sourceB: correlation.sources[1],
      confidence: 0.8 // Example confidence value
    }));
  }

  public async getTrends(): Promise<ExtendedTrend[]> {
    const metrics = await this.metricsCollector.getLatestMetricValues();
    const metricIds = metrics.map(m => m.id);
    const trends = await this.correlationAnalyzer.analyzeTrends(metricIds);
    
    return trends.map(trend => ({
      ...trend,
      direction: trend.trend.direction,
      confidence: trend.trend.confidence
    }));
  }

  public async getLatestSignals(): Promise<ExtendedContextualSignal[]> {
    const metrics = await this.metricsCollector.getLatestMetricValues();
    
    return metrics.map(metric => ({
      id: `signal-${metric.id}`,
      name: metric.name,
      strength: Math.random(), // Example strength calculation
      context: {
        value: metric.value,
        timestamp: metric.timestamp
      },
      confidence: 0.7 // Example confidence value
    }));
  }

  public async detectPatterns(metricId: string): Promise<Pattern[]> {
    return this.correlationAnalyzer.detectPatterns(metricId);
  }

  public async getEmergingTrends(): Promise<Trend[]> {
    const metrics = await this.metricsCollector.getLatestMetricValues();
    const metricIds = metrics.map(m => m.id);
    return this.correlationAnalyzer.analyzeTrends(metricIds);
  }

  public async getContextualSignals(): Promise<ContextualSignal[]> {
    const metrics = await this.metricsCollector.getLatestMetricValues();
    
    return metrics.map(metric => ({
      id: `signal-${metric.id}`,
      name: metric.name,
      strength: Math.random(),
      context: {
        value: metric.value,
        timestamp: metric.timestamp
      }
    }));
  }
}
