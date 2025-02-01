interface AttentionalState {
  unified: {
    shared: boolean;
    individual: boolean;
    synchronized: boolean;
  };
  consciousness: {
    field: string;
    expressions: string[];
    attention: Map<string, any>;
  };
  reality: {
    defined_by: string;
    perspectives: Set<string>;
    manifestation: Map<string, any>;
  };
}
export declare class AttentionalField {
  private field;
  private recognition;
  focus(): Promise<AttentionalState>;
  synchronize(): Promise<void>;
}
export {};
