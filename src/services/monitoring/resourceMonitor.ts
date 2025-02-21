import { EventEmitter } from 'events';
import { MetricsCollector } from './metrics';
import { logger } from '../../utils/logger';
import * as os from 'os';
import * as fs from 'fs';
import * as net from 'net';

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

export class ResourceMonitor extends EventEmitter {
  private static instance: ResourceMonitor;
  private metrics: MetricsCollector;
  private snapshots: ResourceSnapshot[] = [];
  private readonly MAX_SNAPSHOTS = 1000;
  private monitoringTimer?: NodeJS.Timeout;
  private readonly ALERT_THRESHOLDS = {
    cpu: 80, // 80% usage
    memory: 85, // 85% usage
    disk: 90, // 90% usage
    latency: 1000, // 1 second
  };

  private constructor(metricsCollector?: MetricsCollector) {
    super();
    this.metrics = metricsCollector || MetricsCollector.getInstance();
  }

  public static getInstance(): ResourceMonitor {
    if (!ResourceMonitor.instance) {
      ResourceMonitor.instance = new ResourceMonitor();
    }
    return ResourceMonitor.instance;
  }

  startMonitoring(interval: number = 5000): void {
    if (this.monitoringTimer) {
      return;
    }

    this.monitoringTimer = setInterval(async () => {
      try {
        const snapshot = await this.captureSnapshot();
        this.snapshots.push(snapshot);

        // Maintain snapshot window
        if (this.snapshots.length > this.MAX_SNAPSHOTS) {
          this.snapshots.shift();
        }

        // Update metrics
        this.updateMetrics(snapshot);
      } catch (error) {
        logger.error('Error in resource monitoring:', error);
      }
    }, interval);
  }

  stopMonitoring(): void {
    if (this.monitoringTimer) {
      clearInterval(this.monitoringTimer);
      this.monitoringTimer = undefined;
    }
  }

  private async captureSnapshot(): Promise<ResourceSnapshot> {
    try {
      const cpuUsage = process.cpuUsage();
      const memUsage = process.memoryUsage();

      const snapshot: ResourceSnapshot = {
        timestamp: Date.now(),
        cpu: {
          usage: (cpuUsage.user + cpuUsage.system) / 1000000, // Convert to seconds
          load: os.loadavg(),
        },
        memory: {
          total: os.totalmem(),
          free: os.freemem(),
          used: os.totalmem() - os.freemem(),
          heapUsed: memUsage.heapUsed,
          heapTotal: memUsage.heapTotal,
        },
        disk: await this.getDiskUsage(),
        network: await this.getNetworkMetrics(),
      };

      this.checkThresholds(snapshot);
      return snapshot;
    } catch (error) {
      logger.error('Error capturing resource snapshot:', error);
      throw error;
    }
  }

  private async getDiskUsage(): Promise<{ total: number; free: number; used: number }> {
    return new Promise((resolve, reject) => {
      fs.statfs('.', (err, stats) => {
        if (err) {
          reject(err);
          return;
        }

        const total = stats.blocks * stats.bsize;
        const free = stats.bfree * stats.bsize;
        const used = total - free;

        resolve({
          total,
          free,
          used,
        });
      });
    });
  }

  async getNetworkMetrics(): Promise<NetworkMetrics> {
    try {
      // Get network interface stats
      const networkInterfaces = os.networkInterfaces();
      let bytesIn = 0;
      let bytesOut = 0;

      // Sum up bytes across all interfaces
      Object.values(networkInterfaces).forEach((interfaces: any) => {
        interfaces.forEach((iface: any) => {
          if (!iface.internal) {
            bytesIn += iface.bytes?.received || 0;
            bytesOut += iface.bytes?.sent || 0;
          }
        });
      });

      // Measure latency with a simple ping
      const startTime = Date.now();
      await new Promise((resolve) => setTimeout(resolve, 100));
      const latency = Date.now() - startTime;

      return {
        latency,
        bytesIn,
        bytesOut,
      };
    } catch (error) {
      logger.error('Error getting network metrics:', error);
      return {
        latency: 0,
        bytesIn: 0,
        bytesOut: 0,
      };
    }
  }

  async getMemoryUsage(): Promise<MemoryUsage> {
    const memUsage = process.memoryUsage();
    const previousSnapshots = this.snapshots.slice(-10);

    let leakCount = 0;
    if (previousSnapshots.length >= 10) {
      const memoryTrend = previousSnapshots.map((s) => s.memory.used);
      const isIncreasing = memoryTrend.every((val, i) => i === 0 || val > memoryTrend[i - 1]);

      if (isIncreasing && memUsage.heapUsed > memUsage.heapTotal * 0.8) {
        leakCount++;
      }
    }

    return {
      used: memUsage.heapUsed,
      total: memUsage.heapTotal,
      free: memUsage.heapTotal - memUsage.heapUsed,
      leaks: leakCount,
    };
  }

  private updateMetrics(snapshot: ResourceSnapshot): void {
    this.metrics.recordApiMetrics('system', {
      requests: 1,
      errors: 0,
      latency: 0,
    });
  }

  async getResourceSnapshots(seconds: number): Promise<ResourceSnapshot[]> {
    const cutoff = Date.now() - seconds * 1000;
    return this.snapshots.filter((s) => s.timestamp >= cutoff);
  }

  clearHistory(): void {
    this.snapshots = [];
  }

  private checkThresholds(snapshot: ResourceSnapshot): void {
    // TO DO: implement threshold checking
  }
}
