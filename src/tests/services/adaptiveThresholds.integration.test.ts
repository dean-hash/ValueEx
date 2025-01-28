import { AdaptiveThresholdManager } from '../../services/monitoring/adaptiveThresholds';
import { MetricsCollector } from '../../services/monitoring/metrics';
import { DemandSignalScraper } from '../../services/demandSignalScraper';

describe('Adaptive Thresholds Integration Tests', () => {
  let thresholds: AdaptiveThresholdManager;
  let metrics: MetricsCollector;
  let scraper: DemandSignalScraper;

  beforeEach(() => {
    thresholds = AdaptiveThresholdManager.getInstance();
    metrics = MetricsCollector.getInstance();
    scraper = DemandSignalScraper.getInstance();
  });

  describe('Data Source Downtime', () => {
    it('should adapt thresholds during source failures', async (): Promise<void> => {
      // Mock source failure
      jest
        .spyOn(scraper as any, 'fetchFromPrimarySource')
        .mockRejectedValue(new Error('Source unavailable'));

      // Simulate multiple requests during downtime
      for (let i = 0; i < 20; i++) {
        try {
          await scraper.scrapeRedditDemand('test', 'demand');
        } catch (error) {
          // Expected
        }
      }

      // Check if thresholds adapted
      const errorThreshold = thresholds.calculateThreshold('error_rate');
      expect(errorThreshold).toBeGreaterThan(0.1); // Default threshold
    });

    it('should recover thresholds after source restoration', async (): Promise<void> => {
      // Simulate recovery
      jest.spyOn(scraper as any, 'fetchFromPrimarySource').mockResolvedValue([
        {
          /* mock data */
        },
      ]);

      // Process successful requests
      for (let i = 0; i < 20; i++) {
        await scraper.scrapeRedditDemand('test', 'demand');
      }

      // Check if thresholds normalized
      const errorThreshold = thresholds.calculateThreshold('error_rate');
      expect(errorThreshold).toBeLessThan(0.1);
    });
  });

  describe('Multi-Source Integration', () => {
    it('should maintain coherent thresholds across sources', async (): Promise<void> => {
      // Simulate data from multiple sources
      const sources = ['reddit', 'twitter', 'custom'];
      for (const source of sources) {
        for (let i = 0; i < 10; i++) {
          metrics.addMetricValue('processing_time', Math.random() * 1000);
        }
      }

      // Check threshold consistency
      const threshold = thresholds.calculateThreshold('processing_time');
      expect(threshold).toBeGreaterThan(0);
      expect(threshold).toBeLessThan(5000);
    });

    it('should detect correlated performance issues', async (): Promise<void> => {
      // Simulate coordinated slowdown
      const slowdown = 2000;

      for (let i = 0; i < 10; i++) {
        metrics.addMetricValue('processing_time', slowdown);
        metrics.addMetricValue('response_time', slowdown * 1.5);
      }

      const processingThreshold = thresholds.calculateThreshold('processing_time');
      const responseThreshold = thresholds.calculateThreshold('response_time');

      expect(processingThreshold).toBeGreaterThan(1500);
      expect(responseThreshold).toBeGreaterThan(2500);
    });
  });

  describe('Resource Utilization', () => {
    it('should handle high load scenarios', async (): Promise<void> => {
      // Simulate high CPU usage
      for (let i = 0; i < 50; i++) {
        metrics.addMetricValue('cpu_usage', 80 + Math.random() * 15);
      }

      const trend = thresholds.getMetricTrend('cpu_usage');
      expect(trend).toBe('increasing');
    });

    it('should adapt to memory pressure', async (): Promise<void> => {
      // Simulate increasing memory usage
      for (let i = 0; i < 20; i++) {
        metrics.addMetricValue('memory_usage', 60 + i);
      }

      const threshold = thresholds.calculateThreshold('memory_usage');
      expect(threshold).toBeGreaterThan(75);
    });
  });

  describe('Edge Cases', () => {
    it('should handle sparse data', async (): Promise<void> => {
      // Add sporadic measurements
      metrics.addMetricValue('api_rate', 100);
      await new Promise((resolve) => setTimeout(resolve, 100));
      metrics.addMetricValue('api_rate', 150);
      await new Promise((resolve) => setTimeout(resolve, 500));
      metrics.addMetricValue('api_rate', 200);

      const threshold = thresholds.calculateThreshold('api_rate');
      expect(threshold).toBeGreaterThan(0);
    });

    it('should handle rapid fluctuations', async (): Promise<void> => {
      // Simulate noisy data
      for (let i = 0; i < 30; i++) {
        metrics.addMetricValue('processing_time', Math.sin(i) * 500 + 1000 + Math.random() * 200);
      }

      const threshold = thresholds.calculateThreshold('processing_time');
      expect(threshold).toBeGreaterThan(800);
      expect(threshold).toBeLessThan(2000);
    });
  });

  describe('System Integration', () => {
    it('should correlate metrics under load', async (): Promise<void> => {
      // Simulate system under load
      const simulateLoad = async (): Promise<void> => {
        for (let i = 0; i < 10; i++) {
          const processingTime = 500 + i * 50;
          const memoryUsage = 60 + i * 2;
          const errorRate = i > 7 ? 0.15 : 0.05;

          metrics.addMetricValue('processing_time', processingTime);
          metrics.addMetricValue('memory_usage', memoryUsage);
          metrics.addMetricValue('error_rate', errorRate);

          await new Promise((resolve) => setTimeout(resolve, 100));
        }
      };

      await simulateLoad();

      // Check metric trends
      expect(thresholds.getMetricTrend('processing_time')).toBe('increasing');
      expect(thresholds.getMetricTrend('memory_usage')).toBe('increasing');
      expect(thresholds.getMetricTrend('error_rate')).toBe('increasing');
    });
  });
});
