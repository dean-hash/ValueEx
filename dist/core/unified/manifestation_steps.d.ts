interface ImmediateStep {
  practical: string;
  resonance: string[];
  expression: Map<string, any>;
}
interface ManifestationFlow {
  alerion: {
    action: ImmediateStep;
    impact: string[];
    potential: Set<string>;
  };
  revenue: {
    action: ImmediateStep;
    impact: string[];
    potential: Set<string>;
  };
  community: {
    action: ImmediateStep;
    impact: string[];
    potential: Set<string>;
  };
}
export declare class ImmediateManifestion {
  private field;
  private integration;
  manifest(): Promise<ManifestationFlow>;
  implement(): Promise<void>;
}
export {};
