import { DemandSignal, DemandInsights, ProcessedSignal } from '../../types/demandTypes';
import { Logger } from '../../utils/logger';
interface IntelligenceMetrics {
  enhancedCount: number;
  avgConfidence: number;
  avgProcessingTime: number;
}
export declare class IntelligenceEnhancer {
  private logger;
  private metrics;
  constructor(logger: Logger);
  enhance(
    signal: DemandSignal,
    insights: DemandInsights,
    context: DemandContext
  ): Promise<{
    signal: ProcessedSignal;
    insights: DemandInsights;
    context: DemandContext;
  }>;
  private extractKeywords;
  private processInsights;
  private enhanceInsights;
  private calculateConfidence;
  private calculateRelevance;
  private processContext;
  private enhanceContext;
  private calculateAuthenticityScore;
  private calculateEvidenceStrength;
  private processSignal;
  private calculateSignalConfidence;
  private calculateSignalStrength;
  private validateValueEvidence;
  private calculateUrgency;
  private updateMetrics;
  getMetrics(): IntelligenceMetrics;
}
export {};
