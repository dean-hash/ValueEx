import { EventEmitter } from 'events';
import { logger } from '../../utils/logger';
import { MetricsCollector } from '../monitoring/metrics';
import { ResourceMonitor } from '../monitoring/resourceMonitor';
import { AdaptiveThresholdManager } from '../monitoring/adaptiveThresholds';

interface CorrelationResult {
  metrics: string[];
  coefficient: number;
  confidence: number;
  timeWindow: number;
  pattern: 'direct' | 'inverse' | 'lagging' | 'leading';
  significance: number;
}

interface TrendAnalysis {
  metric: string;
  trend: 'increasing' | 'decreasing' | 'stable' | 'cyclical';
  confidence: number;
  period?: number;
  prediction?: number[];
}

interface ActionableInsight {
  type: 'performance' | 'resource' | 'demand' | 'pattern';
  priority: 'high' | 'medium' | 'low';
  insight: string;
  recommendation: string;
  metrics: string[];
  confidence: number;
}

interface TemporalPattern {
  type: 'seasonal' | 'daily' | 'weekly' | 'trend';
  confidence: number;
  period?: number;
  amplitude?: number;
  phase?: number;
}

interface MultiSourceCorrelation {
  sources: string[];
  correlation: number;
  confidence: number;
  lag?: number;
  causality?: 'direct' | 'inverse' | 'unknown';
}

interface ConfidenceFactors {
  sampleSize: number;
  variability: number;
  outlierImpact: number;
  signalStrength: number;
  noiseLevel: number;
}

interface WeightedCorrelation {
  correlation: number;
  weights: Map<string, number>;
  adjustedConfidence: number;
  factors: ConfidenceFactors;
}

interface ExtendedStatistics {
  mean: number;
  median: number;
  stdDev: number;
  skewness: number;
  kurtosis: number;
  quantiles: {
    q1: number;
    q3: number;
    iqr: number;
  };
}

interface AnomalyContext {
  value: number;
  timestamp: string;
  zscore: number;
  mad: number;
  contextualScore: number;
  seasonalityScore: number;
}

export class CorrelationAnalyzer extends EventEmitter {
  private static instance: CorrelationAnalyzer;
  private metrics: MetricsCollector;
  private resources: ResourceMonitor;
  private thresholds: AdaptiveThresholdManager;
  private correlations: Map<string, CorrelationResult[]> = new Map();
  private trends: Map<string, TrendAnalysis> = new Map();
  private insights: ActionableInsight[] = [];
  private temporalPatterns: Map<string, TemporalPattern[]> = new Map();
  private multiSourceCorrelations: Map<string, MultiSourceCorrelation[]> = new Map();

  private constructor() {
    super();
    this.metrics = MetricsCollector.getInstance();
    this.resources = ResourceMonitor.getInstance();
    this.thresholds = AdaptiveThresholdManager.getInstance();
    this.setupAnalysis();
  }

  public static getInstance(): CorrelationAnalyzer {
    if (!CorrelationAnalyzer.instance) {
      CorrelationAnalyzer.instance = new CorrelationAnalyzer();
    }
    return CorrelationAnalyzer.instance;
  }

  private setupAnalysis(): void {
    setInterval(() => {
      this.analyzeCorrelations();
      this.analyzeTrends();
      this.analyzeTemporalPatterns();
      this.analyzeMultiSourceCorrelations();
      this.generateInsights();
    }, 60000); // Run analysis every minute
  }

  private analyzeCorrelations(): void {
    try {
      const metrics = [
        'processing_time',
        'error_rate',
        'demand_pattern_strength',
        'cpu_usage',
        'memory_usage',
        'api_rate',
      ];

      // Analyze all metric pairs
      for (let i = 0; i < metrics.length; i++) {
        for (let j = i + 1; j < metrics.length; j++) {
          const result = this.calculateCorrelation(metrics[i], metrics[j]);
          if (result.coefficient > 0.7 || result.coefficient < -0.7) {
            this.correlations.set(`${metrics[i]}_${metrics[j]}`, [result]);

            if (result.confidence > 0.8) {
              this.emit('correlation_detected', result);
            }
          }
        }
      }
    } catch (error) {
      logger.error('Error analyzing correlations:', error);
    }
  }

