import { DemandSignal } from '../../types/mvp/demand';
interface ValueScore {
  authenticity: number;
  utility: number;
  sustainability: number;
}
export declare class BootstrapOptimizer {
  private static instance;
  private searchCache;
  private constructor();
  static getInstance(): BootstrapOptimizer;
  findValueOpportunity(signal: DemandSignal): Promise<{
    score: ValueScore;
    actions: string[];
    resources: string[];
  }>;
  private scoreValue;
  private scoreAuthenticity;
  private scoreUtility;
  private scoreSustainability;
  private generateActions;
  private findFreeResources;
  validateValue(signal: DemandSignal): Promise<{
    isViable: boolean;
    nextSteps: string[];
    risks: string[];
  }>;
}
export {};
