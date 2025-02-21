import { ResourceMonitor } from '../../services/monitoring/resourceMonitor';
import { CorrelationAnalyzer } from '../../services/analysis/correlationAnalyzer';
import { MetricsCollector } from '../../services/monitoring/metrics';
import { AdaptiveThresholdManager } from '../../services/monitoring/adaptiveThresholds';

describe('Monitoring System Stress Tests', () => {
  let monitor: ResourceMonitor;
  let analyzer: CorrelationAnalyzer;
  let metrics: MetricsCollector;
  let thresholds: AdaptiveThresholdManager;

  beforeAll(() => {
    monitor = ResourceMonitor.getInstance();
    analyzer = CorrelationAnalyzer.getInstance();
    metrics = MetricsCollector.getInstance();
    thresholds = AdaptiveThresholdManager.getInstance();
  });

  afterAll(() => {
    monitor.stopMonitoring();
  });

  describe('High Load Tests', () => {
    it('should handle sustained high CPU load', async () => {
      const alerts: any[] = [];
      monitor.on('alert', (alert) => alerts.push(alert));

      // Generate CPU load
      const startTime = Date.now();
      while (Date.now() - startTime < 30000) {
        Math.random(); // Keep CPU busy
      }

      expect(alerts.some((a) => a.type === 'cpu_usage')).toBeTruthy();
    }, 35000);

    it('should handle memory pressure', async () => {
      const alerts: any[] = [];
      monitor.on('alert', (alert) => alerts.push(alert));

      // Generate memory pressure
      const arrays: number[][] = [];
      for (let i = 0; i < 1000; i++) {
        arrays.push(new Array(10000).fill(Math.random()));
        await new Promise((resolve) => setTimeout(resolve, 10));
      }

      expect(alerts.some((a) => a.type === 'memory_usage')).toBeTruthy();
    }, 15000);

    it('should handle high API request rate', async () => {
      const alerts: any[] = [];
      monitor.on('alert', (alert) => alerts.push(alert));

      // Simulate high API request rate
      const promises = Array(1000)
        .fill(0)
        .map(() =>
          metrics.recordApiMetrics('reddit', {
            requests: 1,
            errors: 0,
            latency: 100,
          })
        );

      await Promise.all(promises);
      expect(alerts.some((a) => a.type === 'api_rate_limit')).toBeTruthy();
    }, 10000);
  });

  describe('Network Resilience Tests', () => {
    it('should handle network timeouts', async () => {
      const alerts: any[] = [];
      monitor.on('alert', (alert) => alerts.push(alert));

      // Mock network timeouts
      jest
        .spyOn(global, 'fetch')
        .mockImplementation(() => new Promise((resolve) => setTimeout(resolve, 5000)));

      await monitor.startMonitoring(1000);
      await new Promise((resolve) => setTimeout(resolve, 2000));

      expect(
        alerts.some((a) => a.type === 'network_latency' && a.severity === 'warning')
      ).toBeTruthy();
    }, 10000);

    it('should handle connection failures', async () => {
      const alerts: any[] = [];
      monitor.on('alert', (alert) => alerts.push(alert));

      // Mock connection failures
      jest.spyOn(global, 'fetch').mockRejectedValue(new Error('Connection failed'));

      await monitor.startMonitoring(1000);
      await new Promise((resolve) => setTimeout(resolve, 2000));

      expect(
        alerts.some((a) => a.type === 'network_error' && a.severity === 'critical')
      ).toBeTruthy();
    }, 10000);
  });

  describe('Correlation Analysis Under Load', () => {
    it('should detect correlations during high load', async () => {
      const correlations: any[] = [];
      analyzer.on('correlation_detected', (correlation) => correlations.push(correlation));

      // Generate correlated metrics
      const startTime = Date.now();
      while (Date.now() - startTime < 10000) {
        const value = Math.sin(Date.now() / 1000);
        metrics.recordResourceMetric('cpu_usage', 50 + value * 25);
        metrics.recordResourceMetric('memory_usage', 60 + value * 20);
        await new Promise((resolve) => setTimeout(resolve, 100));
      }

      expect(correlations.length).toBeGreaterThan(0);
      expect(correlations[0].confidence).toBeGreaterThan(0.7);
    }, 15000);

    it('should generate insights during system stress', async () => {
      const insights: any[] = [];
      analyzer.on('actionable_insight', (insight) => insights.push(insight));

      // Generate system stress
      const promises = Array(100)
        .fill(0)
        .map(async (_, i) => {
          metrics.recordResourceMetric('cpu_usage', 80 + Math.random() * 15);
          metrics.recordResourceMetric('memory_usage', 75 + Math.random() * 20);
          metrics.recordApiMetrics('reddit', {
            requests: 10,
            errors: i % 10 === 0 ? 1 : 0,
            latency: 200 + Math.random() * 300,
          });
          await new Promise((resolve) => setTimeout(resolve, 50));
        });

      await Promise.all(promises);
      await new Promise((resolve) => setTimeout(resolve, 2000));

      expect(insights.length).toBeGreaterThan(0);
      expect(insights.some((i) => i.priority === 'high')).toBeTruthy();
    }, 10000);
  });

  describe('Adaptive Threshold Behavior', () => {
    it('should adapt thresholds under varying load', async () => {
      const adaptations: any[] = [];
      thresholds.on('threshold_adapted', (adaptation) => adaptations.push(adaptation));

      // Generate varying load pattern
      for (let i = 0; i < 100; i++) {
        const baseLoad = Math.floor(i / 20) * 20; // Steps of 20%
        metrics.recordResourceMetric('cpu_usage', baseLoad + Math.random() * 10);
        await new Promise((resolve) => setTimeout(resolve, 50));
      }

      expect(adaptations.length).toBeGreaterThan(0);
      expect(adaptations[adaptations.length - 1].confidence).toBeGreaterThan(0.6);
    }, 10000);
  });

  describe('Temporal Pattern Analysis', () => {
    it('should detect daily patterns under load', async () => {
      const patterns: any[] = [];
      analyzer.on('temporal_pattern_detected', (pattern) => patterns.push(pattern));

      // Generate daily pattern with noise
      const hours = 24 * 7; // One week of data
      for (let hour = 0; hour < hours; hour++) {
        const baseValue = Math.sin((hour * Math.PI) / 12) * 20 + 50; // Daily sine wave
        const noise = Math.random() * 5;
        metrics.recordResourceMetric('cpu_usage', baseValue + noise);
        await new Promise((resolve) => setTimeout(resolve, 10));
      }

      expect(patterns.length).toBeGreaterThan(0);
      expect(
        patterns[0].patterns.some((p: any) => p.type === 'daily' && p.confidence > 0.7)
      ).toBeTruthy();
    }, 15000);

    it('should detect weekly patterns under load', async () => {
      const patterns: any[] = [];
      analyzer.on('temporal_pattern_detected', (pattern) => patterns.push(pattern));

      // Generate weekly pattern with noise
      const hours = 24 * 30; // One month of data
      for (let hour = 0; hour < hours; hour++) {
        const baseValue = Math.sin((hour * Math.PI) / 84) * 30 + 60; // Weekly sine wave
        const noise = Math.random() * 10;
        metrics.recordResourceMetric('memory_usage', baseValue + noise);
        await new Promise((resolve) => setTimeout(resolve, 10));
      }

      expect(patterns.length).toBeGreaterThan(0);
      expect(
        patterns[0].patterns.some((p: any) => p.type === 'weekly' && p.confidence > 0.6)
      ).toBeTruthy();
    }, 20000);
  });

  describe('Multi-Source Analysis', () => {
    it('should detect correlations between sources under load', async () => {
      const correlations: any[] = [];
      analyzer.on('multi_source_correlation_detected', (correlation) =>
        correlations.push(correlation)
      );

      // Generate correlated data for different sources
      const dataPoints = 100;
      for (let i = 0; i < dataPoints; i++) {
        const baseValue = Math.sin((i * Math.PI) / 50) * 40 + 50;

        // Reddit data follows base pattern
        metrics.recordSourceMetric('reddit', baseValue + Math.random() * 5);

        // Twitter data follows with lag
        if (i > 10) {
          metrics.recordSourceMetric('twitter', baseValue * 0.8 + Math.random() * 5);
        }

        // News data inversely correlated
        metrics.recordSourceMetric('news', 100 - baseValue + Math.random() * 5);

        await new Promise((resolve) => setTimeout(resolve, 10));
      }

      expect(correlations.length).toBeGreaterThan(0);
      expect(correlations[0].correlation.confidence).toBeGreaterThan(0.6);
    }, 15000);

    it('should handle source data gaps', async () => {
      const correlations: any[] = [];
      analyzer.on('multi_source_correlation_detected', (correlation) =>
        correlations.push(correlation)
      );

      // Generate data with gaps
      const dataPoints = 100;
      for (let i = 0; i < dataPoints; i++) {
        const baseValue = Math.sin((i * Math.PI) / 50) * 40 + 50;

        // Reddit data has gaps
        if (i % 3 !== 0) {
          metrics.recordSourceMetric('reddit', baseValue + Math.random() * 5);
        }

        // Twitter data complete
        metrics.recordSourceMetric('twitter', baseValue * 0.8 + Math.random() * 5);

        await new Promise((resolve) => setTimeout(resolve, 10));
      }

      expect(correlations.length).toBeGreaterThan(0);
      // Expect lower confidence due to gaps
      expect(correlations[0].correlation.confidence).toBeLessThan(0.8);
    }, 15000);
  });

  describe('System Recovery Under Pattern Analysis', () => {
    it('should maintain pattern detection during resource pressure', async () => {
      const patterns: any[] = [];
      analyzer.on('temporal_pattern_detected', (pattern) => patterns.push(pattern));

      // Generate patterns while creating memory pressure
      const arrays: number[][] = [];
      const hours = 24 * 3; // Three days of data

      for (let hour = 0; hour < hours; hour++) {
        // Create memory pressure
        arrays.push(new Array(1000).fill(Math.random()));

        // Generate pattern data
        const baseValue = Math.sin((hour * Math.PI) / 12) * 20 + 50;
        metrics.recordResourceMetric('cpu_usage', baseValue + Math.random() * 5);

        await new Promise((resolve) => setTimeout(resolve, 50));
      }

      // Clear memory pressure
      arrays.length = 0;
      global.gc && global.gc();

      expect(patterns.length).toBeGreaterThan(0);
      expect(patterns[0].patterns[0].confidence).toBeGreaterThan(0.6);
    }, 20000);
  });

  describe('System Recovery', () => {
    it('should recover from resource exhaustion', async () => {
      const alerts: any[] = [];
      monitor.on('alert', (alert) => alerts.push(alert));

      // Exhaust resources
      const arrays: number[][] = [];
      for (let i = 0; i < 500; i++) {
        arrays.push(new Array(10000).fill(Math.random()));
      }

      // Allow system to recover
      arrays.length = 0;
      global.gc && global.gc();
      await new Promise((resolve) => setTimeout(resolve, 5000));

      const recentAlerts = alerts.slice(-3);
      expect(
        recentAlerts.some((a) => a.type === 'memory_usage' && a.severity === 'normal')
      ).toBeTruthy();
    }, 20000);
  });
});
