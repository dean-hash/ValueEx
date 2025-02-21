import { logger } from '../../utils/logger';
import { MetricsCollector } from '../metrics/metricsCollector';
import { ResourceMonitor } from './resourceMonitor';

interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  components: {
    [key: string]: {
      status: 'healthy' | 'degraded' | 'unhealthy';
      message?: string;
      lastCheck: Date;
    };
  };
  lastUpdate: Date;
}

export class HealthMonitor {
  private static instance: HealthMonitor;
  private status: HealthStatus;
  private metricsCollector: MetricsCollector;
  private resourceMonitor: ResourceMonitor;
  private checkInterval: NodeJS.Timeout;

  private constructor() {
    this.status = {
      status: 'healthy',
      components: {},
      lastUpdate: new Date(),
    };
    this.metricsCollector = MetricsCollector.getInstance();
    this.resourceMonitor = new ResourceMonitor();
  }

  public static getInstance(): HealthMonitor {
    if (!HealthMonitor.instance) {
      HealthMonitor.instance = new HealthMonitor();
    }
    return HealthMonitor.instance;
  }

  public startMonitoring(): void {
    logger.info('Starting health monitoring...');
    this.checkInterval = setInterval(() => this.checkHealth(), 30000); // Check every 30 seconds
  }

  public stopMonitoring(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
    }
  }

  public getStatus(): HealthStatus {
    return { ...this.status };
  }

  private async checkHealth(): Promise<void> {
    try {
      // Check system resources
      const resourceMetrics = await this.resourceMonitor.getMetrics();
      this.updateComponentStatus('resources', resourceMetrics);

      // Check metrics collector
      const metricsStatus = await this.metricsCollector.getStatus();
      this.updateComponentStatus('metrics', metricsStatus);

      // Update overall status
      this.updateOverallStatus();

      logger.debug('Health check completed', { status: this.status });
    } catch (error) {
      logger.error('Error during health check:', error);
      this.status.status = 'degraded';
    }

    this.status.lastUpdate = new Date();
  }

  private updateComponentStatus(
    component: string,
    metrics: { status: 'healthy' | 'degraded' | 'unhealthy'; message?: string }
  ): void {
    this.status.components[component] = {
      ...metrics,
      lastCheck: new Date(),
    };
  }

  private updateOverallStatus(): void {
    const componentStatuses = Object.values(this.status.components);

    if (componentStatuses.some((c) => c.status === 'unhealthy')) {
      this.status.status = 'unhealthy';
    } else if (componentStatuses.some((c) => c.status === 'degraded')) {
      this.status.status = 'degraded';
    } else {
      this.status.status = 'healthy';
    }
  }
}

export const healthMonitor = HealthMonitor.getInstance();
