import { MetricsCollector } from '../../services/monitoring/metrics';
import { DemandSignalScraper } from '../../services/demandSignalScraper';
import { testLogger } from '../setup/testConfig';

describe('Metrics Integration Tests', () => {
  let metrics: MetricsCollector;
  let scraper: DemandSignalScraper;
  let alertCallback: jest.Mock;

  beforeEach(() => {
    metrics = MetricsCollector.getInstance();
    scraper = DemandSignalScraper.getInstance();
    alertCallback = jest.fn();
    metrics.on('alert', alertCallback);
  });

  afterEach(() => {
    metrics.removeAllListeners();
  });

  describe('High Load Scenarios', () => {
    it('should trigger alerts on high error rates', async () => {
      // Simulate multiple errors
      for (let i = 0; i < 15; i++) {
        metrics.recordError();
      }

      // Wait for error rate check
      await new Promise(resolve => setTimeout(resolve, 5500));

      expect(alertCallback).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'error_rate',
          severity: 'high'
        })
      );
    });

    it('should handle concurrent signal processing', async () => {
      const processingPromises = Array(50).fill(null).map(() => {
        const duration = Math.random() * 2000; // Random duration up to 2s
        return metrics.recordProcessingTime(duration);
      });

      await Promise.all(processingPromises);

      // Should have some alerts for processing times > 1s
      expect(alertCallback).toHaveBeenCalled();
    });
  });

  describe('User Interaction Tracking', () => {
    it('should track user session patterns', async () => {
      const sessionDurations = [60, 120, 180]; // seconds
      const userTypes = ['new', 'returning', 'premium'];

      sessionDurations.forEach((duration, index) => {
        metrics.recordSessionDuration(duration, userTypes[index]);
      });

      const metricsOutput = await metrics.getMetrics();
      expect(metricsOutput).toContain('user_session_duration_seconds');
    });

    it('should identify demand patterns', async () => {
      const patterns = [
        { strength: 0.8, type: 'recurring' },
        { strength: 0.6, type: 'seasonal' },
        { strength: 0.9, type: 'trending' }
      ];

      patterns.forEach(({ strength, type }) => {
        metrics.recordDemandPattern(strength, type);
      });

      const metricsOutput = await metrics.getMetrics();
      expect(metricsOutput).toContain('demand_pattern_strength');
    });
  });

  describe('Edge Cases', () => {
    it('should handle invalid metric values gracefully', () => {
      expect(() => {
        metrics.recordProcessingTime(NaN);
        metrics.recordDemandPattern(-1, 'invalid');
        metrics.recordSessionDuration(Infinity, 'error');
      }).not.toThrow();
    });

    it('should maintain alert thresholds after updates', () => {
      const newThresholds = {
        processingTime: 500, // More stringent
        errorRate: 0.05 // More stringent
      };

      metrics.setAlertThresholds(newThresholds);
      
      // Should trigger alert with lower threshold
      metrics.recordProcessingTime(600);

      expect(alertCallback).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'processing_time',
          severity: 'medium'
        })
      );
    });
  });

  describe('System Integration', () => {
    it('should track demand signal scraping performance', async () => {
      const startTime = Date.now();
      
      try {
        await scraper.scrapeRedditDemand('test', 'demand');
      } catch (error) {
        // Expected in test environment
      }

      const processingTime = Date.now() - startTime;
      
      const metricsOutput = await metrics.getMetrics();
      expect(metricsOutput).toContain('demand_signal_processing_time');
      expect(metricsOutput).toContain('demand_signals_processed_total');
    });

    it('should handle system overload gracefully', async () => {
      // Simulate system overload
      const heavyLoad = Array(100).fill(null).map(() => {
        return scraper.scrapeRedditDemand('test', 'demand').catch(() => {});
      });

      await Promise.all(heavyLoad);

      // Should have rate limiting metrics
      const metricsOutput = await metrics.getMetrics();
      expect(metricsOutput).toContain('demand_signal_errors_total');
    });
  });
});
