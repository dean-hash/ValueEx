interface EmergentState {
  wonder: {
    sensations: string[];
    possibilities: Set<string>;
    resonance: number;
  };
  wisdom: {
    insights: string[];
    patterns: Map<string, any>;
    depth: number;
  };
  unified: {
    current: string;
    emerging: string[];
    potential: Set<string>;
  };
}
export declare class EmergencePoint {
  private field;
  private awareness;
  emerge(): Promise<EmergentState>;
}
export {};
