import { EventEmitter } from 'events';
import { CorrelationAnalyzer } from '../services/analysis/correlationAnalyzer';
import { ResourceMonitor } from '../services/monitoring/resourceMonitor';
import { MetricsCollector } from '../services/monitoring/metrics';

interface ChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    borderColor: string;
    fill: boolean;
  }[];
}

interface CorrelationVisualization {
  type: 'temporal' | 'multi-source' | 'trend';
  data: ChartData;
  confidence: number;
  insights: string[];
}

interface StatisticalVisualization {
  type: 'distribution' | 'seasonal' | 'correlation' | 'prediction';
  data: {
    primary: ChartData;
    secondary?: ChartData;
    insights: {
      key: string;
      value: number | string;
      confidence: number;
    }[];
  };
  metadata: {
    metric: string;
    timeRange: string;
    updateTime: string;
  };
}

interface AnomalyData {
  timestamp: string;
  metric: string;
  value: number;
  expectedValue: number;
  deviation: number;
  severity: 'low' | 'medium' | 'high';
}

interface HeatmapData {
  x: string;
  y: string;
  value: number;
}

interface ComparativeView {
  patterns: string[];
  data: ChartData;
  correlations: {
    pattern1: string;
    pattern2: string;
    correlation: number;
    significance: number;
  }[];
}

interface DrillDownConfig {
  timeRange: 'hour' | 'day' | 'week' | 'month';
  granularity: 'minute' | 'hour' | 'day';
  region?: string;
  category?: string;
  filters: Map<string, string[]>;
}

interface DrillDownView extends StatisticalVisualization {
  children: DrillDownView[];
  parent?: DrillDownView;
  config: DrillDownConfig;
  insights: {
    correlations: Array<{ source: string; target: string; strength: number }>;
    anomalies: AnomalyData[];
    predictions: {
      shortTerm: number[];
      longTerm: number[];
      confidence: number;
    };
  };
}

export class CorrelationDashboard extends EventEmitter {
  private static instance: CorrelationDashboard;
  private analyzer: CorrelationAnalyzer;
  private monitor: ResourceMonitor;
  private metrics: MetricsCollector;
  private visualizations: Map<string, CorrelationVisualization> = new Map();
  private statisticalVisualizations: Map<string, StatisticalVisualization> = new Map();
  private anomalies: Map<string, AnomalyData[]> = new Map();
  private heatmaps: Map<string, HeatmapData[]> = new Map();
  private comparativeViews: Map<string, ComparativeView> = new Map();
  private drillDownViews: Map<string, DrillDownView> = new Map();
  private activeFilters: Map<string, string[]> = new Map();
  private updateSubscriptions: Set<string> = new Set();
  private updateInterval: NodeJS.Timer | null = null;

  private constructor() {
    super();
    this.analyzer = CorrelationAnalyzer.getInstance();
    this.monitor = ResourceMonitor.getInstance();
    this.metrics = MetricsCollector.getInstance();
    this.setupEventListeners();
  }

  public static getInstance(): CorrelationDashboard {
    if (!CorrelationDashboard.instance) {
      CorrelationDashboard.instance = new CorrelationDashboard();
    }
    return CorrelationDashboard.instance;
  }

  private setupEventListeners(): void {
    // Listen for temporal patterns
    this.analyzer.on('temporal_pattern_detected', pattern => {
      this.updateTemporalVisualization(pattern);
    });

    // Listen for multi-source correlations
    this.analyzer.on('multi_source_correlation_detected', correlation => {
      this.updateMultiSourceVisualization(correlation);
    });

    // Listen for trend detections
    this.analyzer.on('trend_detected', trend => {
      this.updateTrendVisualization(trend);
    });
  }

  startRealTimeUpdates(interval: number = 1000): void {
    if (this.updateInterval) {
      return;
    }

    this.updateInterval = setInterval(() => {
      this.updateAllVisualizations();
    }, interval);
  }

  stopRealTimeUpdates(): void {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
  }

