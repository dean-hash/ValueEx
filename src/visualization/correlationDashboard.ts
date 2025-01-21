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

interface DemandVisualization {
  type: 'sentiment' | 'topics' | 'clusters';
  data: {
    primary: ChartData;
    insights: {
      key: string;
      value: number | string;
      confidence: number;
    }[];
    clusters?: Map<
      string,
      {
        size: number;
        avgSentiment: number;
        dominantTopics: string[];
      }
    >;
  };
  metadata: {
    category: string;
    timeRange: string;
    updateTime: string;
  };
}

export class CorrelationDashboard extends EventEmitter {
  private static instance: CorrelationDashboard;
  private analyzer: CorrelationAnalyzer;
  private monitor: ResourceMonitor;
  private metrics: MetricsCollector;
  private visualizations: Map<string, CorrelationVisualization> = new Map();
  private statisticalVisualizations: Map<string, StatisticalVisualization> = new Map();
  private demandVisualizations: Map<string, DemandVisualization> = new Map();
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
    this.initializeRealTimeUpdates();
  }

  public static getInstance(): CorrelationDashboard {
    if (!CorrelationDashboard.instance) {
      CorrelationDashboard.instance = new CorrelationDashboard();
    }
    return CorrelationDashboard.instance;
  }

  private setupEventListeners(): void {
    // Listen for temporal patterns
    this.analyzer.on('temporal_pattern_detected', (pattern) => {
      this.updateTemporalVisualization(pattern);
    });

    // Listen for multi-source correlations
    this.analyzer.on('multi_source_correlation_detected', (correlation) => {
      this.updateMultiSourceVisualization(correlation);
    });

    // Listen for trend detections
    this.analyzer.on('trend_detected', (trend) => {
      this.updateTrendVisualization(trend);
    });
  }

  private initializeRealTimeUpdates(): void {
    this.demandInsights.allSignals.subscribe((signal) => {
      // Update network visualization in real-time
      const network = document.getElementById('demand-network');
      if (!network) return;

      // Add new signal node
      this.addSignalToNetwork(signal);

      // Update relationship strengths
      signal.relatedSignals.forEach((related) => {
        if (related.relationship > 0.3) {
          this.updateNetworkRelationship(signal, related);
        }
      });

      // Update pattern highlights
      this.updateEmergingPatterns();
    });
  }

  private updateEmergingPatterns(): void {
    const patterns = Array.from(this.demandInsights.getEmergingPatterns())
      .filter((pattern) => pattern.signals.length >= 3)
      .sort((a, b) => b.relationshipStrength - a.relationshipStrength)
      .slice(0, 5); // Top 5 strongest patterns

    const patternList = document.getElementById('emerging-patterns');
    if (!patternList) return;

    patternList.innerHTML = patterns
      .map(
        (pattern) => `
      <div class="pattern-card ${pattern.relationshipStrength > 0.7 ? 'strong-pattern' : ''}">
        <h4>${pattern.topic}</h4>
        <p>Strength: ${(pattern.relationshipStrength * 100).toFixed(1)}%</p>
        <p>Signals: ${pattern.signals.length}</p>
        <p>Average Confidence: ${(pattern.averageConfidence * 100).toFixed(1)}%</p>
        <div class="pattern-timeline">
          ${this.renderPatternTimeline(pattern.signals)}
        </div>
      </div>
    `
      )
      .join('');
  }

  private renderPatternTimeline(signals: ContextualSignal[]): string {
    const timeRange = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
    const now = Date.now();
    const earliest = now - timeRange;

    return signals
      .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())
      .map((signal) => {
        const position = ((signal.timestamp.getTime() - earliest) / timeRange) * 100;
        return `
          <div class="timeline-point" 
               style="left: ${position}%"
               title="${signal.intent}"
               data-confidence="${signal.contextualConfidence}">
          </div>
        `;
      })
      .join('');
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
        patterns,
      });
    });

    // Update multi-source correlations
    const multiSourceCorrelations = this.analyzer.getMultiSourceCorrelations();
    multiSourceCorrelations.forEach((correlations, key) => {
      this.updateMultiSourceVisualization({
        sources: key.split('_'),
        correlation: correlations[correlations.length - 1],
      });
    });

    // Update trends
    const trends = this.analyzer.getTrends();
    trends.forEach((trend, metric) => {
      this.updateTrendVisualization({
        metric,
        trend,
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

    // Update demand visualizations
    this.updateDemandVisualizations();

    // Emit update event
    this.emit('visualizations_updated', {
      patterns: Array.from(this.visualizations.entries()),
      anomalies: Array.from(this.anomalies.entries()),
      heatmaps: Array.from(this.heatmaps.entries()),
      comparativeViews: Array.from(this.comparativeViews.entries()),
      statisticalVisualizations: Array.from(this.statisticalVisualizations.entries()),
      demandVisualizations: Array.from(this.demandVisualizations.entries()),
    });
  }

  public drillDown(viewId: string, config: Partial<DrillDownConfig>): DrillDownView {
    const baseView = this.statisticalVisualizations.get(viewId);
    if (!baseView) throw new Error(`View ${viewId} not found`);

    const currentConfig = this.drillDownViews.get(viewId)?.config || {
      timeRange: 'day',
      granularity: 'hour',
      filters: new Map(),
    };

    const newConfig: DrillDownConfig = {
      ...currentConfig,
      ...config,
      filters: new Map([...currentConfig.filters, ...(config.filters || new Map())]),
    };

    const drillDownView = this.createDrillDownView(baseView, newConfig);
    this.drillDownViews.set(viewId, drillDownView);

    // Set up real-time updates for this view
    this.setupRealTimeUpdates(viewId, drillDownView);

    return drillDownView;
  }

  private createDrillDownView(
    base: StatisticalVisualization,
    config: DrillDownConfig
  ): DrillDownView {
    const filteredData = this.applyFilters(base.data.primary, config);
    const timeWindowedData = this.applyTimeWindow(filteredData, config);

    const correlations = this.analyzer.findRelatedMetrics(base.metadata.metric, config);
    const anomalies = this.analyzer.detectAnomalies(
      timeWindowedData.datasets[0].data,
      timeWindowedData.labels
    );
    const predictions = this.generatePredictions(timeWindowedData.datasets[0].data, config);

    const children = correlations.map((correlation) =>
      this.createDrillDownView(
        {
          ...base,
          metadata: { ...base.metadata, metric: correlation.target },
        },
        config
      )
    );

    return {
      ...base,
      type: 'prediction',
      data: {
        primary: timeWindowedData,
        insights: [
          { key: 'Correlation Strength', value: correlations[0]?.strength || 0, confidence: 0.9 },
          { key: 'Anomaly Count', value: anomalies.length, confidence: 0.85 },
          {
            key: 'Prediction Accuracy',
            value: predictions.confidence,
            confidence: predictions.confidence,
          },
        ],
      },
      children,
      config,
      insights: {
        correlations,
        anomalies,
        predictions: {
          shortTerm: predictions.values.slice(0, 24),
          longTerm: predictions.values.slice(24),
          confidence: predictions.confidence,
        },
      },
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
        insights: this.generateRealTimeInsights(updatedView),
      });
    }, updateInterval);
  }

  private determineUpdateInterval(config: DrillDownConfig): number {
    switch (config.granularity) {
      case 'minute':
        return 60000; // 1 minute
      case 'hour':
        return 300000; // 5 minutes
      case 'day':
        return 3600000; // 1 hour
      default:
        return 300000; // 5 minutes default
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
    const anomalies = this.analyzer.detectAnomalies(
      updatedData.datasets[0].data,
      updatedData.labels
    );

    return {
      ...view,
      data: {
        ...view.data,
        primary: updatedData,
      },
      insights: {
        ...view.insights,
        anomalies,
        predictions: {
          shortTerm: predictions.values.slice(0, 24),
          longTerm: predictions.values.slice(24),
          confidence: predictions.confidence,
        },
      },
    };
  }

  private calculateViewChanges(oldView: DrillDownView, newView: DrillDownView): any {
    return {
      newAnomalies: this.findNewAnomalies(oldView.insights.anomalies, newView.insights.anomalies),
      predictionChanges: this.comparePredictions(
        oldView.insights.predictions,
        newView.insights.predictions
      ),
      significantChanges: this.findSignificantChanges(oldView.data.primary, newView.data.primary),
    };
  }

  private generateRealTimeInsights(view: DrillDownView): any {
    return {
      trendStrength: this.calculateTrendStrength(view.data.primary),
      anomalyRisk: this.calculateAnomalyRisk(view.insights.anomalies),
      predictionConfidence: view.insights.predictions.confidence,
      recentChanges: this.summarizeRecentChanges(view.data.primary),
    };
  }

  private applyFilters(data: ChartData, config: DrillDownConfig): ChartData {
    // Apply filters based on config
    return {
      ...data,
      datasets: data.datasets.map((dataset) => ({
        ...dataset,
        data: dataset.data.filter((value, index) => {
          const timestamp = data.labels[index];
          return (
            this.filterByTimeRange(timestamp, config.timeRange) &&
            this.filterByGranularity(timestamp, config.granularity) &&
            this.filterByRegion(dataset.label, config.region) &&
            this.filterByCategory(dataset.label, config.category) &&
            this.filterByFilters(dataset.label, config.filters)
          );
        }),
      })),
    };
  }

  private renderDemandNetwork(): void {
    const networkContainer = document.getElementById('demand-network');
    if (!networkContainer) return;

    const signals = Array.from(this.demandInsights.getEmergingPatterns())
      .filter((pattern) => pattern.signals.length >= 2)
      .slice(0, 10); // Focus on top 10 patterns for clarity

    // Create network visualization
    const network = new NetworkGraph(networkContainer, {
      height: 500,
      width: 800,
      animate: true,
      theme: 'light',
    });

    // Add nodes and edges based on signal relationships
    signals.forEach((pattern) => {
      pattern.signals.forEach((signal) => {
        network.addNode({
          id: signal.id,
          label: this.truncateIntent(signal.intent),
          size: 30 + signal.contextualConfidence * 20,
          color: this.getConfidenceColor(signal.contextualConfidence),
        });

        signal.relatedSignals.forEach((related) => {
          if (related.relationship > 0.3) {
            network.addEdge({
              from: signal.id,
              to: related.signal.id,
              width: related.relationship * 5,
              color: this.getRelationshipColor(related.relationship),
            });
          }
        });
      });
    });

    // Add interactive features
    network.onNodeClick((node) => {
      this.showSignalDetails(node.id);
    });

    network.onEdgeClick((edge) => {
      this.showRelationshipDetails(edge.from, edge.to);
    });
  }

  private getConfidenceColor(confidence: number): string {
    // Green gradient based on confidence
    const hue = 120; // Green
    const saturation = 70;
    const lightness = 100 - confidence * 50; // Darker = higher confidence
    return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
  }

  private getRelationshipColor(strength: number): string {
    // Blue gradient based on relationship strength
    const hue = 200; // Blue
    const saturation = 80;
    const lightness = 100 - strength * 50;
    return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
  }

  private truncateIntent(intent: string): string {
    return intent.length > 30 ? `${intent.substring(0, 27)}...` : intent;
  }

  private showSignalDetails(signalId: string): void {
    const signal = this.findSignalById(signalId);
    if (!signal) return;

    const details = document.getElementById('signal-details');
    if (!details) return;

    details.innerHTML = `
      <div class="signal-card">
        <h3>Demand Signal Details</h3>
        <p><strong>Intent:</strong> ${signal.intent}</p>
        <p><strong>Confidence:</strong> ${(signal.contextualConfidence * 100).toFixed(1)}%</p>
        <p><strong>Topics:</strong> ${signal.topics.join(', ')}</p>
        <p><strong>Related Signals:</strong> ${signal.relatedSignals.length}</p>
        <div class="value-constraints">
          <p><strong>Budget:</strong> $${signal.context.valueConstraints?.budget || 'N/A'}</p>
          <p><strong>Timeframe:</strong> ${signal.context.valueConstraints?.timeframe || 'N/A'}</p>
        </div>
      </div>
    `;
  }
}
