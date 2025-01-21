import { MetricsCollector } from './metricsCollector';
import { logger } from '../utils/logger';

interface MetricsSummary {
  errors: {
    rate: number;
  };
  valueMetrics: {
    helpfulnessRatio: number;
    communityImpact: number;
  };
  engagement: {
    reports: number;
    upvotes: number;
  };
  api: {
    rateLimit: {
      remaining: number;
      total: number;
    };
  };
  conversions: {
    rate: number;
  };
  responses: {
    total: number;
  };
}

interface AlertConfig {
  name: string;
  condition: (metrics: MetricsSummary) => boolean;
  message: (metrics: MetricsSummary) => string;
  severity: 'info' | 'warning' | 'error';
  cooldown: number; // minutes
}

interface AlertState {
  lastTriggered?: number;
  isActive: boolean;
}

export class AlertManager {
  private static instance: AlertManager;
  private alertStates: Map<string, AlertState> = new Map();
  private alertConfigs: AlertConfig[] = [
    {
      name: 'highErrorRate',
      condition: (m: MetricsSummary) => m.errors.rate > 0.05,
      message: (m: MetricsSummary) =>
        `High error rate detected: ${(m.errors.rate * 100).toFixed(1)}%`,
      severity: 'error',
      cooldown: 30,
    },
    {
      name: 'lowHelpfulness',
      condition: (m: MetricsSummary) => m.valueMetrics.helpfulnessRatio < 0.8,
      message: (m: MetricsSummary) =>
        `Helpfulness ratio below threshold: ${(m.valueMetrics.helpfulnessRatio * 100).toFixed(1)}%`,
      severity: 'warning',
      cooldown: 60,
    },
    {
      name: 'communityStanding',
      condition: (m: MetricsSummary) => m.valueMetrics.communityImpact < 0.7,
      message: (m: MetricsSummary) =>
        `Community standing needs attention: ${(m.valueMetrics.communityImpact * 100).toFixed(1)}%`,
      severity: 'warning',
      cooldown: 120,
    },
    {
      name: 'highReportRate',
      condition: (m: MetricsSummary) => m.engagement.reports > m.engagement.upvotes * 0.1,
      message: () => `High report to upvote ratio`,
      severity: 'error',
      cooldown: 15,
    },
    {
      name: 'rateLimitApproaching',
      condition: (m: MetricsSummary) => m.api.rateLimit.remaining < m.api.rateLimit.total * 0.2,
      message: (m: MetricsSummary) =>
        `API rate limit approaching: ${m.api.rateLimit.remaining} remaining`,
      severity: 'warning',
      cooldown: 5,
    },
    {
      name: 'lowConversion',
      condition: (m: MetricsSummary) => m.conversions.rate < 0.01 && m.responses.total > 10,
      message: (m: MetricsSummary) =>
        `Low conversion rate: ${(m.conversions.rate * 100).toFixed(1)}%`,
      severity: 'info',
      cooldown: 240,
    },
  ];

  private constructor() {
    this.startMonitoring();
  }

  public static getInstance(): AlertManager {
    if (!AlertManager.instance) {
      AlertManager.instance = new AlertManager();
    }
    return AlertManager.instance;
  }

  private async startMonitoring(): Promise<void> {
    setInterval(async () => {
      const metrics = await MetricsCollector.getInstance().getMetricsSummary();
      await this.checkAlerts(metrics);
    }, 60000); // Check every minute
  }

  private async checkAlerts(metrics: MetricsSummary): Promise<void> {
    const now = Date.now();

    for (const config of this.alertConfigs) {
      const state = this.alertStates.get(config.name) || { isActive: false };
      const shouldTrigger = config.condition(metrics);

      if (shouldTrigger && !state.isActive) {
        // New alert
        if (!state.lastTriggered || now - state.lastTriggered > config.cooldown * 60000) {
          await this.triggerAlert(config, metrics);
          this.alertStates.set(config.name, {
            lastTriggered: now,
            isActive: true,
          });
        }
      } else if (!shouldTrigger && state.isActive) {
        // Alert resolved
        await this.resolveAlert(config);
        this.alertStates.set(config.name, {
          lastTriggered: state.lastTriggered,
          isActive: false,
        });
      }
    }
  }

  private async triggerAlert(config: AlertConfig, metrics: MetricsSummary): Promise<void> {
    const message = config.message(metrics);

    // Log alert based on severity
    switch (config.severity) {
      case 'error':
        logger.error(message);
        await this.sendUrgentNotification(message);
        break;
      case 'warning':
        logger.warn(message);
        await this.sendWarningNotification(message);
        break;
      case 'info':
        logger.info(message);
        await this.logNotification(message);
        break;
    }
  }

  private async resolveAlert(config: AlertConfig): Promise<void> {
    logger.info(`Alert resolved: ${config.name}`);
    // Could notify about resolution if needed
  }

  private async sendUrgentNotification(message: string): Promise<void> {
    // Integration point for urgent notifications (e.g., SMS, phone call)
    logger.error('URGENT:', message);
  }

  private async sendWarningNotification(message: string): Promise<void> {
    // Integration point for warning notifications (e.g., email, Slack)
    logger.warn('WARNING:', message);
  }

  private async logNotification(message: string): Promise<void> {
    // Integration point for info notifications (e.g., logging system)
    logger.info('INFO:', message);
  }

  // Public API for manual alert checks
  public async checkMetrics(): Promise<void> {
    const metrics = await MetricsCollector.getInstance().getMetricsSummary();
    await this.checkAlerts(metrics);
  }
}