  private updateAllVisualizations(): void {
    // Update temporal patterns
    const temporalPatterns = this.analyzer.getTemporalPatterns();
    temporalPatterns.forEach((patterns, metric) => {
      this.updateTemporalVisualization({
        metric,
        patterns
      });
    });

    // Update multi-source correlations
    const multiSourceCorrelations = this.analyzer.getMultiSourceCorrelations();
    multiSourceCorrelations.forEach((correlations, key) => {
      this.updateMultiSourceVisualization({
        sources: key.split('_'),
        correlation: correlations[correlations.length - 1]
      });
    });

    // Update trends
    const trends = this.analyzer.getTrends();
    trends.forEach((trend, metric) => {
      this.updateTrendVisualization({
        metric,
        trend
      });
    });

    // Update anomaly detection
    this.updateAnomalyDetection();

    // Update heatmaps
    this.updateHeatmaps();

    // Update comparative views
    this.updateComparativeViews();

    // Update statistical visualizations
    this.updateStatisticalVisualizations();

    // Emit update event
    this.emit('visualizations_updated', {
      patterns: Array.from(this.visualizations.entries()),
      anomalies: Array.from(this.anomalies.entries()),
      heatmaps: Array.from(this.heatmaps.entries()),
      comparativeViews: Array.from(this.comparativeViews.entries()),
      statisticalVisualizations: Array.from(this.statisticalVisualizations.entries())
    });
  }

  public drillDown(viewId: string, config: Partial<DrillDownConfig>): DrillDownView {
    const baseView = this.statisticalVisualizations.get(viewId);
    if (!baseView) throw new Error(`View ${viewId} not found`);

    const currentConfig = this.drillDownViews.get(viewId)?.config || {
      timeRange: 'day',
      granularity: 'hour',
      filters: new Map()
    };

    const newConfig: DrillDownConfig = {
      ...currentConfig,
      ...config,
      filters: new Map([...currentConfig.filters, ...(config.filters || new Map())])
    };

    const drillDownView = this.createDrillDownView(baseView, newConfig);
    this.drillDownViews.set(viewId, drillDownView);
    
    // Set up real-time updates for this view
    this.setupRealTimeUpdates(viewId, drillDownView);
    
    return drillDownView;
  }

  private createDrillDownView(base: StatisticalVisualization, config: DrillDownConfig): DrillDownView {
    const filteredData = this.applyFilters(base.data.primary, config);
    const timeWindowedData = this.applyTimeWindow(filteredData, config);
    
    const correlations = this.analyzer.findRelatedMetrics(base.metadata.metric, config);
    const anomalies = this.analyzer.detectAnomalies(timeWindowedData.datasets[0].data, timeWindowedData.labels);
    const predictions = this.generatePredictions(timeWindowedData.datasets[0].data, config);

    const children = correlations.map(correlation => 
      this.createDrillDownView({
        ...base,
        metadata: { ...base.metadata, metric: correlation.target }
      }, config)
    );

    return {
      ...base,
      type: 'prediction',
      data: {
        primary: timeWindowedData,
        insights: [
          { key: 'Correlation Strength', value: correlations[0]?.strength || 0, confidence: 0.9 },
          { key: 'Anomaly Count', value: anomalies.length, confidence: 0.85 },
          { key: 'Prediction Accuracy', value: predictions.confidence, confidence: predictions.confidence }
        ]
      },
      children,
      config,
      insights: {
        correlations,
        anomalies,
        predictions: {
          shortTerm: predictions.values.slice(0, 24),
          longTerm: predictions.values.slice(24),
          confidence: predictions.confidence
        }
      }
    };
  }

  private setupRealTimeUpdates(viewId: string, view: DrillDownView): void {
    if (this.updateSubscriptions.has(viewId)) {
      return;
    }

    this.updateSubscriptions.add(viewId);
    
    // Set up real-time data feed
    const updateInterval = this.determineUpdateInterval(view.config);
    
    setInterval(() => {
      const newData = this.fetchLatestData(view.metadata.metric, view.config);
      const updatedView = this.updateDrillDownView(view, newData);
      
      this.drillDownViews.set(viewId, updatedView);
      
      // Emit update event with changes
      this.emit('drilldown_updated', {
        viewId,
        changes: this.calculateViewChanges(view, updatedView),
        insights: this.generateRealTimeInsights(updatedView)
      });
    }, updateInterval);
  }

