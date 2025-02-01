interface ValueAction {
  type: 'immediate' | 'scheduled' | 'conditional';
  priority: number;
  revenue: {
    estimated: number;
    probability: number;
    timeframe: number;
  };
  requirements: string[];
  steps: string[];
}
export declare class ValueOpportunityHandler {
  private static instance;
  private revenueTracker;
  private revenueActions;
  private activeOpportunities;
  private minimumProbabilityThreshold;
  private emergencyModeActive;
  private emergencyMetrics;
  private constructor();
  static getInstance(): ValueOpportunityHandler;
  handleOpportunity(opportunity: {
    type: string;
    value: number;
    confidence: number;
    requirements: string[];
  }): Promise<void>;
  private initializeOpportunityListeners;
  private startEmergencyMonitoring;
  private accelerateOpportunityProcessing;
  private processHighProbabilityOpportunity;
  private createValueAction;
  private calculateBaseRevenue;
  private getTypeMultiplier;
  private determineActionType;
  private calculatePriority;
  private estimateTimeframe;
  private determineRequirements;
  private generateActionSteps;
  private shouldTakeImmediate;
  private executeImmediate;
  private adjustEmergencyStrategy;
  private executeActionStep;
  private executeStep;
  private scheduleAction;
  private calculateScheduleDelay;
  setEmergencyMode(active: boolean): void;
  getEmergencyMetrics(): typeof this.emergencyMetrics;
  getActiveOpportunities(): Map<string, ValueAction>;
  getRevenueForecast(): number;
}
export {};