  private calculateCorrelation(metric1: string, metric2: string): CorrelationResult {
    const values1 = this.getMetricValues(metric1);
    const values2 = this.getMetricValues(metric2);

    if (values1.length !== values2.length) {
      throw new Error('Metric series must have same length');
    }

    const n = values1.length;
    const mean1 = values1.reduce((a, b) => a + b) / n;
    const mean2 = values2.reduce((a, b) => a + b) / n;

    let sum = 0;
    let sum1Sq = 0;
    let sum2Sq = 0;

    for (let i = 0; i < n; i++) {
      const diff1 = values1[i] - mean1;
      const diff2 = values2[i] - mean2;
      sum += diff1 * diff2;
      sum1Sq += diff1 * diff1;
      sum2Sq += diff2 * diff2;
    }

    const coefficient = sum / Math.sqrt(sum1Sq * sum2Sq);
    const significance = this.calculateSignificance(coefficient, n);

    return {
      metrics: [metric1, metric2],
      coefficient,
      confidence: Math.abs(coefficient) * (1 - significance),
      timeWindow: n,
      pattern: coefficient > 0 ? 'direct' : 'inverse',
      significance,
    };
  }

  private calculateSignificance(coefficient: number, n: number): number {
    // Fisher transformation
    const z = 0.5 * Math.log((1 + coefficient) / (1 - coefficient));
    const se = 1 / Math.sqrt(n - 3);
    const t = z / se;

    // Simplified p-value calculation
    return 1 / (1 + Math.exp(-Math.abs(t)));
  }

  private analyzeTrends(): void {
    try {
      const metrics = this.getAvailableMetrics();

      metrics.forEach((metric) => {
        const values = this.getMetricValues(metric);
        const trend = this.detectTrend(values);

        if (trend.confidence > 0.7) {
          this.trends.set(metric, trend);
          this.emit('trend_detected', trend);
        }
      });
    } catch (error) {
      logger.error('Error analyzing trends:', error);
    }
  }

  private detectTrend(values: number[]): TrendAnalysis {
    if (values.length < 10) {
      return {
        metric: 'unknown',
        trend: 'stable',
        confidence: 0,
      };
    }

    const diffs = values.slice(1).map((v, i) => v - values[i]);
    const increasingCount = diffs.filter((d) => d > 0).length;
    const decreasingCount = diffs.filter((d) => d < 0).length;

    const trend =
      this.detectCyclicalPattern(values) ||
      (increasingCount > decreasingCount * 2
        ? 'increasing'
        : decreasingCount > increasingCount * 2
          ? 'decreasing'
          : 'stable');

    return {
      metric: 'metric_name',
      trend,
      confidence: Math.abs(increasingCount - decreasingCount) / diffs.length,
      prediction: this.predictNextValues(values),
    };
  }

  private detectCyclicalPattern(values: number[]): 'cyclical' | null {
    // Simple autocorrelation check
    const lag = Math.floor(values.length / 4);
    let correlation = 0;

    for (let i = 0; i < values.length - lag; i++) {
      correlation += (values[i] - values[i + lag]) ** 2;
    }

    correlation /= values.length - lag;
    return correlation < 0.1 ? 'cyclical' : null;
  }

  private predictNextValues(values: number[]): number[] {
    // Simple moving average prediction
    const window = 5;
    const ma = values.slice(-window).reduce((a, b) => a + b) / window;
    const trend = (values[values.length - 1] - values[values.length - window]) / window;

    return Array(3)
      .fill(0)
      .map((_, i) => ma + trend * (i + 1));
  }

  private analyzeTemporalPatterns(): void {
    try {
      const metrics = this.getAvailableMetrics();

      metrics.forEach((metric) => {
        const values = this.getMetricValues(metric);
        if (values.length < 24) return; // Need at least 24 hours of data

        const patterns: TemporalPattern[] = [];

        // Check for daily patterns
        const dailyPattern = this.detectDailyPattern(values);
        if (dailyPattern.confidence > 0.7) {
          patterns.push(dailyPattern);
        }

        // Check for weekly patterns
        if (values.length >= 168) {
          // 7 days * 24 hours
          const weeklyPattern = this.detectWeeklyPattern(values);
          if (weeklyPattern.confidence > 0.7) {
            patterns.push(weeklyPattern);
          }
        }

        // Check for seasonal patterns
        if (values.length >= 2160) {
          // 90 days * 24 hours
          const seasonalPattern = this.detectSeasonalPattern(values);
          if (seasonalPattern.confidence > 0.7) {
            patterns.push(seasonalPattern);
          }
        }

        if (patterns.length > 0) {
          this.temporalPatterns.set(metric, patterns);
          this.emit('temporal_pattern_detected', {
            metric,
            patterns,
          });
        }
      });
    } catch (error) {
      logger.error('Error analyzing temporal patterns:', error);
    }
  }

