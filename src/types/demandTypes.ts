export interface PricePoint {
  value: number;
  currency: string;
  context: string;
  confidence: number;
}

export interface Feature {
  name: string;
  sentiment: number;
  mentions: number;
  context: string[];
}

export interface ProductInsights {
  category: string;
  features: string[];
  targetAudience: string[];
  pricePoint: string;
}

export interface DemandContext {
  marketTrends: string[];
  competitiveLandscape: string[];
  consumerBehavior: string[];
}

export interface GPTResponse {
  resonanceFactors?: {
    temporal: number;
    content: number;
    interaction: number;
  };
  keywords?: string[];
}

export interface RedditPost {
  id: string;
  title: string;
  selftext: string;
  permalink: string;
  created_utc: number;
  author: string;
  score: number;
  num_comments: number;
  upvote_ratio: number;
  total_awards_received: number;
  author_karma?: number;
  author_created_utc?: number;
  author_verified?: boolean;
  subreddit: string;
  subreddit_subscribers: number;
  over_18: boolean;
  parent_id?: string;
  depth?: number;
  data?: any;
}

export interface RedditComment {
  id: string;
  body: string;
  author: string;
  created_utc: number;
  score: number;
  depth: number;
  parent_id: string;
  data?: any;
}

export interface ScrapedDemandSignal {
  id: string;
  title: string;
  content: string;
  url: string;
  timestamp: string;
  confidence: {
    overall: number;
    factors: {
      textQuality: number;
      communityEngagement: number;
      authorCredibility: number;
      contentRelevance: number;
      temporalRelevance: number;
    };
  };
  context: {
    thread: {
      id: string;
      parentId?: string;
      depth: number;
      isOriginalPost: boolean;
    };
    author: {
      id: string;
      karmaScore?: number;
      accountAge?: number;
      domainActivity?: number;
    };
    community: {
      name: string;
      size?: number;
      topicRelevance: number;
      activityLevel?: number;
    };
  };
  analysis: {
    sentiment: number;
    topics: Array<{
      name: string;
      confidence: number;
      keywords: string[];
    }>;
    pricePoints: Array<{
      value: number;
      currency: string;
      confidence: number;
      context: string;
    }>;
    features: {
      [category: string]: Array<{
        name: string;
        sentiment: number;
        confidence: number;
        mentions: number;
        context: string[];
      }>;
    };
    relationships: {
      relatedThreads: string[];
      crossReferences: string[];
      temporalConnections: string[];
    };
  };
  metadata: {
    processingTime: number;
    extractionVersion: string;
    dataQualityScore: number;
    source?: string;
    sourceWeight?: number;
    sources?: string[];
    aggregatedCount?: number;
  };
}

export interface DemandValidation {
  confidence: number;
  strength: number;
  relevance?: number;
}

export interface DemandSignal {
  id: string;
  source: string;
  content: string;
  title: string;
  url: string;
  timestamp: string;
  keyPoints: string[];
  pricePoints?: Array<{
    value: number;
    context: string;
  }>;
  validation?: DemandValidation;
  relevance?: number;
  confidence: {
    overall: number;
    factors: {
      textQuality: number;
      communityEngagement: number;
      authorCredibility: number;
      contentRelevance: number;
      temporalRelevance: number;
    }
  };
  context: {
    sentiment: number;
    intent: string;
    topics: string[];
    entities: string[];
  };
}

export interface DemandPattern {
  id: string;
  signals: DemandSignal[];
  confidence: number;
  coherence: number;
  timeframe: {
    start: string;
    end: string;
  };
  temporalFactors: {
    trend: number;
    seasonality: number;
    volatility: number;
  };
  spatialFactors: {
    geographic: string[];
    demographic: string[];
    psychographic: string[];
  };
  context: {
    market: string;
    category: string;
    priceRange: {
      min: number;
      max: number;
    };
  };
}

export interface PrimaryDrivers {
  need: string;
  urgency: number;
  resources: number;
  timing?: number;
}

export interface EnvironmentalFactors {
  competition: number;
  marketConditions: number;
  regulations: number;
}

export interface DecisionDynamics {
  stakeholders: number;
  complexity: number;
  urgency: number;
}

export interface SignalContext {
  primaryDrivers: PrimaryDrivers;
  environmentalFactors: EnvironmentalFactors;
  decisionDynamics: DecisionDynamics;
}

export type SignalType =
  | 'behavior'
  | 'conversation'
  | 'search'
  | 'event'
  | 'social'
  | 'economic'
  | 'temporal'
  | 'content'
  | 'interaction';

export interface SignalDimension {
  type: SignalType;
  strength: number;
  velocity?: number;
  acceleration?: number;
  content?: string;
  context: SignalContext;
}

export interface ResonanceVector {
  dimension: string;
  magnitude: number;
  direction: number;
  type: SignalType;
  strength: number;
  context: SignalContext;
}

export interface TemporalFactors {
  seasonality: number;
  trendStrength: number;
  cyclicality: number;
}

export interface SpatialFactors {
  geographicSpread: number;
  marketPenetration: number;
  demographicReach: number;
}

export interface CompetitiveAnalysis {
  marketShare: number;
  competitorStrength: number;
  uniqueSellingPoints: string[];
}

export interface SignalContext {
  primaryDrivers: PrimaryDrivers;
  environmentalFactors: EnvironmentalFactors;
  decisionDynamics: DecisionDynamics;
}
