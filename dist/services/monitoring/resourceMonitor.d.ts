import { EventEmitter } from 'events';
import { MetricsCollector } from './metrics';
export interface ResourceSnapshot {
  timestamp: number;
  cpu: {
    usage: number;
    load: number[];
  };
  memory: {
    total: number;
    used: number;
    free: number;
    heapUsed: number;
    heapTotal: number;
  };
  disk: {
    total: number;
    free: number;
    used: number;
  };
  network: {
    latency: number;
    bytesIn: number;
    bytesOut: number;
  };
}
export interface MemoryUsage {
  used: number;
  total: number;
  free: number;
  leaks: number;
}
export interface NetworkMetrics {
  latency: number;
  bytesIn: number;
  bytesOut: number;
}
export declare class ResourceMonitor extends EventEmitter {
  private metrics;
  private snapshots;
  private readonly MAX_SNAPSHOTS;
  private monitoringTimer?;
  private readonly ALERT_THRESHOLDS;
  constructor(metricsCollector?: MetricsCollector);
  startMonitoring(interval?: number): void;
  stopMonitoring(): void;
  private captureSnapshot;
  private getDiskUsage;
  getNetworkMetrics(): Promise<NetworkMetrics>;
  getMemoryUsage(): Promise<MemoryUsage>;
  private updateMetrics;
  getResourceSnapshots(seconds: number): Promise<ResourceSnapshot[]>;
  clearHistory(): void;
  private checkThresholds;
}
