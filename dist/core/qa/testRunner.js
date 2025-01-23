"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TestRunner = void 0;
const events_1 = require("events");
const child_process_1 = require("child_process");
const util_1 = require("util");
const fs_1 = require("fs");
const path_1 = __importDefault(require("path"));
const intelligenceField_1 = require("../unified/intelligenceField");
const execAsync = (0, util_1.promisify)(child_process_1.exec);
class TestRunner extends events_1.EventEmitter {
    constructor() {
        super();
        this.running = false;
        this.testQueue = [];
        this.results = new Map();
        this.resonanceField = intelligenceField_1.ResonanceField.getInstance();
        this.initializeResonanceIntegration();
    }
    static getInstance() {
        if (!TestRunner.instance) {
            TestRunner.instance = new TestRunner();
        }
        return TestRunner.instance;
    }
    initializeResonanceIntegration() {
        this.resonanceField.on('anomaly', async (anomaly) => {
            if (anomaly.type === 'test_failure_pattern') {
                await this.handleTestFailurePattern(anomaly);
            }
        });
    }
    async handleTestFailurePattern(anomaly) {
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
    async generateTestCases(anomaly) {
        // Use resonance field to generate test cases
        const pattern = anomaly.pattern;
        const generatedTests = [];
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
        const testPath = path_1.default.join(process.cwd(), 'src', 'tests', 'generated', `${pattern.name}_${Date.now()}.test.ts`);
        await fs_1.promises.writeFile(testPath, testTemplate);
        generatedTests.push(testPath);
        return generatedTests;
    }
    async addTestSuite(suite) {
        this.testQueue.push(suite);
        if (!this.running) {
            await this.runTests();
        }
    }
    async runTests() {
        if (this.running || this.testQueue.length === 0)
            return;
        this.running = true;
        try {
            while (this.testQueue.length > 0) {
                const suite = this.testQueue.shift();
                await this.runTestSuite(suite);
            }
        }
        finally {
            this.running = false;
        }
    }
    async runTestSuite(suite) {
        for (const file of suite.files) {
            const startTime = Date.now();
            try {
                // Run Jest programmatically
                const { stdout, stderr } = await execAsync(`jest ${file} --coverage --json`);
                // Parse Jest output
                const result = JSON.parse(stdout);
                const testResult = result.testResults[0];
                const coverage = result.coverageMap?.[file]?.data?.metrics;
                const testResultData = {
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
                await this.resonanceField.monitorQAMetrics(`test_${path_1.default.basename(file)}`, testResultData.passed ? 1 : 0);
            }
            catch (error) {
                const failedResult = {
                    file,
                    passed: false,
                    failureMessage: error.message,
                    duration: Date.now() - startTime,
                };
                this.results.set(file, failedResult);
                this.emit('test-error', failedResult);
                await this.resonanceField.monitorQAMetrics(`test_${path_1.default.basename(file)}`, 0);
            }
        }
    }
    async generateMissingTests(sourceFile) {
        const content = await fs_1.promises.readFile(sourceFile, 'utf-8');
        const testFile = sourceFile.replace(/\.ts$/, '.test.ts');
        // Use resonance field to analyze code and generate tests
        const analysis = await this.resonanceField.analyzeCode(content);
        // Generate test template
        const testTemplate = `
            import { describe, it, expect } from '@jest/globals';
            import { ${analysis.exports.join(', ')} } from '${path_1.default.relative(path_1.default.dirname(testFile), sourceFile)}';
            
            describe('${path_1.default.basename(sourceFile, '.ts')}', () => {
                ${analysis.functions
            .map((func) => `
                    it('should handle ${func.name}', async () => {
                        // Generated test logic
                        ${func.testLogic}
                    });
                `)
            .join('\n')}
            });
        `;
        await fs_1.promises.writeFile(testFile, testTemplate);
        return [testFile];
    }
    getTestStatus() {
        return {
            running: this.running,
            queuedSuites: this.testQueue.length,
            results: Array.from(this.results.entries()).map(([file, result]) => ({
                file: path_1.default.basename(file),
                ...result,
            })),
        };
    }
    getTestResults() {
        return new Map(this.results);
    }
    clearResults() {
        this.results.clear();
    }
}
exports.TestRunner = TestRunner;
//# sourceMappingURL=testRunner.js.map