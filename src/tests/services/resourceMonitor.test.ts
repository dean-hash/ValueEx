import { ResourceMonitor } from '../../services/monitoring/resourceMonitor';
import { MetricsCollector } from '../../services/monitoring/metrics';
import { testLogger } from '../setup/testConfig';

jest.mock('os');
jest.mock('fs');

describe('ResourceMonitor Tests', () => {
  let monitor: ResourceMonitor;
  let alertCallback: jest.Mock;

  beforeEach(() => {
    monitor = ResourceMonitor.getInstance();
    alertCallback = jest.fn();
    monitor.on('alert', alertCallback);
  });

  afterEach(() => {
    monitor.stopMonitoring();
    monitor.clearHistory();
    monitor.removeAllListeners();
  });

  describe('Resource Monitoring', () => {
    it('should detect high CPU usage', async () => {
      // Mock high CPU usage
      require('os').cpus.mockReturnValue([
        { times: { user: 90, nice: 0, sys: 5, idle: 5, irq: 0 } }
      ]);

      monitor.startMonitoring(100);
      await new Promise(resolve => setTimeout(resolve, 150));

      expect(alertCallback).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'cpu_usage',
          severity: 'warning'
        })
      );
    });

    it('should detect memory issues', async () => {
      // Mock high memory usage
      const originalMemoryUsage = process.memoryUsage;
      process.memoryUsage = jest.fn().mockReturnValue({
        heapTotal: 1000,
        heapUsed: 900,
        external: 0,
        arrayBuffers: 0
      });

      monitor.startMonitoring(100);
      await new Promise(resolve => setTimeout(resolve, 150));

      expect(alertCallback).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'memory_usage',
          severity: 'critical'
        })
      );

      process.memoryUsage = originalMemoryUsage;
    });

    it('should detect disk space issues', async () => {
      // Mock low disk space
      require('fs').statfs.mockImplementation((path, callback) => {
        callback(null, {
          blocks: 1000,
          bfree: 50,
          bsize: 1024
        });
      });

      monitor.startMonitoring(100);
      await new Promise(resolve => setTimeout(resolve, 150));

      expect(alertCallback).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'disk_usage',
          severity: 'critical'
        })
      );
    });
  });

  describe('API Rate Limiting', () => {
    it('should detect approaching rate limits', async () => {
      const snapshot = await (monitor as any).captureSnapshot();
      snapshot.apiRequests.set('reddit', {
        count: 90,
        errors: 0,
        latency: [100, 150, 200]
      });

      (monitor as any).analyzeSnapshot(snapshot);

      expect(alertCallback).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'api_rate_limit',
          severity: 'warning'
        })
      );
    });

    it('should track API latency', async () => {
      const metrics = MetricsCollector.getInstance();
      const recordApiMetrics = jest.spyOn(metrics, 'recordApiMetrics');

      const snapshot = await (monitor as any).captureSnapshot();
      snapshot.apiRequests.set('openai', {
        count: 10,
        errors: 1,
        latency: [300, 400, 500]
      });

      (monitor as any).updateMetrics(snapshot);

      expect(recordApiMetrics).toHaveBeenCalledWith('openai', {
        requests: 10,
        errors: 1,
        latency: 400
      });
    });
  });

  describe('Memory Leak Detection', () => {
    it('should detect potential memory leaks', async () => {
      // Mock increasing memory usage
      const snapshots = Array(10).fill(null).map((_, i) => ({
        timestamp: Date.now() - (i * 1000),
        memory: {
          used: 1000 + (i * 100),
          total: 2000,
          percentage: 50 + (i * 5)
        },
        cpu: 50,
        disk: { used: 1000, total: 2000, percentage: 50 },
        apiRequests: new Map()
      }));

      (monitor as any).snapshots = snapshots;
      (monitor as any).checkMemoryLeaks();

      expect(alertCallback).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'memory_leak',
          severity: 'critical'
        })
      );
    });

    it('should maintain memory leak history', () => {
      const leak = {
        timestamp: Date.now(),
        allocation: 1000,
        source: 'heap',
        stackTrace: 'test stack'
      };

      (monitor as any).memoryLeaks = [leak];
      const leaks = monitor.getMemoryLeaks();

      expect(leaks).toHaveLength(1);
      expect(leaks[0]).toEqual(leak);
    });
  });

  describe('Edge Cases', () => {
    it('should handle invalid disk stats', async () => {
      require('fs').statfs.mockImplementation((path, callback) => {
        callback(new Error('Disk error'));
      });

      monitor.startMonitoring(100);
      await new Promise(resolve => setTimeout(resolve, 150));

      expect(alertCallback).not.toHaveBeenCalled();
    });

    it('should handle missing CPU info', async () => {
      require('os').cpus.mockReturnValue([]);

      monitor.startMonitoring(100);
      await new Promise(resolve => setTimeout(resolve, 150));

      expect(alertCallback).not.toHaveBeenCalled();
    });
  });

  describe('Resource History', () => {
    it('should maintain snapshot history', async () => {
      const snapshots = Array(1100).fill(null).map((_, i) => ({
        timestamp: Date.now() - (i * 1000),
        memory: { used: 1000, total: 2000, percentage: 50 },
        cpu: 50,
        disk: { used: 1000, total: 2000, percentage: 50 },
        apiRequests: new Map()
      }));

      (monitor as any).snapshots = snapshots;
      expect(monitor.getResourceHistory(30)).toHaveLength(
        Math.min(1000, Math.ceil(30 * 60))
      );
    });

    it('should clear history on demand', () => {
      (monitor as any).snapshots = [{}, {}, {}];
      (monitor as any).memoryLeaks = [{}, {}];

      monitor.clearHistory();

      expect((monitor as any).snapshots).toHaveLength(0);
      expect((monitor as any).memoryLeaks).toHaveLength(0);
    });
  });
});
