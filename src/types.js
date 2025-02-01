"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
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
