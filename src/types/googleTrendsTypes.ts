export interface GoogleTrendsTimelineData {
  time: string;
  value: number[];
}

export interface GoogleTrendsResult {
  default: {
    timelineData: GoogleTrendsTimelineData[];
    averages?: number[];
    keywords?: string[];
  };
}

export interface GoogleTrendsError {
  message: string;
  status: string;
}

export interface TrendData {
  keyword: string;
  timeline: Array<{
    timestamp: string;
    value: number;
  }>;
  average: number;
  momentum: number;
  seasonality: number;
}

export interface RegionalInterestData {
  geoCode: string;
  value: number;
  formattedValue: string;
}

export interface RelatedQueryData {
  query: string;
  value: number;
  formattedValue: string;
  link: string;
}

export interface TrendMetrics {
  currentValue: number;
  historicalAverage: number;
  momentum: number;
  seasonalityScore: number;
  volatility: number;
  regionalSpread: {
    global: number;
    local: number;
    ratio: number;
  };
  relatedQueries: Array<{
    query: string;
    correlation: number;
  }>;
}
