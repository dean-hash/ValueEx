export interface AnalysisConfig {
  updateInterval: number;
  batchSize: number;
  maxQueueSize: number;
}

export interface AnalysisResult {
  confidence: number;
  intensity: number;
  timestamp: number;
  metrics: {
    cpu: number;
    memory: number;
    latency: number;
  };
}

export interface ResourceSnapshot {
  timestamp: number;
  cpu: number;
  memory: number;
  activeConnections: number;
}

export interface PerformanceMetrics {
  averageCpu: number;
  averageMemory: number;
  averageLatency: number;
  throughput: number;
}
