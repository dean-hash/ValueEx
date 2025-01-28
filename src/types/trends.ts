export interface TrendResponse {
  keyword: string;
  timeRange: string;
  formattedTime: string;
  value: number[];
  formattedValue: string[];
}

export interface RelatedQueriesResponse {
  keyword: string;
  queries: {
    query: string;
    value: number;
    formattedValue: string;
    link: string;
  }[];
}
