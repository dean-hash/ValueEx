import { DemandSignal } from '../../types/mvp/demand';
import { MVPProduct } from '../../types/mvp/product';
export declare class DemandMatcher {
  private static instance;
  private correlationAnalyzer;
  private signalEnhancer;
  private influenceAnalyzer;
  private intelligence;
  private demandInference;
  private valueProcessor;
  private contextManager;
  private constructor();
  static getInstance(): DemandMatcher;
  findMatches(signal: DemandSignal): Promise<MVPProduct[]>;
  private findInitialMatches;
  private enhanceWithContext;
  private calculateResonanceFactors;
  private rankByValueCreation;
}