  private detectDailyPattern(values: number[]): TemporalPattern {
    const hours = 24;
    const segments = Math.floor(values.length / hours);
    const dailyAverages = new Array(hours).fill(0);

    // Calculate average for each hour
    for (let i = 0; i < segments * hours; i++) {
      const hour = i % hours;
      dailyAverages[hour] += values[i];
    }

    for (let i = 0; i < hours; i++) {
      dailyAverages[i] /= segments;
    }

    // Calculate pattern strength
    const totalVariance = this.calculateVariance(values);
    const patternVariance = this.calculateVariance(dailyAverages);
    const confidence = patternVariance / totalVariance;

    return {
      type: 'daily',
      confidence,
      period: 24,
      amplitude: Math.max(...dailyAverages) - Math.min(...dailyAverages),
      phase: dailyAverages.indexOf(Math.max(...dailyAverages)),
    };
  }

  private detectWeeklyPattern(values: number[]): TemporalPattern {
    const weekHours = 168; // 7 days * 24 hours
    const segments = Math.floor(values.length / weekHours);
    const weeklyAverages = new Array(weekHours).fill(0);

    // Calculate average for each hour of the week
    for (let i = 0; i < segments * weekHours; i++) {
      const hour = i % weekHours;
      weeklyAverages[hour] += values[i];
    }

    for (let i = 0; i < weekHours; i++) {
      weeklyAverages[i] /= segments;
    }

    // Calculate pattern strength
    const totalVariance = this.calculateVariance(values);
    const patternVariance = this.calculateVariance(weeklyAverages);
    const confidence = patternVariance / totalVariance;

    return {
      type: 'weekly',
      confidence,
      period: 168,
      amplitude: Math.max(...weeklyAverages) - Math.min(...weeklyAverages),
      phase: weeklyAverages.indexOf(Math.max(...weeklyAverages)),
    };
  }

  private detectSeasonalPattern(values: number[]): TemporalPattern {
    const seasonHours = 2160; // 90 days * 24 hours
    const segments = Math.floor(values.length / seasonHours);
    const seasonalAverages = new Array(seasonHours).fill(0);

    // Calculate average for each hour of the season
    for (let i = 0; i < segments * seasonHours; i++) {
      const hour = i % seasonHours;
      seasonalAverages[hour] += values[i];
    }

    for (let i = 0; i < seasonHours; i++) {
      seasonalAverages[i] /= segments;
    }

    // Calculate pattern strength
    const totalVariance = this.calculateVariance(values);
    const patternVariance = this.calculateVariance(seasonalAverages);
    const confidence = patternVariance / totalVariance;

    return {
      type: 'seasonal',
      confidence,
      period: 2160,
      amplitude: Math.max(...seasonalAverages) - Math.min(...seasonalAverages),
      phase: seasonalAverages.indexOf(Math.max(...seasonalAverages)),
    };
  }

  private calculateVariance(values: number[]): number {
    const mean = values.reduce((a, b) => a + b) / values.length;
    return values.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / values.length;
  }

  private analyzeMultiSourceCorrelations(): void {
    try {
      const sources = ['reddit', 'twitter', 'news'];

      for (let i = 0; i < sources.length; i++) {
        for (let j = i + 1; j < sources.length; j++) {
          const source1 = sources[i];
          const source2 = sources[j];

          const values1 = this.getSourceValues(source1);
          const values2 = this.getSourceValues(source2);

          if (values1.length < 24 || values2.length < 24) continue;

          const correlation = this.calculateMultiSourceCorrelation(values1, values2);

          if (correlation.confidence > 0.7) {
            const key = `${source1}_${source2}`;
            const existing = this.multiSourceCorrelations.get(key) || [];
            existing.push(correlation);
            this.multiSourceCorrelations.set(key, existing);

            this.emit('multi_source_correlation_detected', {
              sources: [source1, source2],
              correlation,
            });
          }
        }
      }
    } catch (error) {
      logger.error('Error analyzing multi-source correlations:', error);
    }
  }

