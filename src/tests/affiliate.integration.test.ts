import { AffiliateManager } from '../services/affiliateManager';
import { RedditManager } from '../services/redditManager';
import { RateLimiter } from '../services/rateLimiter';

// Real-world test data
const REAL_QUESTIONS = [
  {
    text: "What's a good beginner camera under $500?",
    subreddit: 'photography',
    expectedProduct: true,
    pricePoint: 500,
  },
  {
    text: 'Best laptop for college student?',
    subreddit: 'laptops',
    expectedProduct: true,
    pricePoint: 1000,
  },
  {
    text: 'When does the narwhal bacon?',
    subreddit: 'AskReddit',
    expectedProduct: false,
  },
];

const COMMON_REDDIT_ERRORS = {
  RATE_LIMIT: new Error('RATELIMIT: "You are doing that too much" on /api/comment'),
  AUTH_ERROR: new Error('401 Unauthorized'),
  TIMEOUT: new Error('504 Gateway Timeout'),
  BANNED: new Error('403 Forbidden: Banned from r/testsubreddit'),
};

describe('Affiliate System Integration', () => {
  let affiliateManager: AffiliateManager;
  let redditManager: RedditManager;
  let rateLimiter: RateLimiter;

  beforeEach(() => {
    affiliateManager = new AffiliateManager();
    redditManager = new RedditManager({
      userAgent: 'test',
      clientId: 'test',
      clientSecret: 'test',
      refreshToken: 'test',
    });
    rateLimiter = new RateLimiter();
  });

  describe('Real-world Question Handling', () => {
    test.each(REAL_QUESTIONS)('handles %s appropriately', async (question) => {
      const response = await affiliateManager.generateResponse(question.text, {
        name: 'Test Product',
        link: 'http://affiliate.link',
        details: 'Great product details',
      });

      if (question.expectedProduct) {
        expect(response).not.toBeNull();
        expect(response?.content).toContain("Here's what you need to know");
        if (question.pricePoint) {
          expect(response?.content.toLowerCase()).toContain('under $' + question.pricePoint);
        }
      } else {
        expect(response).toBeNull();
      }
    });
  });

  describe('Reddit Error Handling', () => {
    it('handles rate limit errors gracefully', async () => {
      // Mock Reddit API to throw rate limit error
      jest.spyOn(console, 'error').mockImplementation(() => {});
      const mockSnoowrap = require('snoowrap').Snoowrap;
      mockSnoowrap.mockImplementationOnce(() => ({
        getSubreddit: () => {
          throw COMMON_REDDIT_ERRORS.RATE_LIMIT;
        },
      }));

      const threads = await redditManager.getRelevantThreads('testsubreddit', ['test']);
      expect(threads).toHaveLength(0);

      // Should be able to retry after cooldown
      jest.advanceTimersByTime(60000);
      const retryThreads = await redditManager.getRelevantThreads('testsubreddit', ['test']);
      expect(retryThreads.length).toBeGreaterThan(0);
    });

    it('handles auth errors by requesting new token', async () => {
      let authErrorThrown = false;
      jest.spyOn(console, 'error').mockImplementation(() => {});
      const mockSnoowrap = require('snoowrap').Snoowrap;
      mockSnoowrap.mockImplementationOnce(() => ({
        getSubreddit: () => {
          if (!authErrorThrown) {
            authErrorThrown = true;
            throw COMMON_REDDIT_ERRORS.AUTH_ERROR;
          }
          return {
            getNew: jest.fn().mockResolvedValue([{ title: 'test', selftext: 'test' }]),
          };
        },
      }));

      const threads = await redditManager.getRelevantThreads('testsubreddit', ['test']);
      expect(threads.length).toBeGreaterThan(0);
    });
  });

  describe('Response Quality', () => {
    it('maintains helpful:promotional ratio', async () => {
      const responses = await Promise.all([
        // Generate multiple responses
        affiliateManager.generateResponse("What's the best camera for beginners?", {
          name: 'Camera A',
          link: 'http://link1',
          details: 'Great first camera',
        }),
        affiliateManager.generateResponse('Looking for laptop recommendations', {
          name: 'Laptop B',
          link: 'http://link2',
          details: 'Perfect for students',
        }),
        affiliateManager.generateResponse('Need help choosing a monitor', {
          name: 'Monitor C',
          link: 'http://link3',
          details: 'Excellent display',
        }),
      ]);

      // Check each response maintains quality
      responses.forEach((response) => {
        expect(response).not.toBeNull();
        if (response) {
          // Helpful content should come before affiliate link
          const contentBeforeLink =
            response.content.indexOf("Here's what you need to know") <
            response.content.indexOf('http://');
          expect(contentBeforeLink).toBe(true);

          // Should have substantial content
          expect(response.content.length).toBeGreaterThan(200);

          // Should include disclosure
          expect(response.content).toContain('affiliate');
        }
      });
    });
  });

  describe('Platform Limits', () => {
    it('respects subreddit-specific posting limits', async () => {
      const subreddit = 'testsubreddit';
      const maxPosts = 5;
      let successfulPosts = 0;

      // Try to post multiple times
      for (let i = 0; i < maxPosts + 3; i++) {
        const canPost = await redditManager.canPostInSubreddit(subreddit, {
          minDetailLevel: 2,
          minKarmaRatio: 0.9,
          maxDailyPosts: maxPosts,
          requiredDisclosure: 'Affiliate link disclosure',
          bannedSubreddits: [],
          minAccountAge: 30,
          minKarma: 100,
        });

        if (canPost) {
          successfulPosts++;
          await redditManager.updatePostCount(subreddit);
        }
      }

      expect(successfulPosts).toBeLessThanOrEqual(maxPosts);
    });
  });
});
