import { DemandSource } from './demandSourceManager';
import { ScrapedDemandSignal } from '../../types/demandTypes';
import fetch from 'node-fetch';
import { logger } from '../../utils/logger';

export class RedditScraper implements DemandSource {
  name = 'reddit';
  weight = 0.3;

  // Move all the Reddit-specific code from demandScraper.ts here
  // This includes all the methods we just fixed

  async scrape(query: string, options?: any): Promise<ScrapedDemandSignal[]> {
    const subreddits = options?.subreddits || ['technology', 'programming', 'webdev', 'software'];
    const signals: ScrapedDemandSignal[] = [];

    await Promise.all(
      subreddits.map(async (subreddit: string) => {
        try {
          const subredditSignals = await this.scrapeSubreddit(subreddit, query);
          signals.push(...subredditSignals);
        } catch (error) {
          logger.error(`Error scraping subreddit ${subreddit}`, { error });
        }
      })
    );

    return signals;
  }

  validateSignal(signal: ScrapedDemandSignal): boolean {
    const requiredFields = [
      signal.id,
      signal.title,
      signal.content,
      signal.url,
      signal.timestamp,
      signal.confidence?.overall,
      signal.context?.author?.id,
      signal.context?.community?.name,
    ];

    return requiredFields.filter(Boolean).length === requiredFields.length;
  }

  private async scrapeSubreddit(subreddit: string, query: string): Promise<ScrapedDemandSignal[]> {
    const url = `https://www.reddit.com/r/${subreddit}/search.json?q=${encodeURIComponent(query)}&restrict_sr=1&sort=relevance&limit=10`;

    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'ValueEx/1.0.0',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      const posts = data.data.children;

      return posts
        .map(
          (post: any) =>
            ({
              id: post.data.id,
              title: post.data.title,
              content: post.data.selftext || post.data.title,
              url: `https://reddit.com${post.data.permalink}`,
              timestamp: new Date(post.data.created_utc * 1000).toISOString(),
              confidence: {
                overall: post.data.score / 100, // Normalize score
                factors: {
                  textQuality: 0.8,
                  communityEngagement: post.data.num_comments / 50,
                  authorCredibility: 0.7,
                  contentRelevance: post.data.upvote_ratio,
                  temporalRelevance: 0.9,
                },
              },
              context: {
                thread: {
                  id: post.data.id,
                  isOriginalPost: true,
                  depth: 0,
                },
                author: {
                  id: post.data.author,
                },
                community: {
                  name: post.data.subreddit,
                  size: post.data.subreddit_subscribers,
                  topicRelevance: 0.8,
                },
              },
              analysis: {
                sentiment: 0, // Will be filled by Digital Intelligence
                topics: [],
                pricePoints: [],
                features: {},
                relationships: {
                  relatedThreads: [],
                  crossReferences: [],
                  temporalConnections: [],
                },
              },
              metadata: {
                processingTime: Date.now(),
                extractionVersion: '1.0.0',
                dataQualityScore: 0.8,
              },
            }) as ScrapedDemandSignal
        )
        .filter((signal: ScrapedDemandSignal) => this.validateSignal(signal));
    } catch (error) {
      logger.error(`Error scraping subreddit ${subreddit}:`, { error });
      return [];
    }
  }

  // ... include all the methods we fixed earlier ...
}