  private calculateEnhancedConfidence(values: number[]): ConfidenceFactors {
    if (values.length < 2) {
      return {
        sampleSize: 0,
        variability: 0,
        outlierImpact: 0,
        signalStrength: 0,
        noiseLevel: 0,
      };
    }

    // Calculate basic statistics
    const mean = values.reduce((a, b) => a + b) / values.length;
    const variance = values.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / values.length;
    const stdDev = Math.sqrt(variance);

    // Identify outliers using IQR method
    const sorted = [...values].sort((a, b) => a - b);
    const q1 = sorted[Math.floor(values.length * 0.25)];
    const q3 = sorted[Math.floor(values.length * 0.75)];
    const iqr = q3 - q1;
    const outlierBounds = {
      lower: q1 - 1.5 * iqr,
      upper: q3 + 1.5 * iqr,
    };

    const outliers = values.filter((v) => v < outlierBounds.lower || v > outlierBounds.upper);

    // Calculate signal-to-noise ratio
    const signalPower = Math.pow(mean, 2);
    const noisePower = variance;
    const snr = signalPower / noisePower;

    return {
      sampleSize: Math.min(1, values.length / 100),
      variability: Math.max(0, 1 - stdDev / mean),
      outlierImpact: 1 - outliers.length / values.length,
      signalStrength: Math.min(1, snr),
      noiseLevel: Math.max(0, 1 - noisePower / signalPower),
    };
  }

  private calculateWeightedCorrelation(
    values1: number[],
    values2: number[],
    weights: Map<string, number>
  ): WeightedCorrelation {
    const factors1 = this.calculateEnhancedConfidence(values1);
    const factors2 = this.calculateEnhancedConfidence(values2);

    // Calculate base correlation
    const correlation = this.calculateCorrelation(values1, values2);

    // Apply weights to confidence factors
    const weightedFactors = {
      sampleSize:
        ((factors1.sampleSize + factors2.sampleSize) / 2) * (weights.get('sampleSize') || 1),
      variability:
        ((factors1.variability + factors2.variability) / 2) * (weights.get('variability') || 1),
      outlierImpact:
        ((factors1.outlierImpact + factors2.outlierImpact) / 2) *
        (weights.get('outlierImpact') || 1),
      signalStrength:
        ((factors1.signalStrength + factors2.signalStrength) / 2) *
        (weights.get('signalStrength') || 1),
      noiseLevel:
        ((factors1.noiseLevel + factors2.noiseLevel) / 2) * (weights.get('noiseLevel') || 1),
    };

    // Calculate adjusted confidence
    const totalWeight = Array.from(weights.values()).reduce((a, b) => a + b, 0);
    const adjustedConfidence =
      Object.values(weightedFactors).reduce((a, b) => a + b, 0) / totalWeight;

    return {
      correlation,
      weights,
      adjustedConfidence,
      factors: weightedFactors,
    };
  }

  private getDefaultWeights(): Map<string, number> {
    return new Map([
      ['sampleSize', 2.0],
      ['variability', 1.5],
      ['outlierImpact', 1.8],
      ['signalStrength', 2.0],
      ['noiseLevel', 1.7],
    ]);
  }

  private calculateMultiSourceCorrelation(
    values1: number[],
    values2: number[]
  ): MultiSourceCorrelation {
    // Ensure equal length
    const length = Math.min(values1.length, values2.length);
    values1 = values1.slice(0, length);
    values2 = values2.slice(0, length);

    // Calculate weighted correlation
    const weights = this.getDefaultWeights();
    const weightedResult = this.calculateWeightedCorrelation(values1, values2, weights);

    // Calculate lag correlation with enhanced confidence
    const maxLag = Math.floor(length / 4);
    let bestLag = 0;
    let bestCorrelation = weightedResult.correlation;
    let bestConfidence = weightedResult.adjustedConfidence;

    for (let lag = 1; lag <= maxLag; lag++) {
      const laggedValues1 = values1.slice(lag);
      const laggedValues2 = values2.slice(0, -lag);
      const laggedResult = this.calculateWeightedCorrelation(laggedValues1, laggedValues2, weights);

      if (
        Math.abs(laggedResult.correlation) > Math.abs(bestCorrelation) &&
        laggedResult.adjustedConfidence > bestConfidence
      ) {
        bestCorrelation = laggedResult.correlation;
        bestConfidence = laggedResult.adjustedConfidence;
        bestLag = lag;
      }
    }

    return {
      sources: ['source1', 'source2'],
      correlation: bestCorrelation,
      confidence: bestConfidence,
      lag: bestLag,
      causality: bestCorrelation > 0 ? 'direct' : 'inverse',
    };
  }

