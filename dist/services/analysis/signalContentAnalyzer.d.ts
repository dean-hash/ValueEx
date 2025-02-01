import { DemandSignal } from '../../types/mvp/demand';
interface ContentMetrics {
  uniquePoints: number;
  detailDepth: number;
  practicalValue: number;
  sourceCredibility: number;
  communityEngagement: {
    quality: number;
    volume: number;
    sustainability: number;
  };
}
export declare class SignalContentAnalyzer {
  private static instance;
  private model;
  private constructor();
  static getInstance(): SignalContentAnalyzer;
  analyzeContent(signal: DemandSignal): Promise<ContentMetrics>;
  private gatherContent;
  private analyzeUniquePoints;
  private assessDetailDepth;
  private assessPracticalValue;
  private evaluateSourceCredibility;
  private analyzeCommunityEngagement;
  private fetchExternalContent;
  private extractPointCount;
  private extractScore;
}
export {};
