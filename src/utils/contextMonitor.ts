import * as fs from 'fs';
import * as path from 'path';
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

export class ContextMonitor extends EventEmitter {
  private metrics: MonitoringMetrics = {
    contextSize: 0,
    memoryUsage: 0,
    responseLatency: 0,
    contextContinuity: 1,
  };

  private metricsLog: { timestamp: string; metric: string; value: number }[] = [];
  private readonly LOG_FILE: string;
  private readonly METRICS_FILE: string;
  private config: MonitoringConfig;
  private logStream: fs.WriteStream | null = null;
  private checkInterval: NodeJS.Timeout | null = null;
  private lastCheck: number = Date.now();
  private readonly CHECK_INTERVAL = 5000; // 5 seconds

  constructor(config: MonitoringConfig) {
    super();
    this.config = config;
    this.LOG_FILE = path.join('.cascade', 'logs', 'context.log');
    this.METRICS_FILE = path.join('.cascade', 'metrics.json');
    this.initializeLogging();
    this.initialize();
  }

  private initializeLogging(): void {
    if (this.config.logging.enabled) {
      const logDir = path.dirname(this.config.logging.file);
      fs.mkdirSync(logDir, { recursive: true });
      this.logStream = fs.createWriteStream(this.config.logging.file, { flags: 'a' });

      this.logStream.on('error', (err) => {
        console.error('Error writing to log file:', err);
      });
    }
  }

  private async initialize() {
    try {
      // Ensure log directory exists
      await fs.promises.mkdir(path.join('.cascade', 'logs'), { recursive: true });

      // Start periodic checks
      this.checkInterval = setInterval(() => this.checkContextContinuity(), this.CHECK_INTERVAL);

      this.log('info', 'Context monitor initialized');
    } catch (error) {
      console.error('Failed to initialize context monitor:', error);
    }
  }

  private async checkContextContinuity() {
    const now = Date.now();
    const timeSinceLastCheck = now - this.lastCheck;

    // Check for unusual gaps in monitoring
    if (timeSinceLastCheck > this.CHECK_INTERVAL * 2) {
      this.emit('contextLoss', {
        reason: 'monitoring_gap',
        duration: timeSinceLastCheck,
      });
    }

    // Update metrics
    await this.updateMetric('contextContinuity', 1.0);
    this.lastCheck = now;

    // Check for context loss
    if (this.metrics.contextContinuity < this.config.alerts.contextLoss.threshold) {
      this.log(
        'warning',
        `Context continuity degraded: ${this.metrics.contextContinuity.toFixed(2)}`
      );
      this.emit('contextLoss', {
        continuity: this.metrics.contextContinuity,
        timestamp: now,
      });
    }

    // Update metrics
    this.metrics.memoryUsage = process.memoryUsage().heapUsed / 1024 / 1024;

    // Performance degradation check
    if (this.metrics.memoryUsage > this.config.alerts.performanceDegradation.threshold) {
      this.log('warning', `High memory usage detected: ${this.metrics.memoryUsage.toFixed(2)}MB`);
      this.emit('performanceDegradation', {
        memoryUsage: this.metrics.memoryUsage,
        timestamp: now,
      });
    }
  }

  public async updateMetric(name: string, value: number) {
    const metric = {
      timestamp: new Date().toISOString(),
      metric: name,
      value,
    };

    this.metricsLog.push(metric);

    try {
      await fs.promises.writeFile(this.METRICS_FILE, JSON.stringify(this.metricsLog, null, 2));
    } catch (error) {
      console.error('Failed to write metrics:', error);
    }

    if (name === 'contextContinuity') {
      this.metrics.contextContinuity = value;
    }
  }

  public log(level: 'debug' | 'info' | 'warn' | 'error', message: string) {
    const logEntry = `${new Date().toISOString()} [${level.toUpperCase()}] ${message}\n`;

    fs.appendFile(this.LOG_FILE, logEntry, (error) => {
      if (error) {
        console.error('Failed to write to log file:', error);
      }
    });

    // Emit events for important log levels
    if (level === 'warn' || level === 'error') {
      this.emit('contextAlert', { level, message });
    }

    if (this.logStream) {
      this.logStream.write(logEntry);
    }
  }

  public getMetrics(): { timestamp: string; metric: string; value: number }[] {
    return [...this.metricsLog];
  }

  public dispose() {
    clearInterval(this.checkInterval);
    if (this.logStream) {
      this.logStream.end();
    }
    this.log('info', 'Context monitor disposed');
  }
}
