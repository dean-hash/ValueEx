import { EventEmitter } from 'events';
import { MetricsCollector } from './metricsCollector';
import { UnifiedIntelligenceField } from '../intelligence/unifiedIntelligenceField';

export interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  message: string;
  timestamp: Date;
  components: Record<string, ComponentHealth>;
  lastUpdate: number;
}

export interface ComponentHealth {
  status: 'healthy' | 'degraded' | 'unhealthy';
  metrics: Record<string, number>;
  message?: string;
  lastCheck: number;
}

export interface HealthThresholds {
  apiResponseTime: { degraded: number; unhealthy: number };
  memoryUsage: { degraded: number; unhealthy: number };
  errorRate: { degraded: number; unhealthy: number };
  cpuUsage: { degraded: number; unhealthy: number };
}

export class HealthMonitor extends EventEmitter {
  private static instance: HealthMonitor;
  private metricsCollector: MetricsCollector;
  private intelligenceField: UnifiedIntelligenceField;
  private status: HealthStatus;
  private checkInterval: NodeJS.Timeout;
  private thresholds: HealthThresholds;

  constructor(metricsCollector: MetricsCollector, intelligenceField: UnifiedIntelligenceField) {
    super();
    this.metricsCollector = metricsCollector;
    this.intelligenceField = intelligenceField;

    this.status = {
      status: 'healthy',
      message: 'System is healthy',
      timestamp: new Date(),
      components: {},
      lastUpdate: Date.now(),
    };

    this.thresholds = {
      apiResponseTime: { degraded: 500, unhealthy: 1000 },
      memoryUsage: { degraded: 70, unhealthy: 90 },
      errorRate: { degraded: 5, unhealthy: 10 },
      cpuUsage: { degraded: 80, unhealthy: 95 },
    };

    this.checkInterval = setInterval(() => this.checkHealth(), 60000);
    this.initializeMonitoring();
  }

  private initializeMonitoring(): void {
    this.metricsCollector.on('metric-collected', (data: Record<string, number>) => {
      this.updateComponentHealth(data);
    });

    this.intelligenceField.on(
      'resonance-change',
      (anomalies: Array<{ metric: string; value: number }>) => {
        this.handleAnomalies(anomalies);
      }
    );
  }

  public getStatus(): HealthStatus {
    return { ...this.status };
  }

  private updateComponentHealth(data: Record<string, number>): void {
    const component: ComponentHealth = {
      status: 'healthy',
      metrics: data,
      lastCheck: Date.now(),
    };

    component.status = this.evaluateComponentHealth(component.metrics).status;
    this.status.components[data.componentName || 'system'] = component;
    this.updateOverallStatus();
  }

  private evaluateComponentHealth(metrics: Record<string, number>): ComponentHealth {
    let status: ComponentHealth['status'] = 'healthy';
    let message = '';

    Object.entries(metrics).forEach(([metric, value]) => {
      const threshold = this.thresholds[metric as keyof HealthThresholds];
      if (threshold) {
        if (value >= threshold.unhealthy) {
          status = 'unhealthy';
          message = `${metric} exceeds unhealthy threshold`;
        } else if (value >= threshold.degraded && status !== 'unhealthy') {
          status = 'degraded';
          message = `${metric} exceeds degraded threshold`;
        }
      }
    });

    return {
      status,
      metrics,
      message,
      lastCheck: Date.now(),
    };
  }

  private updateOverallStatus(): void {
    const statuses = Object.values(this.status.components).map((c) => c.status);
    
    if (statuses.includes('unhealthy')) {
      this.status.status = 'unhealthy';
      this.status.message = 'One or more components are unhealthy';
    } else if (statuses.includes('degraded')) {
      this.status.status = 'degraded';
      this.status.message = 'One or more components are degraded';
    } else {
      this.status.status = 'healthy';
      this.status.message = 'All components are healthy';
    }

    this.status.lastUpdate = Date.now();
    this.emit('health-update', this.status);
  }

  private handleAnomalies(anomalies: Array<{ metric: string; value: number }>): void {
    anomalies.forEach(({ metric, value }) => {
      console.warn(`Anomaly detected in ${metric}: ${value}`);
      this.emit('anomaly-detected', { metric, value });
    });
  }

  public getComponentHealth(component: string): ComponentHealth | undefined {
    return this.status.components[component];
  }

  public stop(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
    }
  }

  private checkHealth(): void {
    // Perform health checks
    this.status.timestamp = new Date();
    this.emit('health-update', this.status);
  }
}
