import { EventEmitter } from 'events';
interface ChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    borderColor: string;
    fill: boolean;
  }[];
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
    correlations: Array<{
      source: string;
      target: string;
      strength: number;
    }>;
    anomalies: AnomalyData[];
    predictions: {
      shortTerm: number[];
      longTerm: number[];
      confidence: number;
    };
  };
}
export declare class CorrelationDashboard extends EventEmitter {
  private static instance;
  private analyzer;
  private monitor;
  private metrics;
  private visualizations;
  private statisticalVisualizations;
  private demandVisualizations;
  private anomalies;
  private heatmaps;
  private comparativeViews;
  private drillDownViews;
  private activeFilters;
  private updateSubscriptions;
  private updateInterval;
  private constructor();
  static getInstance(): CorrelationDashboard;
  private setupEventListeners;
  private initializeRealTimeUpdates;
  private updateEmergingPatterns;
  private renderPatternTimeline;
  startRealTimeUpdates(interval?: number): void;
  stopRealTimeUpdates(): void;
  private updateAllVisualizations;
  drillDown(viewId: string, config: Partial<DrillDownConfig>): DrillDownView;
  private createDrillDownView;
  private setupRealTimeUpdates;
  private determineUpdateInterval;
  private fetchLatestData;
  private updateDrillDownView;
  private calculateViewChanges;
  private generateRealTimeInsights;
  private applyFilters;
  private renderDemandNetwork;
  private getConfidenceColor;
  private getRelationshipColor;
  private truncateIntent;
  private showSignalDetails;
}
export {};
