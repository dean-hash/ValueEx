import { EventEmitter } from 'events';
import { logger } from '../../utils/logger';
import * as os from 'os';
import * as fs from 'fs';
import * as net from 'net';
import { MetricsCollector } from './metrics';

interface ResourceSnapshot {
  timestamp: number;
  cpu: number;
  memory: {
    used: number;
    total: number;
    percentage: number;
  };
  disk: {
    used: number;
    total: number;
    percentage: number;
  };
  network: {
    latency: Map<string, number>;
    bandwidth: {
      in: number;
      out: number;
    };
    connections: number;
  };
  apiRequests: Map<string, {
    count: number;
    errors: number;
    latency: number[];
  }>;
}

interface MemoryLeak {
  timestamp: number;
  allocation: number;
  source: string;
  stackTrace: string;
}

export class ResourceMonitor extends EventEmitter {
  private static instance: ResourceMonitor;
  private metrics: MetricsCollector;
  private snapshots: ResourceSnapshot[] = [];
  private memoryLeaks: MemoryLeak[] = [];
  private apiRateLimits: Map<string, { limit: number; window: number }> = new Map();
  private readonly MAX_SNAPSHOTS = 1000;
  private monitoringInterval: NodeJS.Timer | null = null;

  private constructor() {
    super();
    this.metrics = MetricsCollector.getInstance();
    this.setupApiRateLimits();
  }

  public static getInstance(): ResourceMonitor {
    if (!ResourceMonitor.instance) {
      ResourceMonitor.instance = new ResourceMonitor();
    }
    return ResourceMonitor.instance;
  }

  private setupApiRateLimits() {
    this.apiRateLimits.set('reddit', { limit: 100, window: 60 }); // 100 requests per minute
    this.apiRateLimits.set('twitter', { limit: 180, window: 900 }); // 180 requests per 15 minutes
    this.apiRateLimits.set('openai', { limit: 3500, window: 60 }); // 3500 requests per minute
  }

  startMonitoring(interval: number = 5000): void {
    if (this.monitoringInterval) {
      return;
    }

    this.monitoringInterval = setInterval(async () => {
      try {
        const snapshot = await this.captureSnapshot();
        this.analyzeSnapshot(snapshot);
        this.snapshots.push(snapshot);

        // Maintain snapshot window
        if (this.snapshots.length > this.MAX_SNAPSHOTS) {
          this.snapshots.shift();
        }

        // Check for memory leaks
        this.checkMemoryLeaks();

        // Update metrics
        this.updateMetrics(snapshot);
      } catch (error) {
        logger.error('Error in resource monitoring:', error);
      }
    }, interval);
  }

  stopMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
  }

  private async captureSnapshot(): Promise<ResourceSnapshot> {
    const cpus = os.cpus();
    const totalCpu = cpus.reduce((acc, cpu) => {
      return acc + (cpu.times.user + cpu.times.nice + cpu.times.sys + cpu.times.irq);
    }, 0);

    const memoryUsage = process.memoryUsage();
    const diskSpace = await this.getDiskSpace();
    const networkStats = await this.getNetworkStats();

    return {
      timestamp: Date.now(),
      cpu: (totalCpu / (cpus.length * 100)) * 100,
      memory: {
        used: memoryUsage.heapUsed,
        total: memoryUsage.heapTotal,
        percentage: (memoryUsage.heapUsed / memoryUsage.heapTotal) * 100
      },
      disk: diskSpace,
      network: networkStats,
      apiRequests: new Map(Array.from(this.apiRateLimits.keys()).map(api => [
        api,
        { count: 0, errors: 0, latency: [] }
      ]))
    };
  }

  private async getDiskSpace(): Promise<{ used: number; total: number; percentage: number }> {
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
          used,
          percentage: (used / total) * 100
        });
      });
    });
  }

  private async getNetworkStats(): Promise<ResourceSnapshot['network']> {
    const endpoints = [
      { host: 'api.reddit.com', port: 443 },
      { host: 'api.twitter.com', port: 443 },
      { host: 'api.openai.com', port: 443 }
    ];

    const latencyMap = new Map<string, number>();
    
    for (const endpoint of endpoints) {
      try {
        const startTime = process.hrtime();
        const socket = new net.Socket();
        
        await new Promise<void>((resolve, reject) => {
          socket.connect(endpoint.port, endpoint.host, () => {
            const [seconds, nanoseconds] = process.hrtime(startTime);
            const latency = seconds * 1000 + nanoseconds / 1000000;
            latencyMap.set(endpoint.host, latency);
            socket.destroy();
            resolve();
          });

          socket.on('error', reject);
        });
      } catch (error) {
        logger.error(`Failed to measure latency for ${endpoint.host}:`, error);
        latencyMap.set(endpoint.host, -1);
      }
    }

    // Get active connections count
    const connections = await new Promise<number>((resolve) => {
      const server = net.createServer();
      server.getConnections((err, count) => {
        server.close();
        resolve(err ? 0 : count);
      });
    });

    // Estimate bandwidth (simplified)
    const bandwidth = {
      in: Math.random() * 1000000,  // Replace with actual bandwidth monitoring
      out: Math.random() * 1000000
    };

    return {
      latency: latencyMap,
      bandwidth,
      connections
    };
  }

  private analyzeSnapshot(snapshot: ResourceSnapshot): void {
    // Check CPU usage
    if (snapshot.cpu > 80) {
      this.emit('alert', {
        type: 'cpu_usage',
        severity: 'warning',
        message: `High CPU usage: ${snapshot.cpu.toFixed(2)}%`
      });
    }

    // Check memory usage
    if (snapshot.memory.percentage > 85) {
      this.emit('alert', {
        type: 'memory_usage',
        severity: 'critical',
        message: `Critical memory usage: ${snapshot.memory.percentage.toFixed(2)}%`
      });
    }

    // Check disk usage
    if (snapshot.disk.percentage > 90) {
      this.emit('alert', {
        type: 'disk_usage',
        severity: 'critical',
        message: `Critical disk usage: ${snapshot.disk.percentage.toFixed(2)}%`
      });
    }

    // Analyze API request patterns
    snapshot.apiRequests.forEach((data, api) => {
      const limit = this.apiRateLimits.get(api);
      if (limit && data.count > limit.limit * 0.8) {
        this.emit('alert', {
          type: 'api_rate_limit',
          severity: 'warning',
          message: `Approaching rate limit for ${api}: ${data.count}/${limit.limit} requests`
        });
      }
    });

    // Analyze network latency
    snapshot.network.latency.forEach((latency, host) => {
      if (latency > 500) {
        this.emit('alert', {
          type: 'network_latency',
          severity: 'warning',
          message: `High network latency for ${host}: ${latency.toFixed(2)}ms`
        });
      }
    });
  }

  private checkMemoryLeaks(): void {
    const currentUsage = process.memoryUsage();
    const previousSnapshots = this.snapshots.slice(-10);

    if (previousSnapshots.length < 10) {
      return;
    }

    const memoryTrend = previousSnapshots.map(s => s.memory.used);
    const isIncreasing = memoryTrend.every((val, i) => 
      i === 0 || val > memoryTrend[i - 1]
    );

    if (isIncreasing && currentUsage.heapUsed > currentUsage.heapTotal * 0.8) {
      const leak: MemoryLeak = {
        timestamp: Date.now(),
        allocation: currentUsage.heapUsed,
        source: 'heap',
        stackTrace: new Error().stack || ''
      };

      this.memoryLeaks.push(leak);
      this.emit('alert', {
        type: 'memory_leak',
        severity: 'critical',
        message: 'Potential memory leak detected',
        data: leak
      });
    }
  }

  private updateMetrics(snapshot: ResourceSnapshot): void {
    this.metrics.recordResourceMetric('cpu_usage', snapshot.cpu);
    this.metrics.recordResourceMetric('memory_usage', snapshot.memory.percentage);
    this.metrics.recordResourceMetric('disk_usage', snapshot.disk.percentage);

    snapshot.apiRequests.forEach((data, api) => {
      this.metrics.recordApiMetrics(api, {
        requests: data.count,
        errors: data.errors,
        latency: data.latency.reduce((a, b) => a + b, 0) / data.latency.length
      });
    });

    snapshot.network.latency.forEach((latency, host) => {
      this.metrics.recordNetworkMetric(host, latency);
    });
  }

  getResourceHistory(minutes: number = 60): ResourceSnapshot[] {
    const cutoff = Date.now() - (minutes * 60 * 1000);
    return this.snapshots.filter(s => s.timestamp >= cutoff);
  }

  getMemoryLeaks(): MemoryLeak[] {
    return [...this.memoryLeaks];
  }

  clearHistory(): void {
    this.snapshots = [];
    this.memoryLeaks = [];
  }
}
