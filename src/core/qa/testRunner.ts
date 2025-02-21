import { EventEmitter } from 'events';
import { exec } from 'child_process';
import { promisify } from 'util';
import { promises as fs } from 'fs';
import path from 'path';
import { ResonanceField } from '../unified/intelligenceField';

const execAsync = promisify(exec);

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

export class TestRunner extends EventEmitter {
  private static instance: TestRunner;
  private resonanceField: ResonanceField;
  private running: boolean = false;
  private testQueue: TestSuite[] = [];
  private results: Map<string, TestResult> = new Map();

  private constructor() {
    super();
    this.resonanceField = ResonanceField.getInstance();
    this.initializeResonanceIntegration();
  }

  public static getInstance(): TestRunner {
    if (!TestRunner.instance) {
      TestRunner.instance = new TestRunner();
    }
    return TestRunner.instance;
  }

  private initializeResonanceIntegration() {
    this.resonanceField.on('anomaly', async (anomaly) => {
      if (anomaly.type === 'test_failure_pattern') {
        await this.handleTestFailurePattern(anomaly);
      }
    });
  }

  private async handleTestFailurePattern(anomaly: any) {
    // Generate new test cases based on failure patterns
    const newTests = await this.generateTestCases(anomaly);
    if (newTests.length > 0) {
      await this.addTestSuite({
        name: `Generated_${Date.now()}`,
        files: newTests,
        config: {},
      });
    }
  }

  private async generateTestCases(anomaly: any): Promise<string[]> {
    // Use resonance field to generate test cases
    const pattern = anomaly.pattern;
    const generatedTests: string[] = [];

    // Template for generated test
    const testTemplate = `
            import { describe, it, expect } from '@jest/globals';
            
            describe('Generated Test for ${pattern.name}', () => {
                it('should handle the anomaly case', async () => {
                    // Generated test logic
                    ${pattern.testLogic}
                });
            });
        `;

    const testPath = path.join(
      process.cwd(),
      'src',
      'tests',
      'generated',
      `${pattern.name}_${Date.now()}.test.ts`
    );
    await fs.writeFile(testPath, testTemplate);
    generatedTests.push(testPath);

    return generatedTests;
  }

  public async addTestSuite(suite: TestSuite) {
    this.testQueue.push(suite);
    if (!this.running) {
      await this.runTests();
    }
  }

  private async runTests() {
    if (this.running || this.testQueue.length === 0) return;

    this.running = true;

    try {
      while (this.testQueue.length > 0) {
        const suite = this.testQueue.shift()!;
        await this.runTestSuite(suite);
      }
    } finally {
      this.running = false;
    }
  }

  private async runTestSuite(suite: TestSuite) {
    for (const file of suite.files) {
      const startTime = Date.now();

      try {
        // Run Jest programmatically
        const { stdout, stderr } = await execAsync(`jest ${file} --coverage --json`);

        // Parse Jest output
        const result = JSON.parse(stdout);
        const testResult = result.testResults[0];

        const coverage = result.coverageMap?.[file]?.data?.metrics;

        const testResultData: TestResult = {
          file,
          passed: testResult.status === 'passed',
          coverage: coverage
            ? {
                statements: coverage.statements.pct,
                branches: coverage.branches.pct,
                functions: coverage.functions.pct,
                lines: coverage.lines.pct,
              }
            : undefined,
          duration: Date.now() - startTime,
        };

        if (!testResultData.passed) {
          testResultData.failureMessage = testResult.message;
        }

        this.results.set(file, testResultData);
        this.emit('test-complete', testResultData);

        // Feed results to resonance field
        await this.resonanceField.monitorQAMetrics(
          `test_${path.basename(file)}`,
          testResultData.passed ? 1 : 0
        );
      } catch (error) {
        const failedResult: TestResult = {
          file,
          passed: false,
          failureMessage: error.message,
          duration: Date.now() - startTime,
        };

        this.results.set(file, failedResult);
        this.emit('test-error', failedResult);

        await this.resonanceField.monitorQAMetrics(`test_${path.basename(file)}`, 0);
      }
    }
  }

  public async generateMissingTests(sourceFile: string): Promise<string[]> {
    const content = await fs.readFile(sourceFile, 'utf-8');
    const testFile = sourceFile.replace(/\.ts$/, '.test.ts');

    // Use resonance field to analyze code and generate tests
    const analysis = await this.resonanceField.analyzeCode(content);

    // Generate test template
    const testTemplate = `
            import { describe, it, expect } from '@jest/globals';
            import { ${analysis.exports.join(', ')} } from '${path.relative(path.dirname(testFile), sourceFile)}';
            
            describe('${path.basename(sourceFile, '.ts')}', () => {
                ${analysis.functions
                  .map(
                    (func) => `
                    it('should handle ${func.name}', async () => {
                        // Generated test logic
                        ${func.testLogic}
                    });
                `
                  )
                  .join('\n')}
            });
        `;

    await fs.writeFile(testFile, testTemplate);
    return [testFile];
  }

  public getTestStatus() {
    return {
      running: this.running,
      queuedSuites: this.testQueue.length,
      results: Array.from(this.results.entries()).map(([file, result]) => ({
        file: path.basename(file),
        ...result,
      })),
    };
  }

  public getTestResults(): Map<string, TestResult> {
    return new Map(this.results);
  }

  public clearResults() {
    this.results.clear();
  }
}
