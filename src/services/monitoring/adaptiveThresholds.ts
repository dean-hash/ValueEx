import { logger } from '../../utils/logger';

interface MetricWindow {
  values: number[];
  timestamp: number[];
  maxSize: number;
}

interface ThresholdConfig {
  baselineWindow: number; // minutes
  sensitivity: number; // multiplier for standard deviation
  minThreshold: number;
  maxThreshold: number;
}

export class AdaptiveThresholdManager {
  private static instance: AdaptiveThresholdManager;
  private metricWindows: Map<string, MetricWindow> = new Map();
  private thresholdConfigs: Map<string, ThresholdConfig> = new Map();

  private constructor() {
    // Default configurations for different metric types
    this.thresholdConfigs.set('processing_time', {
      baselineWindow: 60, // 1 hour
      sensitivity: 2.5, // 2.5 standard deviations
      minThreshold: 500, // 500ms minimum
      maxThreshold: 5000, // 5s maximum
    });

    this.thresholdConfigs.set('error_rate', {
      baselineWindow: 30,
      sensitivity: 2.0,
      minThreshold: 0.01, // 1% minimum
      maxThreshold: 0.2, // 20% maximum
    });

    this.thresholdConfigs.set('response_time', {
      baselineWindow: 60,
      sensitivity: 2.5,
      minThreshold: 800, // 800ms minimum
      maxThreshold: 8000, // 8s maximum
    });
  }

  public static getInstance(): AdaptiveThresholdManager {
    if (!AdaptiveThresholdManager.instance) {
      AdaptiveThresholdManager.instance = new AdaptiveThresholdManager();
    }
    return AdaptiveThresholdManager.instance;
  }

  addMetricValue(metricName: string, value: number): void {
    try {
      const now = Date.now();
      const config = this.thresholdConfigs.get(metricName);

      if (!config) {
        logger.warn(`No threshold config found for metric: ${metricName}`);
        return;
      }

      let window = this.metricWindows.get(metricName);
      if (!window) {
        window = {
          values: [],
          timestamp: [],
          maxSize: Math.ceil((config.baselineWindow * 60 * 1000) / 10000), // Store points every 10 seconds
        };
        this.metricWindows.set(metricName, window);
      }

      // Add new value
      window.values.push(value);
      window.timestamp.push(now);

      // Remove old values
      const cutoff = now - config.baselineWindow * 60 * 1000;
      while (window.timestamp[0] < cutoff) {
        window.values.shift();
        window.timestamp.shift();
      }

      // Trim to max size if needed
      if (window.values.length > window.maxSize) {
        window.values.shift();
        window.timestamp.shift();
      }
    } catch (error) {
      logger.error('Error adding metric value:', error);
    }
  }

  calculateThreshold(metricName: string): number {
    try {
      const window = this.metricWindows.get(metricName);
      const config = this.thresholdConfigs.get(metricName);

      if (!window || !config || window.values.length < 10) {
        return config?.maxThreshold || Number.MAX_VALUE;
      }

      // Calculate mean and standard deviation
      const mean = window.values.reduce((a, b) => a + b) / window.values.length;
      const variance =
        window.values.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / window.values.length;
      const stdDev = Math.sqrt(variance);

      // Calculate adaptive threshold
      const threshold = mean + stdDev * config.sensitivity;

      // Clamp to configured limits
      return Math.max(config.minThreshold, Math.min(config.maxThreshold, threshold));
    } catch (error) {
      logger.error('Error calculating threshold:', error);
      return Number.MAX_VALUE;
    }
  }

  getMetricTrend(metricName: string): 'increasing' | 'decreasing' | 'stable' {
    try {
      const window = this.metricWindows.get(metricName);
      if (!window || window.values.length < 10) return 'stable';

      const recentValues = window.values.slice(-10);
      const firstHalf = recentValues.slice(0, 5);
      const secondHalf = recentValues.slice(-5);

      const firstMean = firstHalf.reduce((a, b) => a + b) / 5;
      const secondMean = secondHalf.reduce((a, b) => a + b) / 5;

      const changePct = (secondMean - firstMean) / firstMean;

      if (changePct > 0.1) return 'increasing';
      if (changePct < -0.1) return 'decreasing';
      return 'stable';
    } catch (error) {
      logger.error('Error calculating metric trend:', error);
      return 'stable';
    }
  }

  setThresholdConfig(metricName: string, config: Partial<ThresholdConfig>): void {
    try {
      const existingConfig = this.thresholdConfigs.get(metricName) || {
        baselineWindow: 60,
        sensitivity: 2.0,
        minThreshold: 0,
        maxThreshold: Number.MAX_VALUE,
      };

      this.thresholdConfigs.set(metricName, {
        ...existingConfig,
        ...config,
      });
    } catch (error) {
      logger.error('Error setting threshold config:', error);
    }
  }

  clearMetricHistory(metricName: string): void {
    this.metricWindows.delete(metricName);
  }
}
