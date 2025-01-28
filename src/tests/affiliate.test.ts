import { AffiliateManager } from '../services/affiliate/affiliateManager';
import { MerchantMatch } from '../types/merchant';

describe('AffiliateManager', () => {
  let manager: AffiliateManager;

  beforeEach(() => {
    manager = AffiliateManager.getInstance();
  });

  describe('findMerchants', () => {
    it('should find matching merchants', async () => {
      const matches = await manager.findMerchants('electronics under $500');
      expect(Array.isArray(matches)).toBe(true);

      matches.forEach((match: MerchantMatch) => {
        expect(match).toHaveProperty('merchantId');
        expect(match).toHaveProperty('category');
        expect(match).toHaveProperty('commissionRate');
        expect(match).toHaveProperty('relevanceScore');
      });
    });

    it('should handle no matches gracefully', async () => {
      const matches = await manager.findMerchants('nonexistent product category');
      expect(Array.isArray(matches)).toBe(true);
      expect(matches.length).toBe(0);
    });
  });

  describe('validateMerchant', () => {
    it('should validate merchant credentials', async () => {
      const isValid = await manager.validateMerchant('test-merchant-id');
      expect(typeof isValid).toBe('boolean');
    });
  });
});

import { RedditManager } from '../services/redditManager';
import { RateLimiter } from '../services/rateLimiter';

// Mock Snoowrap
jest.mock('snoowrap', () => {
  return {
    Snoowrap: jest.fn().mockImplementation(() => ({
      getSubreddit: jest.fn().mockImplementation(() => ({
        getNew: jest.fn().mockResolvedValue([
          {
            title: 'Looking for product recommendations',
            selftext: 'Need help finding the best value',
            score: 10,
          },
        ]),
      })),
      getSubmission: jest.fn().mockImplementation(() => ({
        reply: jest.fn().mockResolvedValue(true),
        subreddit_name_prefixed: 'r/testsubreddit',
      })),
      getUser: jest.fn().mockImplementation(() => ({
        getOverview: jest.fn().mockResolvedValue([
          { score: 5, name: 't1_comment', body: 'Helpful comment' },
          { score: 3, name: 't1_comment', body: 'Contains affiliate link http://' },
        ]),
      })),
    })),
  };
});

describe('RateLimiter', () => {
  let rateLimiter: RateLimiter;

  beforeEach(() => {
    rateLimiter = new RateLimiter();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('canMakeRequest', () => {
    it('should respect per-minute limits', async () => {
      const action = 'reddit_post';
      const identifier = 'test_subreddit';

      // First request should be allowed
      expect(await rateLimiter.canMakeRequest(action, identifier)).toBe(true);
      await rateLimiter.recordRequest(action, identifier);

      // Second request within a minute should be blocked
      expect(await rateLimiter.canMakeRequest(action, identifier)).toBe(false);

      // After a minute, should allow again
      jest.advanceTimersByTime(60000);
      expect(await rateLimiter.canMakeRequest(action, identifier)).toBe(true);
    });

    it('should respect cooldown periods', async () => {
      const action = 'reddit_post';
      const identifier = 'test_subreddit';

      // First request
      expect(await rateLimiter.canMakeRequest(action, identifier)).toBe(true);
      await rateLimiter.recordRequest(action, identifier);

      // During cooldown
      jest.advanceTimersByTime(15000); // 15 seconds
      expect(await rateLimiter.canMakeRequest(action, identifier)).toBe(false);

      // After cooldown
      jest.advanceTimersByTime(15000); // Another 15 seconds
      expect(await rateLimiter.canMakeRequest(action, identifier)).toBe(true);
    });
  });

  describe('getLimitStatus', () => {
    it('should return correct remaining requests', async () => {
      const action = 'reddit_post';
      const identifier = 'test_subreddit';

      await rateLimiter.recordRequest(action, identifier);
      const status = rateLimiter.getLimitStatus(action, identifier);

      expect(status).not.toBeNull();
      expect(status?.remaining).toBe(49); // 50 - 1
      expect(status?.resetIn).toBeGreaterThan(0);
    });
  });
});

describe('RedditManager', () => {
  let redditManager: RedditManager;

  beforeEach(() => {
    redditManager = new RedditManager({
      userAgent: 'test',
      clientId: 'test',
      clientSecret: 'test',
      refreshToken: 'test',
    });
  });

  describe('getRelevantThreads', () => {
    it('should filter relevant threads', async () => {
      const threads = await redditManager.getRelevantThreads('testsubreddit', [
        'product',
        'recommendations',
      ]);
      expect(threads).toHaveLength(1);
      expect(threads[0].title).toContain('product');
    });

    it('should respect rate limits', async () => {
      // Make multiple requests quickly
      await redditManager.getRelevantThreads('testsubreddit', ['test']);
      const secondRequest = await redditManager.getRelevantThreads('testsubreddit', ['test']);

      // Second request should be empty due to rate limiting
      expect(secondRequest).toHaveLength(0);
    });
  });

  describe('getUserMetrics', () => {
    it('should calculate karma ratio correctly', async () => {
      const metrics = await redditManager.getUserMetrics('testuser');
      expect(metrics.karmaBalance).toBeCloseTo(0.5); // 1 promotional out of 2 total
    });

    it('should handle API errors gracefully', async () => {
      // Force an error
      jest.spyOn(console, 'error').mockImplementation(() => {});
      const mockSnoowrap = require('snoowrap').Snoowrap;
      mockSnoowrap.mockImplementationOnce(() => ({
        getUser: () => {
          throw new Error('API Error');
        },
      }));

      const metrics = await redditManager.getUserMetrics('erroruser');
      expect(metrics.karmaBalance).toBe(0);
      expect(metrics.communityStanding).toBe(0);
    });
  });
});