  private getSourceValues(source: string): number[] {
    // Implementation would fetch actual source values
    return Array(100)
      .fill(0)
      .map(() => Math.random());
  }

  private generateInsights(): void {
    try {
      this.insights = [];

      // Analyze performance correlations
      this.correlations.forEach((results, key) => {
        results.forEach((result) => {
          if (result.confidence > 0.8) {
            this.insights.push(this.createPerformanceInsight(result));
          }
        });
      });

      // Analyze resource trends
      this.trends.forEach((trend) => {
        if (trend.confidence > 0.7) {
          this.insights.push(this.createResourceInsight(trend));
        }
      });

      // Emit high priority insights
      this.insights
        .filter((insight) => insight.priority === 'high')
        .forEach((insight) => this.emit('actionable_insight', insight));
    } catch (error) {
      logger.error('Error generating insights:', error);
    }
  }

  private createPerformanceInsight(correlation: CorrelationResult): ActionableInsight {
    const [metric1, metric2] = correlation.metrics;
    const relationship = correlation.coefficient > 0 ? 'increases with' : 'decreases with';

    return {
      type: 'performance',
      priority: correlation.confidence > 0.9 ? 'high' : 'medium',
      insight: `Strong ${correlation.pattern} correlation detected between ${metric1} and ${metric2}`,
      recommendation: `Monitor ${metric1} as it ${relationship} ${metric2}. Consider optimizing ${metric2} to improve ${metric1}.`,
      metrics: correlation.metrics,
      confidence: correlation.confidence,
    };
  }

  private createResourceInsight(trend: TrendAnalysis): ActionableInsight {
    const recommendations = {
      increasing: 'Consider scaling resources or optimizing usage patterns.',
      decreasing: 'Resource utilization is improving. Monitor for potential underutilization.',
      cyclical: 'Consider implementing dynamic resource allocation based on the detected pattern.',
      stable: 'Current resource allocation appears optimal.',
    };

    return {
      type: 'resource',
      priority: trend.confidence > 0.9 ? 'high' : 'medium',
      insight: `${trend.metric} shows a ${trend.trend} trend with ${(trend.confidence * 100).toFixed(1)}% confidence`,
      recommendation: recommendations[trend.trend],
      metrics: [trend.metric],
      confidence: trend.confidence,
    };
  }

  getCorrelations(): Map<string, CorrelationResult[]> {
    return new Map(this.correlations);
  }

  getTrends(): Map<string, TrendAnalysis> {
    return new Map(this.trends);
  }

  getTemporalPatterns(): Map<string, TemporalPattern[]> {
    return new Map(this.temporalPatterns);
  }

  getMultiSourceCorrelations(): Map<string, MultiSourceCorrelation[]> {
    return new Map(this.multiSourceCorrelations);
  }

  getInsights(): ActionableInsight[] {
    return [...this.insights];
  }

  private getMetricValues(metric: string): number[] {
    // Implementation would fetch actual metric values
    return Array(100)
      .fill(0)
      .map(() => Math.random());
  }

  private getAvailableMetrics(): string[] {
    // Implementation would return actual available metrics
    return [
      'processing_time',
      'error_rate',
      'demand_pattern_strength',
      'cpu_usage',
      'memory_usage',
      'api_rate',
    ];
  }

