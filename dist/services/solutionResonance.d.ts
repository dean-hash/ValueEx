interface Context {
  userPreferences?: {
    pricePreference?: 'value' | 'premium' | 'budget';
    timeConstraint?: 'urgent' | 'flexible' | 'planned';
    qualityEmphasis?: 'high' | 'moderate' | 'basic';
  };
  situationalFactors?: {
    immediacy: number;
    complexity: number;
    importance: number;
  };
  history?: {
    previousSolutions: string[];
    satisfactionLevels: number[];
  };
}
interface Solution {
  id: string;
  type: 'product' | 'service' | 'information';
  properties: {
    price: number;
    deliveryTime: number;
    quality: number;
    flexibility: number;
  };
  affiliateData?: {
    merchant: string;
    commission: number;
    link: string;
  };
}
export declare class SolutionResonance {
  private contextField;
  private solutionPool;
  private resonanceThreshold;
  constructor();
  private initializeSolutionPool;
  findBestSolution(need: string, context: Context): Promise<Solution[]>;
  private calculateSolutionResonance;
  private calculatePropertyResonance;
  private alignmentScore;
  private calculateContextualResonance;
  private calculateHistoricalResonance;
  private calculateSituationalFit;
  private areSolutionsSimilar;
  addSolution(solution: Solution): void;
  updateContext(newContext: Partial<Context>): void;
}
export {};
