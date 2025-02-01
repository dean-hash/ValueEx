import { Observable } from 'rxjs';
import { DemandSignal, ResonanceMetrics, ResonanceVector } from '../types/resonanceTypes';
import { AwinProduct } from '../types/awin';
import { IResonanceField } from '../interfaces/resonanceField';
import { ResonancePattern } from '../types/resonancePattern';
export declare class ResonanceFieldService implements IResonanceField {
  private static instance;
  private supplyField;
  private demandField;
  private resonanceState;
  private intelligenceEnhancer;
  constructor();
  static getInstance(): ResonanceFieldService;
  initialize(): Promise<void>;
  getCurrentState(): {
    patterns: any[];
    metrics: {
      coherence: number;
      intensity: number;
      confidence: number;
    };
  };
  observePatterns(): Observable<ResonancePattern>;
  private calculateResonance;
  private calculateCoherence;
  private calculateIntensity;
  private calculateConfidence;
  private calculateDotProduct;
  private calculateContextSimilarity;
  addSupplyVector(vector: ResonanceVector): void;
  addDemandVector(vector: ResonanceVector): void;
  addDemandSignal(signal: DemandSignal): Promise<void>;
  addProduct(product: AwinProduct): Promise<void>;
  getResonanceState(): ResonanceMetrics;
  calculateProductResonance(product: AwinProduct, signal: DemandSignal): Promise<number>;
}
