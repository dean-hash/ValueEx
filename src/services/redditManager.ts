import { Snoowrap } from 'snoowrap';
import { ResponseMetrics, ResponseRules } from '../types/affiliate';
import { RateLimiter } from './rateLimiter';

export class RedditManager {
  private reddit: Snoowrap;
  private postHistory: Map<string, number> = new Map(); // subreddit -> post count
  private rateLimiter: RateLimiter;

  constructor(config: {
    userAgent: string;
    clientId: string;
    clientSecret: string;
    refreshToken: string;
  }) {
    this.reddit = new Snoowrap({
      userAgent: config.userAgent,
      clientId: config.clientId,
      clientSecret: config.clientSecret,
      refreshToken: config.refreshToken,
    });
    this.rateLimiter = new RateLimiter();
  }

  async getRelevantThreads(subreddit: string, keywords: string[]): Promise<any[]> {
    // Check rate limits first
    if (!(await this.rateLimiter.canMakeRequest('reddit_read', subreddit))) {
      console.log(`Rate limit reached for reading ${subreddit}`);
      return [];
    }

    try {
      const subredditObj = await this.reddit.getSubreddit(subreddit);
      const newPosts = await subredditObj.getNew({ limit: 25 });

      // Record the request
      await this.rateLimiter.recordRequest('reddit_read', subreddit);

      return newPosts.filter((post) =>
        keywords.some(
          (keyword) =>
            post.title.toLowerCase().includes(keyword.toLowerCase()) ||
            post.selftext.toLowerCase().includes(keyword.toLowerCase())
        )
      );
    } catch (error) {
      console.error(`Error fetching threads from ${subreddit}:`, error);
      return [];
    }
  }

  async postResponse(threadId: string, response: string): Promise<boolean> {
    // Check both global and subreddit-specific rate limits
    const submission = await this.reddit.getSubmission(threadId);
    const subreddit = submission.subreddit_name_prefixed.replace('r/', '');

    if (!(await this.rateLimiter.canMakeRequest('reddit_post', 'global'))) {
      console.log('Global posting rate limit reached');
      return false;
    }

    if (!(await this.rateLimiter.canMakeRequest('subreddit', subreddit))) {
      console.log(`Subreddit rate limit reached for ${subreddit}`);
      return false;
    }

    try {
      await submission.reply(response);

      // Record the requests
      await this.rateLimiter.recordRequest('reddit_post', 'global');
      await this.rateLimiter.recordRequest('subreddit', subreddit);

      return true;
    } catch (error) {
      console.error('Error posting response:', error);
      return false;
    }
  }

  async getUserMetrics(username: string): Promise<ResponseMetrics> {
    // Check rate limits first
    if (!(await this.rateLimiter.canMakeRequest('reddit_read', 'user'))) {
      console.log('Rate limit reached for reading user data');
      return {
        questionAnswered: false,
        detailLevel: 0,
        sourcesProvided: false,
        upvotes: 0,
        comments: 0,
        reportCount: 0,
        clickCount: 0,
        conversionCount: 0,
        karmaBalance: 0,
        communityStanding: 0,
      };
    }

    try {
      const user = await this.reddit.getUser(username);
      const history = await user.getOverview();

      // Record the request
      await this.rateLimiter.recordRequest('reddit_read', 'user');

      return {
        questionAnswered: true, // Not applicable for user metrics
        detailLevel: 2, // Not applicable for user metrics
        sourcesProvided: true, // Not applicable for user metrics
        upvotes: history.reduce((sum, item) => sum + item.score, 0),
        comments: history.filter((item) => item.name.startsWith('t1_')).length,
        reportCount: 0, // Reddit API doesn't provide this
        clickCount: 0, // Not available via Reddit API
        conversionCount: 0, // Not available via Reddit API
        karmaBalance: await this.calculateKarmaRatio(history),
        communityStanding: await this.calculateCommunityStanding(history),
      };
    } catch (error) {
      console.error('Error fetching user metrics:', error);
      return {
        questionAnswered: false,
        detailLevel: 0,
        sourcesProvided: false,
        upvotes: 0,
        comments: 0,
        reportCount: 0,
        clickCount: 0,
        conversionCount: 0,
        karmaBalance: 0,
        communityStanding: 0,
      };
    }
  }

  private async calculateKarmaRatio(history: any[]): Promise<number> {
    // Check rate limits first
    if (!(await this.rateLimiter.canMakeRequest('reddit_read', 'user'))) {
      console.log('Rate limit reached for reading user data');
      return 0;
    }

    const promotional = history.filter(
      (item) => item.body?.includes('affiliate') || item.body?.includes('http')
    ).length;

    const total = history.length;
    // Record the request
    await this.rateLimiter.recordRequest('reddit_read', 'user');
    return total > 0 ? (total - promotional) / total : 1;
  }

  private async calculateCommunityStanding(history: any[]): Promise<number> {
    // Check rate limits first
    if (!(await this.rateLimiter.canMakeRequest('reddit_read', 'user'))) {
      console.log('Rate limit reached for reading user data');
      return 0;
    }

    const scores = history.map((item) => item.score);
    const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
    // Normalize to -1 to 1
    // Record the request
    await this.rateLimiter.recordRequest('reddit_read', 'user');
    return Math.tanh(avg / 10);
  }

  async canPostInSubreddit(subreddit: string, rules: ResponseRules): Promise<boolean> {
    // Check daily post limit
    const dailyPosts = this.postHistory.get(subreddit) || 0;
    if (dailyPosts >= rules.maxDailyPosts) return false;

    // Check if subreddit is banned
    if (rules.bannedSubreddits.includes(subreddit)) return false;

    return true;
  }

  async updatePostCount(subreddit: string): Promise<void> {
    const current = this.postHistory.get(subreddit) || 0;
    this.postHistory.set(subreddit, current + 1);
  }
}