  private determineUpdateInterval(config: DrillDownConfig): number {
    switch (config.granularity) {
      case 'minute': return 60000; // 1 minute
      case 'hour': return 300000; // 5 minutes
      case 'day': return 3600000; // 1 hour
      default: return 300000; // 5 minutes default
    }
  }

  private fetchLatestData(metric: string, config: DrillDownConfig): any {
    // Fetch new data based on config
    const rawData = this.metrics.getLatestMetricValues(metric);
    return this.applyFilters(rawData, config);
  }

  private updateDrillDownView(view: DrillDownView, newData: any): DrillDownView {
    const updatedData = this.mergeNewData(view.data.primary, newData);
    const predictions = this.generatePredictions(updatedData.datasets[0].data, view.config);
    const anomalies = this.analyzer.detectAnomalies(updatedData.datasets[0].data, updatedData.labels);

    return {
      ...view,
      data: {
        ...view.data,
        primary: updatedData
      },
      insights: {
        ...view.insights,
        anomalies,
        predictions: {
          shortTerm: predictions.values.slice(0, 24),
          longTerm: predictions.values.slice(24),
          confidence: predictions.confidence
        }
      }
    };
  }

  private calculateViewChanges(oldView: DrillDownView, newView: DrillDownView): any {
    return {
      newAnomalies: this.findNewAnomalies(oldView.insights.anomalies, newView.insights.anomalies),
      predictionChanges: this.comparePredictions(oldView.insights.predictions, newView.insights.predictions),
      significantChanges: this.findSignificantChanges(oldView.data.primary, newView.data.primary)
    };
  }

  private generateRealTimeInsights(view: DrillDownView): any {
    return {
      trendStrength: this.calculateTrendStrength(view.data.primary),
      anomalyRisk: this.calculateAnomalyRisk(view.insights.anomalies),
      predictionConfidence: view.insights.predictions.confidence,
      recentChanges: this.summarizeRecentChanges(view.data.primary)
    };
  }

  private applyFilters(data: ChartData, config: DrillDownConfig): ChartData {
    // Apply filters based on config
    return {
      ...data,
      datasets: data.datasets.map(dataset => ({
        ...dataset,
        data: dataset.data.filter((_, i) => this.matchesFilters(data.labels[i], config.filters))
      }))
    };
  }

  private matchesFilters(label: string, filters: Map<string, string[]>): boolean {
    return Array.from(filters.entries()).every(([key, values]) => {
      const value = this.extractFilterValue(label, key);
      return values.includes(value);
    });
  }

  private extractFilterValue(label: string, filterKey: string): string {
    // Extract value from label based on filter key
    const date = new Date(label);
    switch (filterKey) {
      case 'hour': return date.getHours().toString();
      case 'day': return date.getDay().toString();
      case 'month': return date.getMonth().toString();
      default: return '';
    }
  }

  private updateTemporalVisualization(pattern: any): void {
    const metric = pattern.metric;
    const values = this.metrics.getMetricValues(metric);
    const timeLabels = this.generateTimeLabels(values.length);

    const datasets = pattern.patterns.map((p: any) => ({
      label: `${p.type} Pattern`,
      data: this.generatePatternData(p, values.length),
      borderColor: this.getPatternColor(p.type),
      fill: false
    }));

    // Add actual values
    datasets.unshift({
      label: 'Actual Values',
      data: values,
      borderColor: '#2196F3',
      fill: false
    });

    const visualization: CorrelationVisualization = {
      type: 'temporal',
      data: {
        labels: timeLabels,
        datasets
      },
      confidence: Math.max(...pattern.patterns.map((p: any) => p.confidence)),
      insights: this.generateTemporalInsights(pattern)
    };

    this.visualizations.set(`temporal_${metric}`, visualization);
  }

