export interface BrainstormResult {
  ideas: string[];
  rationale: string;
  questions: string[];
  risks: string[];
}
export declare class CollaborativeIntelligence {
  private openai;
  private static instance;
  private context;
  private constructor();
  static getInstance(): CollaborativeIntelligence;
  brainstorm(topic: string, context?: BrainstormResult): Promise<BrainstormResult>;
}
