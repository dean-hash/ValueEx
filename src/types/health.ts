export type HealthStatusType = 'healthy' | 'degraded' | 'down';

export interface HealthStatus {
  service: string;
  status: HealthStatusType;
  message: string;
  details?: Record<string, unknown>;
  timestamp?: Date;
}

export interface HealthCheck {
  isHealthy(): Promise<boolean>;
}

export interface ServiceHealth {
  name: string;
  status: HealthStatusType;
  lastCheck: Date;
  metrics?: {
    latency?: number;
    errorRate?: number;
    uptime?: number;
  };
}
