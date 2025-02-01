export interface MarketSignal {
  type: 'PRICE_SENSITIVITY' | 'MARKET_DEMAND' | 'COMPETITOR_ACTION' | 'USER_BEHAVIOR';
  strength: number;
  direction: number;
  confidence: number;
  timestamp: number;
}
export interface MarketContext {
  priceElasticity?: number;
  demandStrength?: number;
  competitorInfluence?: number;
  userSentiment?: number;
}
export interface ValueAdjustment {
  price: {
    amount: number;
    confidence: number;
    optimal: number;
  };
  commission: {
    rate: number;
    confidence: number;
    optimal: number;
  };
  market: {
    momentum: number;
    direction: number;
    confidence: number;
  };
  timing: {
    immediate: boolean;
    delay: number;
    confidence: number;
  };
}