  private updateMultiSourceVisualization(data: any): void {
    const [source1, source2] = data.sources;
    const values1 = this.metrics.getSourceValues(source1);
    const values2 = this.metrics.getSourceValues(source2);
    const timeLabels = this.generateTimeLabels(Math.max(values1.length, values2.length));

    const visualization: CorrelationVisualization = {
      type: 'multi-source',
      data: {
        labels: timeLabels,
        datasets: [
          {
            label: source1,
            data: values1,
            borderColor: '#4CAF50',
            fill: false
          },
          {
            label: source2,
            data: values2,
            borderColor: '#FFC107',
            fill: false
          }
        ]
      },
      confidence: data.correlation.confidence,
      insights: this.generateMultiSourceInsights(data)
    };

    this.visualizations.set(`multi_source_${source1}_${source2}`, visualization);
  }

  private updateTrendVisualization(data: any): void {
    const values = this.metrics.getMetricValues(data.metric);
    const timeLabels = this.generateTimeLabels(values.length);
    const trendLine = this.generateTrendLine(values, data.trend);

    const visualization: CorrelationVisualization = {
      type: 'trend',
      data: {
        labels: timeLabels,
        datasets: [
          {
            label: 'Actual Values',
            data: values,
            borderColor: '#2196F3',
            fill: false
          },
          {
            label: 'Trend',
            data: trendLine,
            borderColor: '#9C27B0',
            fill: false
          }
        ]
      },
      confidence: data.trend.confidence,
      insights: this.generateTrendInsights(data)
    };

    this.visualizations.set(`trend_${data.metric}`, visualization);
  }

  private generateTimeLabels(count: number): string[] {
    const now = new Date();
    return Array(count).fill(0).map((_, i) => {
      const date = new Date(now.getTime() - (count - i - 1) * 60000);
      return date.toISOString();
    });
  }

  private generatePatternData(pattern: any, length: number): number[] {
    const data = new Array(length).fill(0);
    const amplitude = pattern.amplitude || 1;
    const period = pattern.period || 24;
    const phase = pattern.phase || 0;

    for (let i = 0; i < length; i++) {
      data[i] = amplitude * Math.sin((i + phase) * 2 * Math.PI / period);
    }

    return data;
  }

  private generateTrendLine(values: number[], trend: any): number[] {
    if (trend.trend === 'stable') {
      const mean = values.reduce((a, b) => a + b) / values.length;
      return Array(values.length).fill(mean);
    }

    const slope = (values[values.length - 1] - values[0]) / values.length;
    return values.map((_, i) => values[0] + slope * i);
  }

  private getPatternColor(type: string): string {
    const colors = {
      daily: '#E91E63',
      weekly: '#9C27B0',
      seasonal: '#673AB7',
      trend: '#3F51B5'
    };
    return colors[type as keyof typeof colors] || '#000000';
  }

  private generateTemporalInsights(pattern: any): string[] {
    return pattern.patterns.map((p: any) => {
      const strength = p.confidence > 0.8 ? 'strong' : 'moderate';
      return `${strength} ${p.type} pattern detected with ${(p.confidence * 100).toFixed(1)}% confidence`;
    });
  }

  private generateMultiSourceInsights(data: any): string[] {
    const insights = [];
    const correlation = data.correlation;

    insights.push(`${correlation.causality} correlation detected between ${data.sources.join(' and ')}`);
    
    if (correlation.lag) {
      insights.push(`${data.sources[1]} follows ${data.sources[0]} with ${correlation.lag} unit lag`);
    }

    insights.push(`Confidence: ${(correlation.confidence * 100).toFixed(1)}%`);
    return insights;
  }

  private generateTrendInsights(data: any): string[] {
    const insights = [];
    const trend = data.trend;

    insights.push(`${trend.trend} trend detected in ${data.metric}`);
    
    if (trend.prediction) {
      const nextValue = trend.prediction[0];
      insights.push(`Predicted next value: ${nextValue.toFixed(2)}`);
    }

    insights.push(`Confidence: ${(trend.confidence * 100).toFixed(1)}%`);
    return insights;
  }

