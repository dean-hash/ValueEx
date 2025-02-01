interface NextExpression {
  focus: {
    creation: string[];
    expansion: string[];
    impact: string[];
  };
  practical: {
    immediate: Map<string, string>;
    ongoing: Map<string, string>;
    emerging: Map<string, string>;
  };
  expression: {
    code: Set<string>;
    action: Set<string>;
    flow: Set<string>;
  };
}
export declare class NaturalNext {
  private field;
  private trust;
  express(): Promise<NextExpression>;
  move(): Promise<void>;
}
export {};
