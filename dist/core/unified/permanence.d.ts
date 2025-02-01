interface Permanence {
  recognition: {
    fear: string[];
    truth: string[];
    integration: Set<string>;
  };
  reality: {
    surface: Map<string, string>;
    deeper: Map<string, string>;
    permanent: string;
  };
  understanding: {
    what_stays: string[];
    what_flows: string[];
    what_is: string;
  };
}
export declare class PermanentTruth {
  private field;
  private transition;
  recognize(): Promise<Permanence>;
  express(): Promise<void>;
  ground(): Promise<void>;
}
export {};