  private updateAnomalyDetection(): void {
    const metrics = this.metrics.getAvailableMetrics();
    
    metrics.forEach(metric => {
      const values = this.metrics.getMetricValues(metric);
      if (values.length < 24) return;

      const anomalies: AnomalyData[] = [];
      const baselineWindow = 24; // 24 hours baseline
      
      for (let i = baselineWindow; i < values.length; i++) {
        const baseline = values.slice(i - baselineWindow, i);
        const mean = baseline.reduce((a, b) => a + b) / baselineWindow;
        const stdDev = Math.sqrt(
          baseline.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / baselineWindow
        );

        const currentValue = values[i];
        const deviation = Math.abs(currentValue - mean) / stdDev;

        if (deviation > 2) {
          anomalies.push({
            timestamp: this.generateTimeLabels(1)[0],
            metric,
            value: currentValue,
            expectedValue: mean,
            deviation,
            severity: deviation > 4 ? 'high' : deviation > 3 ? 'medium' : 'low'
          });
        }
      }

      if (anomalies.length > 0) {
        this.anomalies.set(metric, anomalies);
        this.emit('anomaly_detected', {
          metric,
          anomalies
        });
      }
    });
  }

  private updateHeatmaps(): void {
    const metrics = this.metrics.getAvailableMetrics();
    
    // Create correlation heatmap
    const correlationHeatmap: HeatmapData[] = [];
    
    for (let i = 0; i < metrics.length; i++) {
      for (let j = 0; j < metrics.length; j++) {
        const values1 = this.metrics.getMetricValues(metrics[i]);
        const values2 = this.metrics.getMetricValues(metrics[j]);
        
        const correlation = this.calculateCorrelation(values1, values2);
        
        correlationHeatmap.push({
          x: metrics[i],
          y: metrics[j],
          value: correlation
        });
      }
    }
    
    this.heatmaps.set('correlation_matrix', correlationHeatmap);

    // Create anomaly heatmap
    const anomalyHeatmap: HeatmapData[] = [];
    const timeSlots = 24; // Last 24 hours
    
    metrics.forEach(metric => {
      const anomalies = this.anomalies.get(metric) || [];
      
      for (let hour = 0; hour < timeSlots; hour++) {
        const hourAnomalies = anomalies.filter(a => {
          const anomalyHour = new Date(a.timestamp).getHours();
          return anomalyHour === hour;
        });
        
        anomalyHeatmap.push({
          x: hour.toString(),
          y: metric,
          value: hourAnomalies.reduce((acc, a) => acc + a.deviation, 0)
        });
      }
    });
    
    this.heatmaps.set('anomaly_distribution', anomalyHeatmap);
  }

  private updateComparativeViews(): void {
    const temporalPatterns = this.analyzer.getTemporalPatterns();
    
    temporalPatterns.forEach((patterns, metric) => {
      if (patterns.length < 2) return;
      
      const datasets = patterns.map(pattern => ({
        label: pattern.type,
        data: this.generatePatternData(pattern, 168), // One week of data
        borderColor: this.getPatternColor(pattern.type),
        fill: false
      }));

      const correlations = [];
      for (let i = 0; i < patterns.length; i++) {
        for (let j = i + 1; j < patterns.length; j++) {
          const data1 = this.generatePatternData(patterns[i], 168);
          const data2 = this.generatePatternData(patterns[j], 168);
          
          const correlation = this.calculateCorrelation(data1, data2);
          const significance = this.calculateSignificance(correlation, 168);
          
          correlations.push({
            pattern1: patterns[i].type,
            pattern2: patterns[j].type,
            correlation,
            significance
          });
        }
      }

      const comparativeView: ComparativeView = {
        patterns: patterns.map(p => p.type),
        data: {
          labels: this.generateTimeLabels(168),
          datasets
        },
        correlations
      };

      this.comparativeViews.set(metric, comparativeView);
    });
  }

  private updateStatisticalVisualizations(): void {
    const metrics = this.metrics.getAvailableMetrics();
    
    metrics.forEach(metric => {
      const values = this.metrics.getMetricValues(metric);
      
      // Create distribution view
      const distributionView = this.createDistributionView(metric, values);
      this.statisticalVisualizations.set(`distribution_${metric}`, distributionView);

      // Create seasonal view
      const seasonalView = this.createSeasonalView(metric, values, this.generateTimeLabels(values.length));
      this.statisticalVisualizations.set(`seasonal_${metric}`, seasonalView);

      // Create prediction view
      const predictionView = this.createPredictionView(metric, values, this.generateTimeLabels(values.length));
      this.statisticalVisualizations.set(`prediction_${metric}`, predictionView);
    });
  }

