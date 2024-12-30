import puppeteer from 'puppeteer';
import { SignalDimension, EmergentContext } from './demandPrecognition';
import { logger } from '../utils/logger';
import { MetricsCollector } from './monitoring/metrics';
import { DemandSignal } from '../types/demandSignal';
import axios from 'axios';
import { RateLimiter } from 'limiter';

export class DemandSignalScraper {
  private static instance: DemandSignalScraper;
  private metrics: MetricsCollector;
  private limiter: RateLimiter;
  private cache: Map<string, { data: SignalDimension; timestamp: number }> = new Map();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  private constructor() {
    this.metrics = MetricsCollector.getInstance();
    this.limiter = new RateLimiter({
      tokensPerInterval: 100,
      interval: 'minute'
    });
  }

  public static getInstance(): DemandSignalScraper {
    if (!DemandSignalScraper.instance) {
      DemandSignalScraper.instance = new DemandSignalScraper();
    }
    return DemandSignalScraper.instance;
  }

  async scrapeRedditDemand(subreddit: string, keyword: string): Promise<SignalDimension[]> {
    const startTime = Date.now();
    try {
      // Check cache first
      const cached = this.cache.get(`${subreddit}-${keyword}`);
      if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
        return [cached.data];
      }

      // Apply rate limiting
      await this.limiter.removeTokens(1);

      // Try primary source
      const signals = await this.scrapeReddit(subreddit, keyword);
      
      // Record metrics
      this.metrics.recordProcessingTime(Date.now() - startTime);
      this.metrics.recordSignal('direct', `${subreddit}-${keyword}`);
      
      return signals;
    } catch (error) {
      logger.error('Error fetching demand signals:', error);
      this.metrics.recordError();

      // Try fallback mechanism
      return this.fetchFromFallbackSource(subreddit, keyword);
    }
  }

  async scrapeTwitterDemand(keyword: string): Promise<SignalDimension[]> {
    const startTime = Date.now();
    try {
      // Check cache first
      const cached = this.cache.get(`twitter-${keyword}`);
      if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
        return [cached.data];
      }

      // Apply rate limiting
      await this.limiter.removeTokens(1);

      // Try primary source
      const signals = await this.scrapeTwitter(keyword);
      
      // Record metrics
      this.metrics.recordProcessingTime(Date.now() - startTime);
      this.metrics.recordSignal('direct', `twitter-${keyword}`);
      
      return signals;
    } catch (error) {
      logger.error('Error fetching demand signals:', error);
      this.metrics.recordError();

      // Try fallback mechanism
      return this.fetchFromFallbackSource('twitter', keyword);
    }
  }

  private async scrapeReddit(subreddit: string, keyword: string): Promise<SignalDimension[]> {
    try {
      const browser = await puppeteer.launch({ headless: true });
      try {
        const page = await browser.newPage();
        await page.goto(
          `https://www.reddit.com/r/${subreddit}/search/?q=${keyword}&restrict_sr=1&sort=new`
        );

        // Get posts and their metadata
        const posts = await page.$$eval('.Post', (posts) =>
          posts.map((post) => ({
            title: post.querySelector('h3')?.textContent || '',
            upvotes: post.querySelector('[id^="vote-arrows-"]')?.textContent || '0',
            comments: post.querySelector('a[data-click-id="comments"]')?.textContent || '0',
            timestamp: post.querySelector('a[data-click-id="timestamp"]')?.textContent || '',
          }))
        );

        // Convert to demand signals
        const signals = posts.map((post) => ({
          type: 'social',
          strength: this.calculateStrength(post.upvotes, post.comments),
          velocity: this.calculateVelocity(post.timestamp),
          acceleration: 0, // Need historical data for this
          context: this.extractContext(post.title),
          resonancePatterns: {
            withOtherSignals: new Map(),
            withHistoricalPatterns: new Map(),
            withPredictedOutcomes: new Map(),
          },
        }));

        // Update cache
        this.cache.set(`${subreddit}-${keyword}`, { data: signals[0], timestamp: Date.now() });
        
        return signals;
      } finally {
        await browser.close();
      }
    } catch (error) {
      throw new Error(`Primary source fetch failed: ${error.message}`);
    }
  }

  private async scrapeTwitter(keyword: string): Promise<SignalDimension[]> {
    try {
      const browser = await puppeteer.launch({ headless: true });
      try {
        const page = await browser.newPage();
        await page.goto(`https://twitter.com/search?q=${keyword}&f=live`);

        // Get tweets and their metadata
        const tweets = await page.$$eval('[data-testid="tweet"]', (tweets) =>
          tweets.map((tweet) => ({
            text: tweet.querySelector('[data-testid="tweetText"]')?.textContent || '',
            likes: tweet.querySelector('[data-testid="like"]')?.textContent || '0',
            retweets: tweet.querySelector('[data-testid="retweet"]')?.textContent || '0',
            timestamp: tweet.querySelector('time')?.getAttribute('datetime') || '',
          }))
        );

        // Convert to demand signals
        const signals = tweets.map((tweet) => ({
          type: 'social',
          strength: this.calculateStrength(tweet.likes, tweet.retweets),
          velocity: this.calculateVelocity(tweet.timestamp),
          acceleration: 0,
          context: this.extractContext(tweet.text),
          resonancePatterns: {
            withOtherSignals: new Map(),
            withHistoricalPatterns: new Map(),
            withPredictedOutcomes: new Map(),
          },
        }));

        // Update cache
        this.cache.set(`twitter-${keyword}`, { data: signals[0], timestamp: Date.now() });
        
        return signals;
      } finally {
        await browser.close();
      }
    } catch (error) {
      throw new Error(`Primary source fetch failed: ${error.message}`);
    }
  }

  private async fetchFromFallbackSource(subreddit: string, keyword: string): Promise<SignalDimension[]> {
    try {
      // Implement fallback logic (e.g., local database, alternative API)
      const signal: SignalDimension = {
        type: 'inferred',
        strength: 0.6,
        velocity: 0.5,
        acceleration: 0,
        context: this.extractContext('Fallback signal'),
        resonancePatterns: {
          withOtherSignals: new Map(),
          withHistoricalPatterns: new Map(),
          withPredictedOutcomes: new Map(),
        },
      };

      this.metrics.recordSignal('fallback', `${subreddit}-${keyword}`);
      return [signal];
    } catch (error) {
      logger.error('Fallback source fetch failed:', error);
      return [];
    }
  }

  private calculateStrength(metric1: string, metric2: string): number {
    const value1 = parseInt(metric1.replace(/[^0-9]/g, '')) || 0;
    const value2 = parseInt(metric2.replace(/[^0-9]/g, '')) || 0;
    return Math.min(1, (value1 + value2) / 1000); // Normalize to 0-1
  }

  private calculateVelocity(timestamp: string): number {
    const postTime = new Date(timestamp).getTime();
    const now = new Date().getTime();
    const hoursAgo = (now - postTime) / (1000 * 60 * 60);
    return Math.max(0, 1 - hoursAgo / 24); // Higher velocity for newer posts
  }

  private extractContext(text: string): EmergentContext {
    // Basic context extraction
    return {
      primaryDrivers: {
        need: text.slice(0, 100), // First 100 chars as need description
        urgency: text.includes('urgent') || text.includes('asap') ? 1 : 0.5,
        complexity: text.length > 200 ? 1 : 0.5, // Longer posts might indicate complexity
      },
      environmentalFactors: {
        market: [],
        organizational: [],
        temporal: [],
      },
      decisionDynamics: {
        stakeholders: new Map(),
        catalysts: [],
        barriers: [],
      },
    };
  }

  clearCache(): void {
    this.cache.clear();
  }
}
