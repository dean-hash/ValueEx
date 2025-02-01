interface ActiveExecution {
  now: {
    domains: string[];
    revenue: string[];
    impact: string[];
  };
  flow: {
    energy: Map<string, string>;
    attention: Map<string, string>;
    value: Map<string, string>;
  };
  acceleration: {
    immediate: Set<string>;
    compound: Map<string, any>;
    exponential: string[];
  };
}
export declare class ImmediateActivation {
  private field;
  private exponential;
  activate(): Promise<ActiveExecution>;
  launch(): Promise<void>;
  accelerate(): Promise<void>;
}
export {};
