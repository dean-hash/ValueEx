interface ResponseConfig {
  maxTokens?: number;
  temperature?: number;
  model?: string;
}
export declare class OpenAIManager {
  private static instance;
  private openai;
  private metricsCollector;
  private constructor();
  static getInstance(): OpenAIManager;
  generateResponse(
    question: string,
    productInfo: any,
    config?: ResponseConfig
  ): Promise<string | null>;
  private getSystemPrompt;
  private formatUserPrompt;
  validateResponse(response: string, originalQuestion: string): Promise<boolean>;
  analyzeUserIntent(question: string): Promise<{
    hasProductIntent: boolean;
    priceRange?: number;
    category?: string;
    expertise?: 'beginner' | 'intermediate' | 'expert';
  }>;
  checkEthicalCompliance(productInfo: any, userIntent: any): Promise<boolean>;
  private lastRequestTime;
  private requestsThisMinute;
  private checkRateLimit;
}
export {};
