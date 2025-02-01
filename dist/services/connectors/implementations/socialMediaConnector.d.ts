import { DataPoint, DataConnector } from '../dataConnector';
export interface SocialConfig {
  platform: string;
  endpoint: string;
  streamEndpoint?: string;
  apiKey?: string;
}
export declare class SocialMediaConnector extends DataConnector {
  private ws;
  private readonly config;
  private metrics;
  private callbacks;
  constructor(config: SocialConfig);
  onData(callback: (data: DataPoint) => void): void;
  private setupWebSocket;
  fetchTrendingTopics(category: string, region?: string): Promise<DataPoint[]>;
  private fetchTwitterTrends;
  private fetchRedditTrends;
  private fetchLinkedInTrends;
  private processTwitterTrends;
  private processRedditTrends;
  private processLinkedInTrends;
  private processStreamData;
  private calculateStreamMetrics;
  private calculateTrendStrength;
  private calculateRedditStrength;
  private calculateLinkedInStrength;
  private calculateTwitterConfidence;
  private calculateRedditConfidence;
  private calculateLinkedInConfidence;
  private calculateStreamConfidence;
  private findRelevantSubreddits;
  private getWOEID;
  close(): void;
}
