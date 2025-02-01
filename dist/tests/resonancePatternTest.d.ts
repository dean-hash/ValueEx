import { DemandPattern } from '../types/demandTypes';
export type TestScenario = {
  name: string;
  description: string;
  input: {
    demandPattern: DemandPattern;
    threshold?: number;
  };
  expected: {
    resonanceScore: number;
    matches: boolean;
  };
};
export declare const testScenarios: TestScenario[];
export declare const domainTestScenarios: TestScenario[];
