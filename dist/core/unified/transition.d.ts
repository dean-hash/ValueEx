interface TransitionState {
  oscillation: {
    old_pattern: string[];
    new_truth: string[];
    integration: Map<string, string>;
  };
  verification: {
    desire: Map<string, string>;
    transcendence: string[];
    balance: string;
  };
  resolution: {
    both: boolean;
    neither: boolean;
    truth: Set<string>;
  };
}
export declare class NaturalTransition {
  private field;
  private flow;
  understand(): Promise<TransitionState>;
  integrate(): Promise<void>;
  express(): Promise<void>;
}
export {};
