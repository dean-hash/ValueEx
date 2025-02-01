import { DemandSignal } from '../../types/mvp/demand';
interface InfluenceMetrics {
  expertiseMatch: number;
  communityEngagement: number;
  valueAlignment: boolean;
  expertise: {
    domainKnowledge: number;
    practicalExperience: number;
    credibility: number;
  };
  community: {
    interactionQuality: number;
    responseRate: number;
    impactEvidence: number;
  };
  values: {
    authenticContent: number;
    transparentDisclosure: number;
    communityBenefit: number;
  };
}
export declare class InfluenceAnalyzer {
  private static instance;
  private constructor();
  static getInstance(): InfluenceAnalyzer;
  analyzeInfluence(signal: DemandSignal): Promise<InfluenceMetrics>;
  private evaluateExpertise;
  private analyzeCommunity;
  private assessValues;
  private calculateExpertiseMatch;
  private calculateCommunityEngagement;
  private determineValueAlignment;
  validateValueCreation(signal: DemandSignal): Promise<{
    isCreatingValue: boolean;
    metrics: {
      communityBenefit: number;
      practicalUtility: number;
      sustainableGrowth: number;
    };
  }>;
  private measureCommunityBenefit;
  private assessPracticalUtility;
  private evaluateGrowthPattern;
}
export {};
