import { PreCheckManager, PreCheckRequirements } from '../../../services/precheck/preCheckManager';

describe('PreCheckManager', () => {
  let preCheckManager: PreCheckManager;

  beforeEach(() => {
    preCheckManager = PreCheckManager.getInstance();
  });

  describe('validateApplication', () => {
    it('should validate Amazon requirements correctly', async () => {
      const requirements: PreCheckRequirements = {
        platform: 'amazon',
        domain: 'https://valuex.com',
        contentUrls: [
          'https://valuex.com/page1',
          'https://valuex.com/page2',
          'https://valuex.com/page3',
        ],
        trafficMetrics: {
          dailyVisitors: 150,
          monthlyPageviews: 4500,
        },
      };

      const result = await preCheckManager.validateApplication(requirements);
      expect(result.isReady).toBeDefined();
      expect(result.score).toBeGreaterThan(0);
      expect(result.requirements).toHaveProperty('domain');
      expect(result.requirements).toHaveProperty('content');
      expect(result.requirements).toHaveProperty('traffic');
    });

    it('should fail validation for insufficient requirements', async () => {
      const requirements: PreCheckRequirements = {
        platform: 'amazon',
        domain: 'http://myblog.wordpress.com', // No SSL, free domain
        contentUrls: ['https://myblog.wordpress.com/page1'], // Not enough pages
        trafficMetrics: {
          dailyVisitors: 50, // Below minimum
          monthlyPageviews: 1500,
        },
      };

      const result = await preCheckManager.validateApplication(requirements);
      expect(result.isReady).toBe(false);
      expect(result.score).toBeLessThan(0.8);
      expect(result.recommendations.length).toBeGreaterThan(0);
    });

    it('should validate eBay requirements correctly', async () => {
      const requirements: PreCheckRequirements = {
        platform: 'ebay',
        domain: 'https://valuex.com',
        contentUrls: ['https://valuex.com/page1', 'https://valuex.com/page2'],
        trafficMetrics: {
          dailyVisitors: 75,
          monthlyPageviews: 2250,
        },
      };

      const result = await preCheckManager.validateApplication(requirements);
      expect(result.isReady).toBeDefined();
      expect(result.score).toBeGreaterThan(0);
      expect(result.requirements).toHaveProperty('domain');
      expect(result.requirements).toHaveProperty('content');
      expect(result.requirements).toHaveProperty('traffic');
    });
  });
});
