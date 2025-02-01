export interface ValueMetrics {
  projectedRevenue: number;
  engagementScore: number;
  conversionRate: number;
  marketFit: number;
  growthPotential: number;
}
export interface ResponseMetrics {
  karmaRatio: number;
  detailLevel: number;
  relevanceScore: number;
  contentQuality: number;
}
export interface RedditPost {
  id: string;
  title: string;
  body: string;
  subreddit: string;
  author: string;
  score: number;
  created: number;
}
