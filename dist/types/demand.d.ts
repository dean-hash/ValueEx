export interface DemandPattern {
  id: string;
  timeframe: string;
  intensity: number;
  keywords: string[];
  context: {
    marketTrends: string[];
    competitiveLandscape: string[];
    consumerBehavior: string[];
  };
}
export interface DemandContext {
  marketTrends: string[];
  competitiveLandscape: string[];
  consumerBehavior: string[];
}
