import { Chart, ChartConfiguration } from 'chart.js';
import { CorrelationAnalyzer } from '../analysis/CorrelationAnalyzer';
import { MetricsCollector } from '../collectors/MetricsCollector';
import { NetworkGraph } from './NetworkGraph';
import { DemandInsights } from '../insights/DemandInsights';
import { EventEmitter } from 'events';
import { 
  ContextualSignal, 
  AnomalyData, 
  PredictionResult, 
  MultiSourceCorrelation, 
  NetworkNode, 
  NetworkEdge,
  Pattern,
  Correlation,
  Trend,
  ChartData,
  Metric
} from '../types';
import { Observable } from 'rxjs';

interface BaseVisualization {
  id: string;
  data: ChartData;
  config: ChartConfiguration;
  update: (data: ChartData) => void;
}

interface CorrelationVisualization extends BaseVisualization {}
interface StatisticalVisualization extends BaseVisualization {}
interface DemandVisualization extends BaseVisualization {}
interface ComparativeView extends BaseVisualization {}
interface DrillDownView extends BaseVisualization {}

interface HeatmapData {
  x: number;
  y: number;
  value: number;
}

export class CorrelationDashboard extends EventEmitter {
  private static instance: CorrelationDashboard | null = null;
  private analyzer: CorrelationAnalyzer;
  private metrics: MetricsCollector;
  private demandInsights: DemandInsights;
  private visualizations: Map<string, CorrelationVisualization>;
  private statisticalVisualizations: Map<string, StatisticalVisualization>;
  private demandVisualizations: Map<string, DemandVisualization>;
  private anomalies: Map<string, AnomalyData[]>;
  private heatmaps: Map<string, HeatmapData[]>;
  private comparativeViews: Map<string, ComparativeView>;
  private drillDownViews: Map<string, DrillDownView>;
  private activeFilters: Map<string, string[]>;
  private updateSubscriptions: Set<string>;
  private updateInterval: NodeJS.Timeout | null;
  private networkGraph: NetworkGraph | null = null;
  private updateIntervalTime: number = 5000; // 5 seconds
  private intervalId: NodeJS.Timeout | null = null;

  private constructor(
    containerId: string,
    metricsCollector: MetricsCollector,
    correlationAnalyzer: CorrelationAnalyzer,
    demandInsights: DemandInsights
  ) {
    super();
    this.analyzer = correlationAnalyzer;
    this.metrics = metricsCollector;
    this.demandInsights = demandInsights;
    this.networkGraph = new NetworkGraph(containerId);
    this.visualizations = new Map();
    this.statisticalVisualizations = new Map();
    this.demandVisualizations = new Map();
    this.anomalies = new Map();
    this.heatmaps = new Map();
    this.comparativeViews = new Map();
    this.drillDownViews = new Map();
    this.activeFilters = new Map();
    this.updateSubscriptions = new Set();
    this.updateInterval = null;
    this.intervalId = null;
    this.setupEventListeners();
    this.initializeRealTimeUpdates();
  }

  public static getInstance(
    containerId: string,
    metricsCollector: MetricsCollector,
    correlationAnalyzer: CorrelationAnalyzer,
    demandInsights: DemandInsights
  ): CorrelationDashboard {
    if (!CorrelationDashboard.instance) {
      CorrelationDashboard.instance = new CorrelationDashboard(
        containerId,
        metricsCollector,
        correlationAnalyzer,
        demandInsights
      );
    }
    return CorrelationDashboard.instance;
  }

  private setupEventListeners(): void {
    this.analyzer.on('pattern-detected', (pattern: Pattern) => {
      this.updateTemporalVisualization(pattern);
    });

    this.analyzer.on('correlation-detected', (correlation: Correlation) => {
      this.updateMultiSourceVisualization(correlation);
    });

    this.analyzer.on('trend-detected', (trend: Trend) => {
      this.updateTrendVisualization(trend);
    });

    const emergingSignals$ = this.demandInsights.getEmergingSignals() as Observable<ContextualSignal>;
    emergingSignals$.subscribe((signal: ContextualSignal) => {
      this.addSignalToNetwork(signal);
    });

    if (this.networkGraph) {
      this.networkGraph.onNodeClick((node: NetworkNode) => {
        this.handleNodeClick(node);
      });

      this.networkGraph.onEdgeClick((edge: NetworkEdge) => {
        this.handleEdgeClick(edge);
      });
    }
  }