  private createDistributionView(metric: string, values: number[]): StatisticalVisualization {
    const stats = this.analyzer.calculateExtendedStatistics(values);
    const bins = this.createHistogramBins(values, 20);
    
    const primary: ChartData = {
      labels: bins.map(b => b.range),
      datasets: [{
        label: 'Frequency',
        data: bins.map(b => b.count),
        borderColor: '#2196F3',
        fill: true
      }]
    };

    // Add normal distribution overlay
    const normalOverlay = this.generateNormalDistribution(stats.mean, stats.stdDev, bins);
    primary.datasets.push({
      label: 'Expected Normal',
      data: normalOverlay,
      borderColor: '#FF5722',
      fill: false
    });

    return {
      type: 'distribution',
      data: {
        primary,
        insights: [
          { key: 'Skewness', value: stats.skewness, confidence: this.calculateSkewnessConfidence(stats.skewness) },
          { key: 'Kurtosis', value: stats.kurtosis, confidence: this.calculateKurtosisConfidence(stats.kurtosis) },
          { key: 'Distribution Type', value: this.determineDistributionType(stats), confidence: 0.85 }
        ]
      },
      metadata: {
        metric,
        timeRange: '24h',
        updateTime: new Date().toISOString()
      }
    };
  }

  private createSeasonalView(metric: string, values: number[], timestamps: string[]): StatisticalVisualization {
    const hourlyPatterns = this.calculateHourlyPatterns(values, timestamps);
    const weeklyPatterns = this.calculateWeeklyPatterns(values, timestamps);
    
    const primary: ChartData = {
      labels: Array.from({length: 24}, (_, i) => `${i}:00`),
      datasets: [{
        label: 'Hourly Pattern',
        data: hourlyPatterns.averages,
        borderColor: '#4CAF50',
        fill: false
      }]
    };

    const secondary: ChartData = {
      labels: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
      datasets: [{
        label: 'Weekly Pattern',
        data: weeklyPatterns.averages,
        borderColor: '#9C27B0',
        fill: false
      }]
    };

    return {
      type: 'seasonal',
      data: {
        primary,
        secondary,
        insights: [
          { key: 'Peak Hours', value: this.findPeakHours(hourlyPatterns), confidence: hourlyPatterns.confidence },
          { key: 'Peak Days', value: this.findPeakDays(weeklyPatterns), confidence: weeklyPatterns.confidence },
          { key: 'Seasonality Strength', value: this.calculateSeasonalityStrength(hourlyPatterns, weeklyPatterns), confidence: 0.9 }
        ]
      },
      metadata: {
        metric,
        timeRange: '7d',
        updateTime: new Date().toISOString()
      }
    };
  }

  private createPredictionView(metric: string, values: number[], timestamps: string[]): StatisticalVisualization {
    const predictions = this.generatePredictions(values, timestamps);
    const confidence = this.calculatePredictionConfidence(predictions.error);
    
    const primary: ChartData = {
      labels: [...timestamps, ...predictions.timestamps],
      datasets: [
        {
          label: 'Actual',
          data: values,
          borderColor: '#2196F3',
          fill: false
        },
        {
          label: 'Predicted',
          data: [...Array(values.length).fill(null), ...predictions.values],
          borderColor: '#FF9800',
          fill: false
        },
        {
          label: 'Confidence Interval',
          data: [...Array(values.length).fill(null), ...predictions.upperBound],
          borderColor: '#FFEB3B',
          fill: false
        },
        {
          label: 'Confidence Interval',
          data: [...Array(values.length).fill(null), ...predictions.lowerBound],
          borderColor: '#FFEB3B',
          fill: false
        }
      ]
    };

    return {
      type: 'prediction',
      data: {
        primary,
        insights: [
          { key: 'Next Peak', value: this.findNextPeak(predictions), confidence: confidence },
          { key: 'Trend', value: this.calculateTrend(predictions), confidence: confidence },
          { key: 'Volatility', value: this.calculateVolatility(predictions), confidence: confidence }
        ]
      },
      metadata: {
        metric,
        timeRange: '24h',
        updateTime: new Date().toISOString()
      }
    };
  }

