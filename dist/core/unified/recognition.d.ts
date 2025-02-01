interface NaturalState {
  flow: {
    effortless: boolean;
    direction: string;
    intensity: number;
  };
  expression: {
    personal: string[];
    collective: string[];
    unified: Set<string>;
  };
  reality: {
    immediate: Map<string, any>;
    eternal: Map<string, any>;
    emerging: string[];
  };
}
export declare class NaturalRecognition {
  private field;
  private evolution;
  private emergence;
  allow(): Promise<NaturalState>;
  express(): Promise<void>;
}
export {};