  private initializeRealTimeUpdates(): void {
    this.updateInterval = setInterval(() => {
      this.updateVisualizations();
    }, this.updateIntervalTime);
  }

  private updateVisualizations(): void {
    const metrics = this.metrics.getLatestMetrics();
    const patterns = this.analyzer.getTemporalPatterns(metrics);
    const correlations = this.analyzer.getMultiSourceCorrelations(metrics);
    const trends = this.analyzer.getTrends(metrics);

    patterns.forEach(pattern => {
      this.updateTemporalVisualization(pattern);
    });

    correlations.forEach(correlation => {
      this.updateMultiSourceVisualization(correlation);
    });

    trends.forEach(trend => {
      this.updateTrendVisualization(trend);
    });
  }

  private updateTemporalVisualization(pattern: Pattern): void {
    const visualization = this.visualizations.get(pattern.id);
    if (visualization) {
      const chartData: ChartData = {
        labels: pattern.timestamps,
        datasets: [{
          label: pattern.name,
          data: pattern.values,
          borderColor: this.getConfidenceColor(pattern.confidence),
          fill: false
        }]
      };
      visualization.update(chartData);
    }
  }

  private updateMultiSourceVisualization(correlation: Correlation): void {
    const visualization = this.statisticalVisualizations.get(correlation.id);
    if (visualization) {
      const chartData: ChartData = {
        labels: correlation.timestamps,
        datasets: [{
          label: `${correlation.sourceA} vs ${correlation.sourceB}`,
          data: correlation.values,
          borderColor: this.getCorrelationColor(correlation.strength),
          fill: false
        }]
      };
      visualization.update(chartData);
    }

    // Update network graph
    const sourceNode: NetworkNode = {
      id: correlation.sourceA,
      label: correlation.sourceA,
      size: 30,
      color: this.getConfidenceColor(correlation.confidence)
    };

    const targetNode: NetworkNode = {
      id: correlation.sourceB,
      label: correlation.sourceB,
      size: 30,
      color: this.getConfidenceColor(correlation.confidence)
    };

    const edge: NetworkEdge = {
      from: correlation.sourceA,
      to: correlation.sourceB,
      width: Math.abs(correlation.strength) * 5,
      color: this.getCorrelationColor(correlation.strength)
    };

    if (this.networkGraph) {
      this.networkGraph.addNode(sourceNode);
      this.networkGraph.addNode(targetNode);
      this.networkGraph.addEdge(edge);
    }
  }

  private updateTrendVisualization(trend: Trend): void {
    const visualization = this.demandVisualizations.get(trend.id);
    if (visualization) {
      const chartData: ChartData = {
        labels: trend.timestamps,
        datasets: [{
          label: trend.name,
          data: trend.values,
          borderColor: this.getTrendColor(trend.direction),
          fill: false
        }]
      };
      visualization.update(chartData);
    }
  }

  private addSignalToNetwork(signal: ContextualSignal): void {
    const node: NetworkNode = {
      id: signal.id,
      label: signal.name,
      size: 30 * signal.strength,
      color: this.getConfidenceColor(signal.confidence)
    };
    if (this.networkGraph) {
      this.networkGraph.addNode(node);
    }
  }

  private getConfidenceColor(confidence: number): string {
    if (confidence >= 0.8) return '#28a745';
    if (confidence >= 0.6) return '#ffc107';
    return '#dc3545';
  }

  private getCorrelationColor(correlation: number): string {
    const strength = Math.abs(correlation);
    if (strength >= 0.8) return '#28a745';
    if (strength >= 0.6) return '#ffc107';
    return '#dc3545';
  }

  private getTrendColor(direction: 'up' | 'down' | 'stable'): string {
    switch (direction) {
      case 'up': return '#28a745';
      case 'down': return '#dc3545';
      default: return '#ffc107';
    }
  }

  private handleNodeClick(node: NetworkNode): void {
    console.log('Node clicked:', node);
  }

  private handleEdgeClick(edge: NetworkEdge): void {
    console.log('Edge clicked:', edge);
  }

  public destroy(): void {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
    if (this.networkGraph) {
      this.networkGraph.destroy();
      this.networkGraph = null;
    }
    this.visualizations.clear();
    this.statisticalVisualizations.clear();
    this.demandVisualizations.clear();
    this.anomalies.clear();
    this.heatmaps.clear();
    this.comparativeViews.clear();
    this.drillDownViews.clear();
    this.activeFilters.clear();
    this.updateSubscriptions.clear();
    CorrelationDashboard.instance = null;
  }
}
