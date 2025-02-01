export declare class GPTService {
  private openai;
  private static instance;
  private constructor();
  static getInstance(): GPTService;
  analyzeMarketOpportunity(productDescription: string): Promise<{
    opportunity: number;
    confidence: number;
    reasoning: string;
  }>;
  generateProductDescription(keywords: string[]): Promise<string>;
  analyzePurchaseIntent(userQuery: string): Promise<{
    intent: number;
    urgency: number;
    interests: string[];
  }>;
}