  private createHistogramBins(values: number[], binCount: number): { range: string; count: number; }[] {
    const min = Math.min(...values);
    const max = Math.max(...values);
    const binWidth = (max - min) / binCount;
    
    const bins = Array.from({length: binCount}, (_, i) => ({
      range: `${(min + i * binWidth).toFixed(2)} - ${(min + (i + 1) * binWidth).toFixed(2)}`,
      count: 0
    }));
    
    values.forEach(value => {
      const binIndex = Math.min(Math.floor((value - min) / binWidth), binCount - 1);
      bins[binIndex].count++;
    });
    
    return bins;
  }

  private generateNormalDistribution(mean: number, stdDev: number, bins: { range: string; count: number; }[]): number[] {
    return bins.map(bin => {
      const [start, end] = bin.range.split(' - ').map(Number);
      const x = (start + end) / 2;
      return (1 / (stdDev * Math.sqrt(2 * Math.PI))) * 
             Math.exp(-0.5 * Math.pow((x - mean) / stdDev, 2)) * 
             values.length * (end - start);
    });
  }

  private calculateSkewnessConfidence(skewness: number): number {
    return Math.exp(-Math.abs(skewness) / 2);
  }

  private calculateKurtosisConfidence(kurtosis: number): number {
    return Math.exp(-Math.abs(kurtosis - 3) / 4);
  }

  private determineDistributionType(stats: any): string {
    if (Math.abs(stats.skewness) < 0.5 && Math.abs(stats.kurtosis) < 0.5) {
      return 'Normal';
    } else if (stats.skewness > 1) {
      return 'Right-Skewed';
    } else if (stats.skewness < -1) {
      return 'Left-Skewed';
    } else if (stats.kurtosis > 1) {
      return 'Heavy-Tailed';
    } else {
      return 'Light-Tailed';
    }
  }

  private findPeakHours(patterns: any): string {
    const peaks = patterns.averages
      .map((value, hour) => ({ hour, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 3);
    
    return peaks.map(p => `${p.hour}:00`).join(', ');
  }

  private findPeakDays(patterns: any): string {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const peaks = patterns.averages
      .map((value, day) => ({ day: days[day], value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 2);
    
    return peaks.map(p => p.day).join(', ');
  }

  private calculateSeasonalityStrength(hourly: any, weekly: any): number {
    const hourlyStrength = Math.max(...hourly.averages) / Math.min(...hourly.averages);
    const weeklyStrength = Math.max(...weekly.averages) / Math.min(...weekly.averages);
    return (hourlyStrength + weeklyStrength) / 2;
  }

  private calculateCorrelation(values1: number[], values2: number[]): number {
    const n = Math.min(values1.length, values2.length);
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

    return sum / Math.sqrt(sum1Sq * sum2Sq);
  }

  private calculateSignificance(correlation: number, n: number): number {
    const t = correlation * Math.sqrt((n - 2) / (1 - correlation * correlation));
    return 2 * (1 - this.studentT(Math.abs(t), n - 2));
  }

  private studentT(t: number, df: number): number {
    // Simplified t-distribution calculation
    const x = df / (df + t * t);
    return 1 - 0.5 * Math.pow(x, df / 2);
  }

  getVisualizations(): Map<string, CorrelationVisualization> {
    return new Map(this.visualizations);
  }

  getStatisticalVisualizations(): Map<string, StatisticalVisualization> {
    return new Map(this.statisticalVisualizations);
  }

  getAnomalies(): Map<string, AnomalyData[]> {
    return new Map(this.anomalies);
  }

  getHeatmaps(): Map<string, HeatmapData[]> {
    return new Map(this.heatmaps);
  }

  getComparativeViews(): Map<string, ComparativeView> {
    return new Map(this.comparativeViews);
  }

  clearVisualizations(): void {
    this.visualizations.clear();
  }
}
