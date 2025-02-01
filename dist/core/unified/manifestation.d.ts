interface Manifestation {
  immediate: {
    revenue: {
      source: string;
      amount: number;
      destination: string;
    };
  };
  parallel: {
    impact: string[];
    connections: Map<string, any>;
    potential: Set<string>;
  };
  unified: {
    current: any;
    emerging: any[];
    patterns: Set<string>;
  };
}
export declare class RealityManifestor {
  private field;
  private revenue;
  manifest(intention: string): Promise<Manifestation>;
}
export {};
