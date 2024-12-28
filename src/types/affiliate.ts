export interface AffiliateResponse {
  content: string;
  affiliateLink?: string;
  disclosure: string;
  metrics: ResponseMetrics;
}

export interface ResponseMetrics {
  // Measurable quality indicators
  questionAnswered: boolean;
  detailLevel: number; // 0-3: none, basic, detailed, comprehensive
  sourcesProvided: boolean;

  // Engagement metrics
  upvotes: number;
  comments: number;
  reportCount: number;

  // Commercial metrics
  clickCount: number;
  conversionCount: number;

  // Community health
  karmaBalance: number; // Ratio of helpful:promotional content
  communityStanding: number; // -1 to 1
}

export interface ResponseRules {
  minDetailLevel: number;
  minKarmaRatio: number;
  maxDailyPosts: number;
  requiredDisclosure: string;
  bannedSubreddits: string[];
  minAccountAge: number; // in days
  minKarma: number;
}
