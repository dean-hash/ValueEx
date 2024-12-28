import { AffiliateManager } from './affiliateManager';
import { RedditManager } from './redditManager';
import { RateLimiter } from './rateLimiter';
import { MetricsCollector } from './metricsCollector';
import { AlertManager } from './alertManager';

interface ResponseLoopConfig {
  subreddits: string[];
  keywords: string[];
  maxConcurrent: number;
  checkInterval: number; // ms
}

export class ResponseLoop {
  private static instance: ResponseLoop;
  private isRunning: boolean = false;
  private activeResponses: number = 0;
  private lastCheck: Record<string, number> = {};

  private affiliateManager: AffiliateManager;
  private redditManager: RedditManager;
  private rateLimiter: RateLimiter;
  private metricsCollector: MetricsCollector;
  private alertManager: AlertManager;

  private constructor(private config: ResponseLoopConfig) {
    this.affiliateManager = new AffiliateManager();
    this.redditManager = new RedditManager({
      userAgent: process.env.REDDIT_USER_AGENT!,
      clientId: process.env.REDDIT_CLIENT_ID!,
      clientSecret: process.env.REDDIT_CLIENT_SECRET!,
      refreshToken: process.env.REDDIT_REFRESH_TOKEN!,
    });
    this.rateLimiter = RateLimiter.getInstance();
    this.metricsCollector = MetricsCollector.getInstance();
    this.alertManager = AlertManager.getInstance();
  }

  static getInstance(config: ResponseLoopConfig): ResponseLoop {
    if (!ResponseLoop.instance) {
      ResponseLoop.instance = new ResponseLoop(config);
    }
    return ResponseLoop.instance;
  }

  async start(): Promise<void> {
    if (this.isRunning) return;
    this.isRunning = true;

    console.log('Starting response loop...');

    while (this.isRunning) {
      try {
        await this.checkSubreddits();
        await new Promise((resolve) => setTimeout(resolve, this.config.checkInterval));
      } catch (error) {
        console.error('Error in response loop:', error);
        await this.metricsCollector.trackError('responseLoop', error as Error);
      }
    }
  }

  async stop(): Promise<void> {
    this.isRunning = false;
    console.log('Stopping response loop...');
  }

  private async checkSubreddits(): Promise<void> {
    for (const subreddit of this.config.subreddits) {
      if (this.activeResponses >= this.config.maxConcurrent) {
        break;
      }

      try {
        if (!(await this.canCheckSubreddit(subreddit))) {
          continue;
        }

        const threads = await this.redditManager.getRelevantThreads(
          subreddit,
          this.config.keywords
        );

        for (const thread of threads) {
          if (this.activeResponses >= this.config.maxConcurrent) {
            break;
          }

          await this.processThread(subreddit, thread);
        }
      } catch (error) {
        console.error(`Error checking ${subreddit}:`, error);
        await this.metricsCollector.trackError('subredditCheck', error as Error, { subreddit });
      }
    }
  }

  private async canCheckSubreddit(subreddit: string): Promise<boolean> {
    const now = Date.now();
    const lastCheck = this.lastCheck[subreddit] || 0;

    // Respect rate limits
    if (!(await this.rateLimiter.canMakeRequest('subreddit_check', subreddit))) {
      return false;
    }

    // Check if enough time has passed
    if (now - lastCheck < this.config.checkInterval) {
      return false;
    }

    this.lastCheck[subreddit] = now;
    return true;
  }

  private async processThread(subreddit: string, thread: any): Promise<void> {
    this.activeResponses++;

    try {
      // Check if we can respond
      const metrics = await this.redditManager.getUserMetrics(thread.author);
      const canRespond = await this.affiliateManager.canRespond(subreddit, metrics);

      if (!canRespond) {
        return;
      }

      // Generate and post response
      const response = await this.affiliateManager.generateResponse(
        thread.title + '\n' + thread.selftext,
        {
          name: 'Relevant Product',
          link: 'http://affiliate.link',
          details: 'Product details',
        }
      );

      if (response) {
        await this.redditManager.postResponse(thread.name, response.content);

        // Track metrics
        await this.metricsCollector.trackResponse(
          subreddit,
          thread.title,
          response.content,
          metrics
        );
      }
    } catch (error) {
      console.error('Error processing thread:', error);
      await this.metricsCollector.trackError('threadProcess', error as Error, {
        subreddit,
        threadId: thread.name,
      });
    } finally {
      this.activeResponses--;
    }
  }

  // Public API for monitoring
  getStatus(): any {
    return {
      isRunning: this.isRunning,
      activeResponses: this.activeResponses,
      lastChecks: this.lastCheck,
      subreddits: this.config.subreddits,
    };
  }
}
