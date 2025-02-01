import { SimulationNodeDatum } from 'd3';

// Core Types
export interface Pattern {
  id: string;
  name: string;
  patterns: string[];
  timestamps: Date[];
  values: number[];
  confidence: number;
}

export interface Correlation {
  id: string;
  sources: string[];
  timestamps: Date[];
  values: number[];
  strength: number;
  direction: 'positive' | 'negative';
}

export interface Trend {
  id: string;
  name: string;
  timestamps: Date[];
  values: number[];
  trend: {
    value: number;
    direction: 'up' | 'down' | 'stable';
    confidence: number;
  };
}

export interface ContextualSignal {
  id: string;
  name: string;
  strength: number;
  context: Record<string, any>;
}

export interface Metric {
  id: string;
  name: string;
  value: number;
  timestamp: Date;
  metadata?: Record<string, any>;
}

// Visualization Types
export interface DemandNode extends d3.SimulationNodeDatum {
  id: string;
  label: string;
  value: number;
  color?: string;
  x?: number;
  y?: number;
  fx?: number | null;
  fy?: number | null;
}

export interface DemandLink extends d3.SimulationLinkDatum<DemandNode> {
  source: string | DemandNode;
  target: string | DemandNode;
  value: number;
}

export interface TimelineEvent {
  id: string;
  timestamp: Date;
  value: number;
  type: string;
  metadata?: Record<string, any>;
}

export interface ChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    borderColor?: string;
    backgroundColor?: string;
  }[];
}

export interface AnomalyData {
  id: string;
  value: number;
  confidence: number;
  trend: number;
}

// Network Types
export interface NetworkNode extends SimulationNodeDatum {
  id: string;
  label: string;
  size: number;
  color: string;
  value?: number;
  x?: number;
  y?: number;
  fx?: number | null;
  fy?: number | null;
  [key: string]: any;
}

export interface NetworkEdge {
  source: string | NetworkNode;
  target: string | NetworkNode;
  value: number;
  label?: string | undefined;
}

// Analysis Types
export interface PredictionResult extends Pattern {
  timestamp: Date;
  value: number;
  confidence: number;
}

export interface MultiSourceCorrelation extends Correlation {
  direction: 'positive' | 'negative';
}

export interface TrendResult extends Trend {
  confidence: number;
}

export interface ExtendedCorrelation extends Correlation {
  sourceA: string;
  sourceB: string;
  confidence: number;
}

export interface ExtendedTrend extends Trend {
  direction: 'up' | 'down' | 'stable';
  confidence: number;
}

export interface ExtendedContextualSignal extends ContextualSignal {
  confidence: number;
}

// Event Types
export interface ValueEvent {
  id: string;
  type: string;
  timestamp: Date;
  value: number;
  metadata?: Record<string, any>;
}

export interface PerformanceMetrics {
  operationName: string;
  duration: number;
  timestamp: number;
  metadata?: Record<string, any>;
}

// Service Types
export interface AudioStreamConfig {
  sampleRate: number;
  channels: number;
  format: string;
}

export interface MeetingInfo {
  id: string;
  participants: string[];
  startTime: Date;
  endTime?: Date;
}

// Removed interfaces
// export interface IntelligenceEvent {
//   timestamp: number;
//   value: number;
//   type: string;
// }

// export interface Signal {
//   id: string;
//   type: string;
//   source: string;
//   timestamp: Date;
//   value: number;
// }

// export interface SystemMetrics {
//   cpu: number;
//   memory: number;
//   timestamp: number;
// }

// export interface AnomalyContext {
//   timestamp: string;
//   value: number;
//   context: string;
// }

// export interface EventCallback<T> {
//   (data: T): void;
// }

// export interface EventEmitter {
//   emit<T>(event: string, data: T): void;
//   on<T>(event: string, callback: EventCallback<T>): void;
//   off<T>(event: string, callback: EventCallback<T>): void;
// }

// export interface MetricsCollector {
//   initialize(): Promise<void>;
//   getMetricValues(): Promise<Record<string, number>>;
//   getMetricValues(metric: string): number[];
//   getLatestMetricValues(): Record<string, number>;
//   on(event: string, callback: EventCallback<Record<string, number>>): void;
// }

// export interface CorrelationAnalyzer {
//   initialize(): Promise<void>;
//   findAnomalies(metrics: Record<string, number>): Promise<AnomalyData[]>;
//   predictTrends(metrics: Record<string, number>): Promise<PredictionResult[]>;
//   on(event: string, callback: EventCallback<AnomalyData[]>): void;
//   getTemporalPatterns(data: Record<string, number>[]): PredictionResult[];
//   getMultiSourceCorrelations(metrics: Record<string, number>[]): MultiSourceCorrelation[];
//   getTrends(data: Record<string, number>[]): TrendResult[];
//   findRelatedMetrics(metric: string): string[];
//   detectAnomalies(data: Record<string, number>[]): AnomalyData[];
// }

// export interface NetworkGraphOptions {
//   width?: number;
//   height?: number;
//   physics?: {
//     enabled: boolean;
//     stabilization: boolean;
//   };
//   nodes?: {
//     shape?: string;
//     size?: number;
//     font?: {
//       size?: number;
//       color?: string;
//     };
//   };
//   edges?: {
//     smooth?: boolean;
//     arrows?: {
//       to?: boolean;
//     };
//   };
// }

// export interface NetworkGraph {
//   addNode(node: NetworkNode): void;
//   addEdge(edge: NetworkEdge): void;
//   onNodeClick(callback: (node: NetworkNode) => void): void;
//   onEdgeClick(callback: (edge: NetworkEdge) => void): void;
// }

// export interface DemandInsights {
//   getEmergingPatterns(): Array<{
//     topic: string;
//     signals: ContextualSignal[];
//     relationshipStrength: number;
//     averageConfidence: number;
//   }>;
//   allSignals: {
//     subscribe(callback: (signal: ContextualSignal) => void): void;
//   };
// }
