import { EventEmitter } from 'events';
interface TestResult {
  file: string;
  passed: boolean;
  failureMessage?: string;
  coverage?: {
    statements: number;
    branches: number;
    functions: number;
    lines: number;
  };
  duration: number;
}
interface TestSuite {
  name: string;
  files: string[];
  config: any;
}
export declare class TestRunner extends EventEmitter {
  private static instance;
  private resonanceField;
  private running;
  private testQueue;
  private results;
  private constructor();
  static getInstance(): TestRunner;
  private initializeResonanceIntegration;
  private handleTestFailurePattern;
  private generateTestCases;
  addTestSuite(suite: TestSuite): Promise<void>;
  private runTests;
  private runTestSuite;
  generateMissingTests(sourceFile: string): Promise<string[]>;
  getTestStatus(): {
    running: boolean;
    queuedSuites: number;
    results: {
      file: string;
      passed: boolean;
      failureMessage?: string;
      coverage?: {
        statements: number;
        branches: number;
        functions: number;
        lines: number;
      };
      duration: number;
    }[];
  };
  getTestResults(): Map<string, TestResult>;
  clearResults(): void;
}
export {};