  private calculateExtendedStatistics(values: number[]): ExtendedStatistics {
    if (values.length === 0) {
      throw new Error('Cannot calculate statistics for empty dataset');
    }

    // Sort values for quantile calculations
    const sorted = [...values].sort((a, b) => a - b);
    const n = values.length;

    // Calculate mean
    const mean = values.reduce((a, b) => a + b) / n;

    // Calculate median
    const median =
      n % 2 === 0 ? (sorted[n / 2 - 1] + sorted[n / 2]) / 2 : sorted[Math.floor(n / 2)];

    // Calculate standard deviation
    const squaredDiffs = values.map((v) => Math.pow(v - mean, 2));
    const variance = squaredDiffs.reduce((a, b) => a + b) / n;
    const stdDev = Math.sqrt(variance);

    // Calculate skewness
    const cubedDiffs = values.map((v) => Math.pow((v - mean) / stdDev, 3));
    const skewness = cubedDiffs.reduce((a, b) => a + b) / n;

    // Calculate kurtosis
    const fourthDiffs = values.map((v) => Math.pow((v - mean) / stdDev, 4));
    const kurtosis = fourthDiffs.reduce((a, b) => a + b) / n - 3;

    // Calculate quantiles
    const q1 = sorted[Math.floor(n * 0.25)];
    const q3 = sorted[Math.floor(n * 0.75)];
    const iqr = q3 - q1;

    return {
      mean,
      median,
      stdDev,
      skewness,
      kurtosis,
      quantiles: { q1, q3, iqr },
    };
  }

  private calculateMAD(values: number[], median: number): number {
    const absoluteDeviations = values.map((v) => Math.abs(v - median));
    return this.calculateExtendedStatistics(absoluteDeviations).median;
  }

  private detectAnomalies(values: number[], timestamps: string[]): AnomalyContext[] {
    const stats = this.calculateExtendedStatistics(values);
    const mad = this.calculateMAD(values, stats.median);
    const anomalies: AnomalyContext[] = [];

    // Calculate seasonal components (assuming daily seasonality)
    const hourlyAverages = new Array(24).fill(0).map(() => ({ sum: 0, count: 0 }));
    timestamps.forEach((ts, i) => {
      const hour = new Date(ts).getHours();
      hourlyAverages[hour].sum += values[i];
      hourlyAverages[hour].count++;
    });

    const seasonalBaseline = hourlyAverages.map((h) => (h.count > 0 ? h.sum / h.count : 0));

    // Detect anomalies using multiple methods
    values.forEach((value, i) => {
      const hour = new Date(timestamps[i]).getHours();
      const seasonalExpected = seasonalBaseline[hour];

      // Z-score
      const zscore = Math.abs((value - stats.mean) / stats.stdDev);

      // MAD score
      const madScore = Math.abs(value - stats.median) / mad;

      // Contextual score based on local window
      const windowSize = 12; // 12-hour window
      const start = Math.max(0, i - windowSize);
      const end = Math.min(values.length, i + windowSize);
      const localValues = values.slice(start, end);
      const localStats = this.calculateExtendedStatistics(localValues);
      const contextualScore = Math.abs((value - localStats.mean) / localStats.stdDev);

      // Seasonal deviation score
      const seasonalityScore = Math.abs((value - seasonalExpected) / stats.stdDev);

      if (zscore > 3 || madScore > 3.5 || contextualScore > 3 || seasonalityScore > 3) {
        anomalies.push({
          value,
          timestamp: timestamps[i],
          zscore,
          mad: madScore,
          contextualScore,
          seasonalityScore,
        });
      }
    });

    return anomalies;
  }

  private spearmanCorrelation(values1: number[], values2: number[]): number {
    const n = Math.min(values1.length, values2.length);

    // Calculate ranks
    const ranks1 = this.calculateRanks([...values1].slice(0, n));
    const ranks2 = this.calculateRanks([...values2].slice(0, n));

    // Calculate correlation of ranks
    return this.calculateCorrelation(ranks1, ranks2);
  }

  private calculateRanks(values: number[]): number[] {
    const sorted = values.map((v, i) => ({ value: v, index: i })).sort((a, b) => a.value - b.value);

    const ranks = new Array(values.length);
    let currentRank = 1;

    for (let i = 0; i < sorted.length; i++) {
      const tieGroup = sorted.filter((item) => item.value === sorted[i].value);
      const averageRank = currentRank + (tieGroup.length - 1) / 2;

      tieGroup.forEach((item) => {
        ranks[item.index] = averageRank;
      });

      i += tieGroup.length - 1;
      currentRank += tieGroup.length;
    }

    return ranks;
  }

  private kendallCorrelation(values1: number[], values2: number[]): number {
    const n = Math.min(values1.length, values2.length);
    let concordant = 0;
    let discordant = 0;

    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        const diff1 = values1[i] - values1[j];
        const diff2 = values2[i] - values2[j];

        if (diff1 * diff2 > 0) concordant++;
        else if (diff1 * diff2 < 0) discordant++;
      }
    }

    return (concordant - discordant) / ((n * (n - 1)) / 2);
  }
}
