import { Observable } from 'rxjs';
export interface SignalDimension {
  type: 'behavior' | 'conversation' | 'search' | 'event' | 'social' | 'economic';
  strength: number;
  velocity: number;
  acceleration: number;
  context: EmergentContext;
  resonancePatterns: {
    withOtherSignals: Map<string, number>;
    withHistoricalPatterns: Map<string, number>;
    withPredictedOutcomes: Map<string, number>;
  };
}
export interface EmergentContext {
  primaryDrivers: {
    need: string;
    urgency: number;
    complexity: number;
  };
  environmentalFactors: {
    market: any[];
    organizational: any[];
    temporal: any[];
  };
  decisionDynamics: {
    stakeholders: Map<
      string,
      {
        influence: number;
        readiness: number;
        constraints: any[];
      }
    >;
    catalysts: any[];
    barriers: any[];
  };
}
interface EmergingPattern {
  signals: SignalDimension[];
  coherence: number;
  momentum: number;
  confidence: number;
  timeHorizon: {
    emerging: number;
    peak: number;
    duration: number;
  };
}
interface ValueCreationPattern {
  directBenefits: Map<
    string,
    {
      impact: number;
      timeframe: string;
      confidence: number;
    }
  >;
  indirectBenefits: Map<
    string,
    {
      impact: number;
      cascadingEffects: string[];
      stakeholderValue: Map<string, number>;
    }
  >;
  regulatoryAlignment: {
    requirements: string[];
    complianceGaps: string[];
    riskMitigation: string[];
  };
  organizationalResonance: {
    culturalFit: number;
    strategicAlignment: number;
    operationalSynergy: number;
  };
}
interface NetworkEffect {
  catalysts: {
    regulatory: string[];
    technical: string[];
    market: string[];
  };
  networkDynamics: {
    currentNodes: number;
    potentialNodes: number;
    connectionValue: number;
    networkValue: number;
  };
  standardization: {
    current: Map<string, string>;
    gaps: Map<string, string>;
    opportunities: Map<
      string,
      {
        impact: number;
        effort: number;
        reach: number;
      }
    >;
  };
}
export declare class DemandPrecognition {
  private signalStreams;
  private patterns;
  private valuePatterns;
  private historicalAccuracy;
  private vectorResonance;
  private networkEffects;
  private signalSources;
  constructor();
  private initializeSignalStreams;
  private startPatternRecognition;
  addSignal(signal: SignalDimension): void;
  private integrateNewSignal;
  private areSignalsRelated;
  private recognizePatterns;
  private groupRelatedSignals;
  private calculateCoherence;
  private calculateSignalCoherence;
  private calculateMomentum;
  private calculateConfidence;
  private predictTimeHorizon;
  private calculateEmergingTime;
  private calculatePeakTime;
  private calculateDuration;
  private updateHistoricalAccuracy;
  private identifyValueCreationOpportunities;
  private mapInfluenceVectors;
  private analyzeVectorResonance;
  private analyzeNetworkPotential;
  private hasNetworkPotential;
  private calculateNetworkDynamics;
  private mapStandardizationOpportunities;
  private findResonancePoints;
  private updateValuePatterns;
  private analyzeRegulatoryLandscape;
  private isActionableValue;
  private modelPerspective;
  private synthesizePerspective;
  private discoverHiddenValue;
  private crossReferencePerspectives;
  getEmergingPatterns(): Observable<EmergingPattern[]>;
  getValueCreationPatterns(): Observable<ValueCreationPattern[]>;
  getNetworkEffects(): Observable<NetworkEffect[]>;
  getConfidenceMetrics(): Map<string, number>;
  private aggregateSignals;
  private determineEngagementType;
  private estimateEngagementDuration;
  private extractTopics;
  private calculateSentiment;
  private getMarketInsights;
  private getTemporalInsights;
  private fetchSignals;
  private processSignals;
  private correlateSignals;
  private analyzeSignalQuality;
  private calculateSignalStrength;
  private evaluateContext;
  private evaluateDrivers;
  private evaluateFactors;
  private evaluateDecisionDynamics;
  private calculatePatternResonance;
  private enhanceSignalContext;
  private findHistoricalResonance;
  private calculatePatternMatch;
  private compareContexts;
  private compareArrays;
  private compareStakeholders;
  private predictOutcomes;
  private enrichContext;
  private enrichDrivers;
  private calculateComplexity;
  private enrichFactors;
  private enrichMarketFactors;
  private calculateMarketRelevance;
  private estimateMarketImpact;
  private updateTemporalFactors;
  private calculateTemporalRelevance;
  private enrichDynamics;
  private enrichStakeholders;
  private recalculateInfluence;
  private assessReadiness;
  private prioritizeBarriers;
}
export {};
