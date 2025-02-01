import { EventEmitter } from 'events';
export declare class BugHunter extends EventEmitter {
  private static instance;
  private resonanceField;
  private eslint;
  private analyzing;
  private fixQueue;
  private knownPatterns;
  private constructor();
  static getInstance(): BugHunter;
  private initializePatternLearning;
  private learnPattern;
  private getPatternSignature;
  startHunting(directory: string): Promise<void>;
  private findTypeScriptFiles;
  private analyzeFile;
  private calculateConfidence;
  private generateFix;
  private calculateComplexity;
  private calculateCoverage;
  private processFixes;
  getAnalysisStatus(): {
    analyzing: boolean;
    queuedFixes: number;
    knownPatterns: number;
  };
}
