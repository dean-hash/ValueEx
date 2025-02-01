import { ValueMetrics } from '../../types/metrics';
import { Observable } from 'rxjs';
interface OptimizationRequest {
  source: string;
  value: number;
  marketConditions?: any;
}
interface OptimizedValue {
  source: string;
  originalValue: number;
  optimizedValue: number;
  confidence: number;
  action: string;
}
export declare class ValueOptimizer {
  private static instance;
  private realTimeSignals;
  private optimizationStream;
  private valueStream;
  static getInstance(): ValueOptimizer;
  private constructor();
  private initializeStreams;
  optimizeValue(productId: string, context: any): Promise<ValueMetrics>;
  private computeOptimalMetrics;
  private calculateMarketAdjustments;
  private predictMarketImpact;
  private predictEngagement;
  private predictConversion;
  private calculateMarketFit;
  private calculateGrowthPotential;
  private getContextualWeight;
  private computeWeightedDirection;
  private computePriceAdjustment;
  private computeCommissionAdjustment;
  private computeOptimalTiming;
  private getMarketElasticity;
  private getPartnerElasticity;
  private optimize;
  private determineAction;
  private executeOptimization;
  private createValue;
  optimizeValueWithRequest(request: OptimizationRequest): Promise<void>;
  observeOptimizations(): Observable<OptimizedValue>;
}
export {};
