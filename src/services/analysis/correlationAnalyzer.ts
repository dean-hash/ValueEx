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

  public analyzeCorrelations(): void {
    try {
      const metrics = this.getAvailableMetrics();

      for (let i = 0; i < metrics.length; i++) {
        for (let j = i + 1; j < metrics.length; j++) {
          const values1 = this.getMetricValues(metrics[i]);
          const values2 = this.getMetricValues(metrics[j]);

          const result = this.calculateCorrelation(values1, values2);
          result.metrics = [metrics[i], metrics[j]];

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

  public analyzeTrends(): void {
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

  private calculateCorrelation(values1: number[], values2: number[]): CorrelationResult {
    const n = Math.min(values1.length, values2.length);
    if (n < 2) {
      return {
        metrics: ['metric1', 'metric2'],
        coefficient: 0,
        confidence: 0,
        timeWindow: 0,
        pattern: 'direct',
        significance: 0,
      };
    }

    // Calculate Pearson correlation coefficient
    const mean1 = values1.reduce((a, b) => a + b, 0) / n;
    const mean2 = values2.reduce((a, b) => a + b, 0) / n;

    let num = 0;
    let den1 = 0;
    let den2 = 0;

    for (let i = 0; i < n; i++) {
      const x = values1[i] - mean1;
      const y = values2[i] - mean2;
      num += x * y;
      den1 += x * x;
      den2 += y * y;
    }

    const coefficient = num / Math.sqrt(den1 * den2);
    const significance = this.calculateSignificance(coefficient, n);

    return {
      metrics: ['metric1', 'metric2'],
      coefficient,
      confidence: Math.abs(coefficient),
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
    // Calculate base correlation
    const result = this.calculateCorrelation(values1, values2);

    // Apply weights to confidence factors
    const weightedFactors = {
      sampleSize:
        this.calculateEnhancedConfidence(values1).sampleSize * (weights.get('sampleSize') || 1),
      variability:
        this.calculateEnhancedConfidence(values1).variability * (weights.get('variability') || 1),
      outlierImpact:
        this.calculateEnhancedConfidence(values1).outlierImpact *
        (weights.get('outlierImpact') || 1),
      signalStrength:
        this.calculateEnhancedConfidence(values1).signalStrength *
        (weights.get('signalStrength') || 1),
      noiseLevel:
        this.calculateEnhancedConfidence(values1).noiseLevel * (weights.get('noiseLevel') || 1),
    };

    // Calculate adjusted confidence
    const adjustedConfidence =
      (result.confidence * Object.values(weightedFactors).reduce((a, b) => a + b, 0)) /
      weights.size;

    return {
      correlation: result.coefficient,
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

  public detectAnomalies(values: number[], timestamps: string[] = []): AnomalyContext[] {
    if (values.length === 0) return [];

    const stats = this.calculateExtendedStatistics(values);
    const mad = this.calculateMAD(values, stats.median);
    const anomalies: AnomalyContext[] = [];

    values.forEach((value, index) => {
      const zscore = Math.abs((value - stats.mean) / stats.stdDev);
      const madScore = Math.abs(value - stats.median) / mad;
      const timestamp = timestamps[index] || new Date().toISOString();

      // Detect anomalies using both z-score and MAD
      if (zscore > 3 || madScore > 3.5) {
        const seasonalityScore = this.calculateSeasonalityScore(value, index, values);
        const contextualScore = this.calculateContextualScore(value, index, values);

        anomalies.push({
          value,
          timestamp,
          zscore,
          mad: madScore,
          contextualScore,
          seasonalityScore,
        });
      }
    });

    return anomalies;
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

  private calculateSeasonalityScore(value: number, index: number, values: number[]): number {
    // Calculate seasonality by comparing with values at similar positions in previous periods
    const period = 24; // Assume daily seasonality (24 hours)
    const previousValues = [];

    for (let i = index - period; i >= 0; i -= period) {
      previousValues.push(values[i]);
    }

    if (previousValues.length === 0) return 0;

    const mean = previousValues.reduce((a, b) => a + b) / previousValues.length;
    const stdDev = Math.sqrt(
      previousValues.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / previousValues.length
    );

    return Math.abs((value - mean) / (stdDev || 1));
  }

  private calculateContextualScore(value: number, index: number, values: number[]): number {
    // Calculate contextual score by comparing with neighboring values
    const windowSize = 5;
    const start = Math.max(0, index - windowSize);
    const end = Math.min(values.length, index + windowSize + 1);
    const window = values.slice(start, end);

    const mean = window.reduce((a, b) => a + b) / window.length;
    const stdDev = Math.sqrt(window.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / window.length);

    return Math.abs((value - mean) / (stdDev || 1));
  }

  private spearmanCorrelation(values1: number[], values2: number[]): number {
    // Convert values to ranks
    const ranks1 = this.calculateRanks(values1);
    const ranks2 = this.calculateRanks(values2);

    // Calculate correlation of ranks
    return this.calculateCorrelation(ranks1, ranks2).coefficient;
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
