import { DataPoint } from '../dataConnector';
import axios from 'axios';
import { WebSocket } from 'ws';

interface SocialConfig {
  platform: 'twitter' | 'reddit' | 'linkedin';
  endpoint: string;
  apiKey?: string;
  apiSecret?: string;
  streamEndpoint?: string;
}

interface SocialMetrics {
  engagement: number;
  sentiment: number;
  reach: number;
  velocity: number;
}

export class SocialMediaConnector {
  private config: SocialConfig;
  private ws: WebSocket | null = null;
  private metrics: Map<string, SocialMetrics> = new Map();
  private callbacks: Set<(data: DataPoint) => void> = new Set();

  constructor(config: SocialConfig) {
    this.config = config;
    if (config.streamEndpoint) {
      this.initializeStream();
    }
  }

  public onData(callback: (data: DataPoint) => void): void {
    this.callbacks.add(callback);
  }

  private initializeStream(): void {
    if (!this.config.streamEndpoint) return;

    this.ws = new WebSocket(this.config.streamEndpoint, {
      headers: {
        'Authorization': `Bearer ${this.config.apiKey}`
      }
    });

    this.ws.on('message', (data: string) => {
      try {
        const parsed = JSON.parse(data);
        const dataPoint = this.processStreamData(parsed);
        this.callbacks.forEach(callback => callback(dataPoint));
      } catch (error) {
        console.error('Error processing stream data:', error);
      }
    });

    this.ws.on('error', (error) => {
      console.error('WebSocket error:', error);
      setTimeout(() => this.initializeStream(), 5000);
    });

    this.ws.on('close', () => {
      setTimeout(() => this.initializeStream(), 5000);
    });
  }

  public async fetchTrendingTopics(
    category: string,
    region: string = 'global'
  ): Promise<DataPoint[]> {
    switch (this.config.platform) {
      case 'twitter':
        return this.fetchTwitterTrends(category, region);
      case 'reddit':
        return this.fetchRedditTrends(category, region);
      case 'linkedin':
        return this.fetchLinkedInTrends(category, region);
      default:
        throw new Error(`Unsupported platform: ${this.config.platform}`);
    }
  }

  private async fetchTwitterTrends(category: string, region: string): Promise<DataPoint[]> {
    try {
      const response = await axios.get(
        `${this.config.endpoint}/trends/place`,
        {
          params: { id: this.getWOEID(region) },
          headers: {
            'Authorization': `Bearer ${this.config.apiKey}`
          }
        }
      );

      return this.processTwitterTrends(response.data[0].trends, category);
    } catch (error) {
      console.error('Error fetching Twitter trends:', error);
      throw error;
    }
  }

  private async fetchRedditTrends(category: string, region: string): Promise<DataPoint[]> {
    try {
      const subreddits = await this.findRelevantSubreddits(category);
      const promises = subreddits.map(subreddit =>
        axios.get(
          `${this.config.endpoint}/r/${subreddit}/hot`,
          {
            headers: {
              'Authorization': `Bearer ${this.config.apiKey}`
            }
          }
        )
      );

      const responses = await Promise.all(promises);
      return this.processRedditTrends(responses, category);
    } catch (error) {
      console.error('Error fetching Reddit trends:', error);
      throw error;
    }
  }

  private async fetchLinkedInTrends(category: string, region: string): Promise<DataPoint[]> {
    try {
      const response = await axios.get(
        `${this.config.endpoint}/trending`,
        {
          params: {
            categories: category,
            location: region
          },
          headers: {
            'Authorization': `Bearer ${this.config.apiKey}`
          }
        }
      );

      return this.processLinkedInTrends(response.data, category);
    } catch (error) {
      console.error('Error fetching LinkedIn trends:', error);
      throw error;
    }
  }

  private processTwitterTrends(trends: any[], category: string): DataPoint[] {
    return trends.map(trend => ({
      timestamp: new Date().toISOString(),
      value: this.calculateTrendStrength(trend),
      metadata: {
        name: trend.name,
        query: trend.query,
        tweetVolume: trend.tweet_volume,
        promoted: trend.promoted_content !== null,
        category,
        platform: 'twitter'
      },
      confidence: this.calculateTwitterConfidence(trend)
    }));
  }

