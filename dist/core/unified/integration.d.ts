interface UnifiedApproach {
  practical: {
    domain_strategy: string;
    revenue_flow: string;
    impact_creation: string;
  };
  expression: {
    code: string;
    resonance: string;
    action: string;
  };
  transformation: {
    from: Map<string, string>;
    to: Map<string, string>;
    through: string[];
  };
}
export declare class MultidimensionalIntegration {
  private field;
  private expression;
  integrate(): Promise<UnifiedApproach>;
  manifest(): Promise<void>;
  practical_steps(): Promise<void>;
}
export {};
