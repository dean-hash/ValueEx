import { EventEmitter } from 'events';
import { MetricsCollector } from '../collectors/MetricsCollector';
import type { 
  AnomalyData, 
  MultiSourceCorrelation, 
  PredictionResult, 
  TrendResult, 
  Trend, 
  Metric,
  Correlation,
  Pattern
} from '../types';

export class CorrelationAnalyzer extends EventEmitter {
  private static instance: CorrelationAnalyzer;
  private metricsCollector: MetricsCollector;

  private constructor(metricsCollector: MetricsCollector) {
    super();
    this.metricsCollector = metricsCollector;
  }

  public static getInstance(metricsCollector: MetricsCollector): CorrelationAnalyzer {
    if (!CorrelationAnalyzer.instance) {
      CorrelationAnalyzer.instance = new CorrelationAnalyzer(metricsCollector);
    }
    return CorrelationAnalyzer.instance;
  }

  public async detectPatterns(metricId: string): Promise<PredictionResult[]> {
    const metrics = await this.metricsCollector.getMetricHistory(metricId);
    const patterns: PredictionResult[] = metrics.map(metric => ({
      id: `pattern-${metric.id}`,
      name: `Pattern for ${metric.name}`,
      patterns: [metric.name],
      timestamps: [metric.timestamp],
      values: [metric.value],
      confidence: 0.8,
      timestamp: metric.timestamp,
      value: metric.value
    }));

    return patterns;
  }

  public async findCorrelations(metricIds: string[]): Promise<Correlation[]> {
    const metricsData = await Promise.all(
      metricIds.map(id => this.metricsCollector.getMetricHistory(id))
    );

    const correlations: Correlation[] = [];
    for (let i = 0; i < metricsData.length; i++) {
      for (let j = i + 1; j < metricsData.length; j++) {
        const correlation: Correlation = {
          id: `correlation-${i}-${j}`,
          sources: [metricIds[i], metricIds[j]],
          timestamps: metricsData[i].map(m => m.timestamp),
          values: metricsData[i].map(m => m.value),
          strength: this.calculateCorrelation(
            metricsData[i].map(m => m.value),
            metricsData[j].map(m => m.value)
          ),
          direction: 'positive'
        };
        correlations.push(correlation);
      }
    }

    return correlations;
  }

  public async analyzeTrends(metricIds: string[]): Promise<TrendResult[]> {
    const metricsData = await Promise.all(
      metricIds.map(id => this.metricsCollector.getMetricHistory(id))
    );

    const trends: TrendResult[] = metricsData.map((metrics, index) => {
      const values = metrics.map(m => m.value);
      const trend = this.calculateTrend(values);

      return {
        id: `trend-${metricIds[index]}`,
        name: `Trend for ${metricIds[index]}`,
        timestamps: metrics.map(m => m.timestamp),
        values: values,
        trend: {
          value: trend.value,
          direction: trend.direction,
          confidence: trend.confidence
        },
        confidence: trend.confidence
      };
    });

    return trends;
  }

  public getTemporalPatterns(data: Record<string, number>[]): PredictionResult[] {
    const patterns: Pattern[] = [];
    const metrics = Object.keys(data[0] || {});

    metrics.forEach(metric => {
      const values = data.map(d => d[metric]);
      const trend = this.calculateTrend(values);
      const confidence = this.calculatePredictionConfidence(values, trend, this.detectSeasonality(values));

      patterns.push({
        metric,
        patterns: [{
          id: `${metric}-trend`,
          value: trend,
          confidence,
          trend
        }]
      });
    });

    return patterns;
  }

  public getMultiSourceCorrelations(metrics: Record<string, number>[]): MultiSourceCorrelation[] {
    const correlations: Correlation[] = [];
    const metricNames = Object.keys(metrics[0] || {});

    for (let i = 0; i < metricNames.length; i++) {
      for (let j = i + 1; j < metricNames.length; j++) {
        const source1 = metricNames[i];
        const source2 = metricNames[j];
        const values1 = metrics.map(m => m[source1]);
        const values2 = metrics.map(m => m[source2]);
        const correlation = this.calculateCorrelation(values1, values2);
        const confidence = Math.abs(correlation);

        if (confidence > 0.3) {
          correlations.push({
            sources: [source1, source2],
            correlation,
            confidence
          });
        }
      }
    }

    return correlations;
  }

  public getTrends(data: Record<string, number>[]): TrendResult[] {
    const trends: Trend[] = [];
    const metrics = Object.keys(data[0] || {});

    metrics.forEach(metric => {
      const values = data.map(d => d[metric]);
      const trendValue = this.calculateTrend(values);
      const confidence = this.calculatePredictionConfidence(values, trendValue, this.detectSeasonality(values));

      trends.push({
        metric,
        trend: {
          value: trendValue,
          direction: trendValue > 0.1 ? 'up' : trendValue < -0.1 ? 'down' : 'stable',
          confidence
        }
      });
    });

    return trends;
  }

  public findRelatedMetrics(metric: string): string[] {
    // Implementation will be added later
    return [];
  }

  public detectAnomalies(data: Record<string, number>[]): AnomalyData[] {
    // Implementation will be added later
    return [];
  }

  private calculateCorrelation(x: number[], y: number[]): number {
    const n = Math.min(x.length, y.length);
    if (n < 2) return 0;

    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((a, b, i) => a + b * y[i], 0);
    const sumX2 = x.reduce((a, b) => a + b * b, 0);
    const sumY2 = y.reduce((a, b) => a + b * b, 0);

    const numerator = n * sumXY - sumX * sumY;
    const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));

    return denominator === 0 ? 0 : numerator / denominator;
  }

  private calculateTrend(values: number[]): number {
    if (values.length < 2) return 0;

    const n = values.length;
    const x = Array.from({ length: n }, (_, i) => i);
    return this.calculateCorrelation(x, values);
  }

  private detectSeasonality(values: number[]): number {
    // Simple seasonality detection using autocorrelation
    if (values.length < 4) return 0;

    const lags = Math.floor(values.length / 2);
    let maxCorrelation = 0;

    for (let lag = 2; lag < lags; lag++) {
      const series1 = values.slice(0, -lag);
      const series2 = values.slice(lag);
      const correlation = Math.abs(this.calculateCorrelation(series1, series2));
      maxCorrelation = Math.max(maxCorrelation, correlation);
    }

    return maxCorrelation;
  }

  private calculatePredictionConfidence(values: number[], trend: number, seasonality: number): number {
    const trendStrength = Math.abs(trend);
    const dataQuality = values.length > 10 ? 1 : values.length / 10;
    return (trendStrength * 0.4 + seasonality * 0.4 + dataQuality * 0.2);
  }

  private calculateCorrelation(valuesA: number[], valuesB: number[]): number {
    // Simple correlation calculation for demo
    // In production, use a proper statistical correlation method
    return 0.8;
  }

  private calculateTrend(values: number[]): { value: number; direction: 'up' | 'down' | 'stable'; confidence: number } {
    // Simple trend calculation for demo
    // In production, use proper trend analysis methods
    return {
      value: 0.5,
      direction: 'up',
      confidence: 0.7
    };
  }
}
