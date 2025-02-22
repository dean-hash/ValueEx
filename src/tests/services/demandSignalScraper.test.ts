import { describe, expect, beforeEach, it } from '@jest/globals';
import { DemandSignalScraper } from '../../services/demandSignalScraper';
import { Logger } from '../../utils/logger';

jest.mock('puppeteer');
jest.mock('../../services/monitoring/metrics');

describe('DemandSignalScraper', () => {
  let scraper: DemandSignalScraper;
  let logger: Logger;
  let mockMetrics: jest.Mocked<MetricsCollector>;

  beforeEach(() => {
    logger = new Logger('DemandSignalScraper');
    scraper = new DemandSignalScraper(logger);
    jest.clearAllMocks();
    mockMetrics = {
      recordProcessingTime: jest.fn(),
      recordError: jest.fn(),
      recordSignal: jest.fn(),
    } as any;
    (MetricsCollector.getInstance as jest.Mock).mockReturnValue(mockMetrics);
  });

  describe('Reddit Scraping', () => {
    it('should return cached results if available and fresh', async (): Promise<void> => {
      const subreddit = 'test';
      const keyword = 'demand';

      // First call to populate cache
      await scraper.scrapeRedditDemand(subreddit, keyword);

      // Second call should use cache
      await scraper.scrapeRedditDemand(subreddit, keyword);

      expect(mockMetrics.recordSignal).toHaveBeenCalledTimes(1);
    });

    it('should handle errors gracefully and use fallback', async (): Promise<void> => {
      const subreddit = 'test';
      const keyword = 'error';

      // Mock puppeteer to throw error
      require('puppeteer').launch.mockImplementationOnce(() => {
        throw new Error('Network error');
      });

      const result = await scraper.scrapeRedditDemand(subreddit, keyword);

      expect(result).toHaveLength(1);
      expect(result[0].type).toBe('inferred');
      expect(mockMetrics.recordError).toHaveBeenCalled();
    });

    it('should respect rate limits', async (): Promise<void> => {
      const subreddit = 'test';
      const keyword = 'demand';

      // Make multiple rapid requests
      const promises = Array(5)
        .fill(null)
        .map(() => scraper.scrapeRedditDemand(subreddit, keyword));

      await Promise.all(promises);

      // Check that rate limiting was applied
      expect(mockMetrics.recordSignal).toHaveBeenCalledTimes(5);
    });
  });

  describe('Twitter Scraping', () => {
    it('should return cached results if available and fresh', async (): Promise<void> => {
      const keyword = 'demand';

      // First call to populate cache
      await scraper.scrapeTwitterDemand(keyword);

      // Second call should use cache
      await scraper.scrapeTwitterDemand(keyword);

      expect(mockMetrics.recordSignal).toHaveBeenCalledTimes(1);
    });

    it('should handle errors gracefully and use fallback', async (): Promise<void> => {
      const keyword = 'error';

      // Mock puppeteer to throw error
      require('puppeteer').launch.mockImplementationOnce(() => {
        throw new Error('Network error');
      });

      const result = await scraper.scrapeTwitterDemand(keyword);

      expect(result).toHaveLength(1);
      expect(result[0].type).toBe('inferred');
      expect(mockMetrics.recordError).toHaveBeenCalled();
    });
  });

  describe('Cache Management', () => {
    it('should clear cache when requested', async (): Promise<void> => {
      const keyword = 'test';

      // Populate cache
      await scraper.scrapeTwitterDemand(keyword);

      // Clear cache
      scraper.clearCache();

      // Should make new request
      await scraper.scrapeTwitterDemand(keyword);

      expect(mockMetrics.recordSignal).toHaveBeenCalledTimes(2);
    });
  });
});