  private processRedditTrends(responses: any[], category: string): DataPoint[] {
    const dataPoints: DataPoint[] = [];

    for (const response of responses) {
      const posts = response.data.data.children;
      
      for (const post of posts) {
        dataPoints.push({
          timestamp: new Date().toISOString(),
          value: this.calculateRedditStrength(post.data),
          metadata: {
            title: post.data.title,
            subreddit: post.data.subreddit,
            upvoteRatio: post.data.upvote_ratio,
            score: post.data.score,
            numComments: post.data.num_comments,
            category,
            platform: 'reddit'
          },
          confidence: this.calculateRedditConfidence(post.data)
        });
      }
    }

    return dataPoints;
  }

  private processLinkedInTrends(data: any, category: string): DataPoint[] {
    return data.elements.map((element: any) => ({
      timestamp: new Date().toISOString(),
      value: this.calculateLinkedInStrength(element),
      metadata: {
        title: element.title,
        description: element.description,
        engagement: element.socialMetrics,
        category,
        platform: 'linkedin'
      },
      confidence: this.calculateLinkedInConfidence(element)
    }));
  }

  private processStreamData(data: any): DataPoint {
    const metrics = this.calculateStreamMetrics(data);
    
    return {
      timestamp: new Date().toISOString(),
      value: metrics.engagement * metrics.velocity,
      metadata: {
        ...data,
        metrics
      },
      confidence: this.calculateStreamConfidence(metrics)
    };
  }

  private calculateStreamMetrics(data: any): SocialMetrics {
    // Implementation would vary by platform
    return {
      engagement: 0,
      sentiment: 0,
      reach: 0,
      velocity: 0
    };
  }

  private calculateTrendStrength(trend: any): number {
    if (!trend.tweet_volume) return 0.5;
    return Math.min(trend.tweet_volume / 100000, 1);
  }

  private calculateRedditStrength(post: any): number {
    const scoreWeight = 0.4;
    const commentWeight = 0.3;
    const ratioWeight = 0.3;

    const scoreScore = Math.min(post.score / 10000, 1);
    const commentScore = Math.min(post.num_comments / 1000, 1);
    const ratioScore = post.upvote_ratio;

    return (
      scoreScore * scoreWeight +
      commentScore * commentWeight +
      ratioScore * ratioWeight
    );
  }

  private calculateLinkedInStrength(element: any): number {
    const metrics = element.socialMetrics;
    const likeWeight = 0.3;
    const commentWeight = 0.3;
    const shareWeight = 0.4;

    const likeScore = Math.min(metrics.numLikes / 1000, 1);
    const commentScore = Math.min(metrics.numComments / 100, 1);
    const shareScore = Math.min(metrics.numShares / 100, 1);

    return (
      likeScore * likeWeight +
      commentScore * commentWeight +
      shareScore * shareWeight
    );
  }

  private calculateTwitterConfidence(trend: any): number {
    if (!trend.tweet_volume) return 0.5;
    return Math.min(trend.tweet_volume / 50000, 1);
  }

  private calculateRedditConfidence(post: any): number {
    const ageHours = (Date.now() - post.created_utc * 1000) / (1000 * 60 * 60);
    const freshnessScore = Math.max(1 - ageHours / 24, 0);
    const engagementScore = Math.min((post.score + post.num_comments) / 5000, 1);
    const qualityScore = post.upvote_ratio;

    return (freshnessScore + engagementScore + qualityScore) / 3;
  }

  private calculateLinkedInConfidence(element: any): number {
    const metrics = element.socialMetrics;
    const total = metrics.numLikes + metrics.numComments + metrics.numShares;
    return Math.min(total / 1000, 1);
  }

  private calculateStreamConfidence(metrics: SocialMetrics): number {
    return (
      metrics.engagement * 0.3 +
      Math.abs(metrics.sentiment) * 0.2 +
      metrics.reach * 0.3 +
      metrics.velocity * 0.2
    );
  }

  private async findRelevantSubreddits(category: string): Promise<string[]> {
    // Implementation would search for relevant subreddits based on category
    return ['technology', 'gadgets', 'business']; // Placeholder
  }

  private getWOEID(region: string): number {
    // Implementation would map region names to Twitter WOEIDs
    return 1; // Placeholder for global
  }

  public close(): void {
    if (this.ws) {
      this.ws.close();
    }
  }
}
