import { EventEmitter } from 'events';
import { MetricsCollector } from './metricsCollector';
import { OptimizationEngine } from './optimizationEngine';
import type { ResonanceField } from '../../types/resonanceField';

interface HealthStatus {
  status: 'healthy' | 'warning' | 'critical';
  components: {
    [key: string]: {
      status: 'healthy' | 'warning' | 'critical';
      metrics: any;
      lastCheck: number;
    };
  };
  lastUpdate: number;
}

export class HealthMonitor extends EventEmitter {
  private static instance: HealthMonitor;
  private metricsCollector: MetricsCollector;
  private optimizationEngine: OptimizationEngine;
  private resonanceField: ResonanceField;
  private status: HealthStatus;
  private checkInterval: NodeJS.Timer;

  private constructor() {
    super();
    this.metricsCollector = MetricsCollector.getInstance();
    this.optimizationEngine = OptimizationEngine.getInstance();
    this.resonanceField = ResonanceField.getInstance();

    this.status = {
      status: 'healthy',
      components: {},
      lastUpdate: Date.now(),
    };

    this.initializeMonitoring();
  }

  public static getInstance(): HealthMonitor {
    if (!HealthMonitor.instance) {
      HealthMonitor.instance = new HealthMonitor();
    }
    return HealthMonitor.instance;
  }

  private initializeMonitoring() {
    // Monitor metrics
    this.metricsCollector.on('metric-collected', (data) => {
      this.updateComponentHealth(data);
    });

    // Monitor optimization events
    this.optimizationEngine.on('optimization-complete', (data) => {
      this.handleOptimizationEvent(data);
    });

    // Monitor resonance field anomalies
    this.resonanceField.on('anomaly', (anomalies) => {
      this.handleAnomalies(anomalies);
    });

    // Regular health checks
    this.checkInterval = setInterval(() => {
      this.performHealthCheck();
    }, 10000);
  }

  private updateComponentHealth(data: any) {
    const { name, value } = data;
    const component = this.status.components[name] || {
      status: 'healthy',
      metrics: {},
      lastCheck: Date.now(),
    };

    component.metrics = {
      ...component.metrics,
      current: value,
      timestamp: Date.now(),
    };

    // Update component status based on thresholds
    component.status = this.calculateComponentStatus(name, value);
    component.lastCheck = Date.now();

    this.status.components[name] = component;
    this.updateOverallStatus();
  }

  private calculateComponentStatus(
    name: string,
    value: number
  ): 'healthy' | 'warning' | 'critical' {
    const thresholds = {
      apiResponseTime: { warning: 300, critical: 500 },
      memoryUsage: { warning: 0.7, critical: 0.85 },
      errorRate: { warning: 0.02, critical: 0.05 },
      cpuUsage: { warning: 0.6, critical: 0.8 },
    };

    const componentThresholds = thresholds[name];
    if (!componentThresholds) return 'healthy';

    if (value >= componentThresholds.critical) return 'critical';
    if (value >= componentThresholds.warning) return 'warning';
    return 'healthy';
  }

  private updateOverallStatus() {
    const componentStatuses = Object.values(this.status.components).map((c) => c.status);

    if (componentStatuses.includes('critical')) {
      this.status.status = 'critical';
    } else if (componentStatuses.includes('warning')) {
      this.status.status = 'warning';
    } else {
      this.status.status = 'healthy';
    }

    this.status.lastUpdate = Date.now();
    this.emit('health-update', this.status);
  }

  private async performHealthCheck() {
    const metrics = this.metricsCollector.getAllMetrics();

    for (const [name, values] of metrics) {
      if (values.length > 0) {
        const latestValue = values[values.length - 1].value;
        this.updateComponentHealth({ name, value: latestValue });
      }
    }

    // Check for stale components
    const now = Date.now();
    for (const [name, component] of Object.entries(this.status.components)) {
      if (now - component.lastCheck > 30000) {
        // 30 seconds
        component.status = 'warning';
        this.emit('component-stale', { name, lastCheck: component.lastCheck });
      }
    }

    this.updateOverallStatus();
  }

  private handleOptimizationEvent(data: any) {
    const { strategy, timestamp } = data;
    this.emit('optimization-event', {
      strategy,
      timestamp,
      impact: this.calculateOptimizationImpact(strategy),
    });
  }

  private calculateOptimizationImpact(strategy: string): number {
    // Calculate the impact of optimization based on metrics before and after
    return 0.5; // Placeholder
  }

  private handleAnomalies(anomalies: any[]) {
    anomalies.forEach((anomaly) => {
      this.emit('anomaly-detected', {
        ...anomaly,
        timestamp: Date.now(),
        suggestedAction: this.suggestAction(anomaly),
      });
    });
  }

  private suggestAction(anomaly: any): string {
    // Implement action suggestion logic based on anomaly type and severity
    return `Suggested action for ${anomaly.metric} anomaly`;
  }

  public getHealthStatus(): HealthStatus {
    return { ...this.status };
  }

  public getComponentHealth(component: string) {
    return this.status.components[component];
  }
}
