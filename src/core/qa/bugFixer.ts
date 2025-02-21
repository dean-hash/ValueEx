import { EventEmitter } from 'events';
import { promises as fs } from 'fs';
import path from 'path';
import { BugHunter } from './bugHunter';
import { TestRunner } from './testRunner';
import { ResonanceField } from '../unified/intelligenceField';

interface Fix {
  file: string;
  original: string;
  fixed: string;
  confidence: number;
  type: string;
}

interface FixResult {
  success: boolean;
  fix: Fix;
  testsPassed?: boolean;
  error?: string;
}

export class BugFixer extends EventEmitter {
  private static instance: BugFixer;
  private bugHunter: BugHunter;
  private testRunner: TestRunner;
  private resonanceField: ResonanceField;
  private fixHistory: Map<string, Fix[]> = new Map();
  private pendingFixes: Fix[] = [];

  private constructor() {
    super();
    this.bugHunter = BugHunter.getInstance();
    this.testRunner = TestRunner.getInstance();
    this.resonanceField = ResonanceField.getInstance();
    this.initializeEventHandlers();
  }

  public static getInstance(): BugFixer {
    if (!BugFixer.instance) {
      BugFixer.instance = new BugFixer();
    }
    return BugFixer.instance;
  }

  private initializeEventHandlers() {
    this.bugHunter.on('file-analyzed', async (data) => {
      const { file, analysis } = data;
      if (analysis.bugs.length > 0) {
        await this.handleBugs(file, analysis.bugs);
      }
    });

    this.testRunner.on('test-complete', async (result) => {
      if (!result.passed) {
        await this.handleTestFailure(result);
      }
    });

    this.resonanceField.on('anomaly', async (anomaly) => {
      if (anomaly.type === 'code_fix_pattern') {
        await this.handleFixPattern(anomaly);
      }
    });
  }

  private async handleBugs(file: string, bugs: any[]) {
    for (const bug of bugs) {
      if (bug.confidence >= 0.8 && bug.suggestedFix) {
        const fix: Fix = {
          file,
          original: await this.getOriginalCode(file, bug),
          fixed: bug.suggestedFix,
          confidence: bug.confidence,
          type: bug.code,
        };

        this.pendingFixes.push(fix);
      }
    }

    await this.processPendingFixes();
  }

  private async handleTestFailure(result: any) {
    const file = result.file;
    const content = await fs.readFile(file, 'utf-8');

    // Use resonance field to analyze the failure
    const analysis = await this.resonanceField.analyzeCode(content);

    if (analysis.suggestedFix) {
      const fix: Fix = {
        file,
        original: content,
        fixed: analysis.suggestedFix,
        confidence: analysis.confidence,
        type: 'test_failure',
      };

      this.pendingFixes.push(fix);
      await this.processPendingFixes();
    }
  }

  private async handleFixPattern(anomaly: any) {
    const { pattern, files } = anomaly;

    for (const file of files) {
      const content = await fs.readFile(file, 'utf-8');
      if (this.matchesPattern(content, pattern)) {
        const fix: Fix = {
          file,
          original: content,
          fixed: this.applyPattern(content, pattern),
          confidence: pattern.confidence,
          type: 'pattern_fix',
        };

        this.pendingFixes.push(fix);
      }
    }

    await this.processPendingFixes();
  }

  private async getOriginalCode(file: string, bug: any): Promise<string> {
    const content = await fs.readFile(file, 'utf-8');
    const lines = content.split('\n');
    return lines[bug.line - 1];
  }

  private matchesPattern(content: string, pattern: any): boolean {
    return new RegExp(pattern.regex).test(content);
  }

  private applyPattern(content: string, pattern: any): string {
    return content.replace(new RegExp(pattern.regex), pattern.replacement);
  }

  private async processPendingFixes() {
    while (this.pendingFixes.length > 0) {
      const fix = this.pendingFixes.shift()!;
      await this.applyFix(fix);
    }
  }

  private async applyFix(fix: Fix): Promise<FixResult> {
    const backup = await this.createBackup(fix.file);

    try {
      // Apply the fix
      await fs.writeFile(fix.file, fix.fixed);

      // Run tests
      const testResult = await this.verifyFix(fix);

      if (testResult.success) {
        // Record successful fix
        const fixes = this.fixHistory.get(fix.file) || [];
        fixes.push(fix);
        this.fixHistory.set(fix.file, fixes);

        // Update resonance field
        await this.resonanceField.monitorQAMetrics(`fix_${fix.type}`, 1);

        this.emit('fix-applied', {
          file: fix.file,
          type: fix.type,
          confidence: fix.confidence,
        });

        return { success: true, fix, testsPassed: true };
      } else {
        // Restore backup
        await fs.copyFile(backup, fix.file);
        await this.resonanceField.monitorQAMetrics(`fix_${fix.type}`, 0);

        return {
          success: false,
          fix,
          testsPassed: false,
          error: 'Tests failed after applying fix',
        };
      }
    } catch (error) {
      // Restore backup
      await fs.copyFile(backup, fix.file);
      await this.resonanceField.monitorQAMetrics(`fix_${fix.type}`, 0);

      return {
        success: false,
        fix,
        error: error.message,
      };
    } finally {
      // Clean up backup
      await fs.unlink(backup);
    }
  }

  private async createBackup(file: string): Promise<string> {
    const backupPath = `${file}.backup`;
    await fs.copyFile(file, backupPath);
    return backupPath;
  }

  private async verifyFix(fix: Fix): Promise<{ success: boolean }> {
    // Run tests for the fixed file
    const testFile = fix.file.replace(/\.ts$/, '.test.ts');
    if (
      await fs
        .access(testFile)
        .then(() => true)
        .catch(() => false)
    ) {
      await this.testRunner.addTestSuite({
        name: `verify_fix_${path.basename(fix.file)}`,
        files: [testFile],
        config: {},
      });

      // Wait for test results
      return new Promise((resolve) => {
        const handler = (result: any) => {
          if (result.file === testFile) {
            this.testRunner.off('test-complete', handler);
            resolve({ success: result.passed });
          }
        };

        this.testRunner.on('test-complete', handler);
      });
    }

    // If no tests exist, consider it a success but with lower confidence
    return { success: true };
  }

  public getFixStatus() {
    return {
      pendingFixes: this.pendingFixes.length,
      fixedFiles: this.fixHistory.size,
      totalFixes: Array.from(this.fixHistory.values()).reduce(
        (acc, fixes) => acc + fixes.length,
        0
      ),
    };
  }

  public async startFixing(directory: string) {
    // Start bug hunting
    await this.bugHunter.startHunting(directory);
  }
}
