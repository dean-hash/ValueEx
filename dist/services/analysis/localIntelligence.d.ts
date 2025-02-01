import { ScrapedDemandSignal } from '../../types/demandTypes';
export declare class LocalIntelligence {
  private static instance;
  private modelName;
  private constructor();
  static getInstance(): LocalIntelligence;
  enrichSignal(signal: ScrapedDemandSignal): Promise<ScrapedDemandSignal>;
  private analyzeSignal;
  private buildPrompt;
  private queryLocalModel;
  private parseInsights;
  private calculateConfidence;
}
