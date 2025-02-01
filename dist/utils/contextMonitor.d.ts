import { EventEmitter } from 'events';
interface MonitoringMetrics {
  contextSize: number;
  memoryUsage: number;
  responseLatency: number;
  contextContinuity: number;
}
interface AlertConfig {
  enabled: boolean;
  threshold: number;
  notifyImmediately: boolean;
}
interface MonitoringConfig {
  checkInterval: number;
  metrics: (keyof MonitoringMetrics)[];
  alerts: {
    contextLoss: AlertConfig;
    performanceDegradation: AlertConfig;
  };
  logging: {
    enabled: boolean;
    level: string;
    file: string;
    rotation: {
      maxSize: string;
      maxFiles: number;
    };
  };
}
export declare class ContextMonitor extends EventEmitter {
  private metrics;
  private metricsLog;
  private readonly LOG_FILE;
  private readonly METRICS_FILE;
  private config;
  private logStream;
  private checkInterval;
  private lastCheck;
  private readonly CHECK_INTERVAL;
  constructor(config: MonitoringConfig);
  private initializeLogging;
  private initialize;
  private checkContextContinuity;
  updateMetric(name: string, value: number): Promise<void>;
  log(level: 'debug' | 'info' | 'warn' | 'error', message: string): void;
  getMetrics(): {
    timestamp: string;
    metric: string;
    value: number;
  }[];
  dispose(): void;
}
export {};
