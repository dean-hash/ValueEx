import { EventEmitter } from 'events';
import { ResonanceField } from '../unified/intelligenceField';
import * as ts from 'typescript';
import * as ESLint from 'eslint';
import { promises as fs } from 'fs';
import path from 'path';

interface BugReport {
  file: string;
  line: number;
  column: number;
  severity: 'error' | 'warning';
  message: string;
  code: string;
  suggestedFix?: string;
  confidence: number;
}

interface FileAnalysis {
  bugs: BugReport[];
  complexity: number;
  coverage: number;
  resonanceScore: number;
}

export class BugHunter extends EventEmitter {
  private static instance: BugHunter;
  private resonanceField: ResonanceField;
  private eslint: ESLint.ESLint;
  private analyzing: boolean = false;
  private fixQueue: BugReport[] = [];
  private knownPatterns: Map<string, number> = new Map();

  private constructor() {
    super();
    this.resonanceField = ResonanceField.getInstance();
    this.eslint = new ESLint.ESLint({
      fix: true,
      extensions: ['.ts', '.tsx'],
    });
    this.initializePatternLearning();
  }

  public static getInstance(): BugHunter {
    if (!BugHunter.instance) {
      BugHunter.instance = new BugHunter();
    }
    return BugHunter.instance;
  }

  private async initializePatternLearning() {
    this.resonanceField.on('anomaly', async (anomaly) => {
      if (anomaly.type === 'code_pattern') {
        await this.learnPattern(anomaly.pattern);
      }
    });
  }

  private async learnPattern(pattern: any) {
    const signature = this.getPatternSignature(pattern);
    const currentConfidence = this.knownPatterns.get(signature) || 0;
    this.knownPatterns.set(signature, Math.min(currentConfidence + 0.1, 1));
  }

  private getPatternSignature(pattern: any): string {
    return JSON.stringify(pattern);
  }

  public async startHunting(directory: string) {
    if (this.analyzing) return;
    this.analyzing = true;

    try {
      const files = await this.findTypeScriptFiles(directory);
      for (const file of files) {
        await this.analyzeFile(file);
      }

      // Process fix queue
      await this.processFixes();
    } finally {
      this.analyzing = false;
    }
  }

  private async findTypeScriptFiles(directory: string): Promise<string[]> {
    const files: string[] = [];

    async function walk(dir: string) {
      const entries = await fs.readdir(dir, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules') {
          await walk(fullPath);
        } else if (entry.isFile() && /\.tsx?$/.test(entry.name)) {
          files.push(fullPath);
        }
      }
    }

    await walk(directory);
    return files;
  }

  private async analyzeFile(filePath: string): Promise<FileAnalysis> {
    const content = await fs.readFile(filePath, 'utf-8');
    const bugs: BugReport[] = [];

    // Static analysis
    const sourceFile = ts.createSourceFile(filePath, content, ts.ScriptTarget.Latest, true);

    // ESLint analysis
    const eslintResults = await this.eslint.lintFiles([filePath]);

    // Convert ESLint results to bug reports
    for (const result of eslintResults) {
      for (const message of result.messages) {
        const bug: BugReport = {
          file: filePath,
          line: message.line,
          column: message.column,
          severity: message.severity === 2 ? 'error' : 'warning',
          message: message.message,
          code: message.ruleId || 'unknown',
          confidence: this.calculateConfidence(message),
        };

        if (message.fix) {
          bug.suggestedFix = this.generateFix(content, message.fix);
        }

        bugs.push(bug);
      }
    }

    // TypeScript compiler checks
    const program = ts.createProgram([filePath], {
      noEmit: true,
      target: ts.ScriptTarget.Latest,
      module: ts.ModuleKind.CommonJS,
    });

    const diagnostics = ts.getPreEmitDiagnostics(program);

    for (const diagnostic of diagnostics) {
      if (diagnostic.file && diagnostic.start) {
        const { line, character } = diagnostic.file.getLineAndCharacterOfPosition(diagnostic.start);

        bugs.push({
          file: filePath,
          line: line + 1,
          column: character + 1,
          severity: 'error',
          message: ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n'),
          code: `TS${diagnostic.code}`,
          confidence: 1,
        });
      }
    }

    // Calculate complexity and coverage
    const complexity = this.calculateComplexity(sourceFile);
    const coverage = await this.calculateCoverage(filePath);

    // Get resonance score
    const resonanceScore = await this.resonanceField.analyzeCode(content);

    const analysis: FileAnalysis = {
      bugs,
      complexity,
      coverage,
      resonanceScore,
    };

    // Emit analysis results
    this.emit('file-analyzed', {
      file: filePath,
      analysis,
    });

    // Queue high-confidence fixes
    bugs
      .filter((bug) => bug.confidence > 0.9 && bug.suggestedFix)
      .forEach((bug) => this.fixQueue.push(bug));

    return analysis;
  }

  private calculateConfidence(eslintMessage: ESLint.Linter.LintMessage): number {
    // Base confidence on rule severity and pattern recognition
    const severityConfidence = eslintMessage.severity === 2 ? 0.8 : 0.6;
    const patternConfidence = this.knownPatterns.get(eslintMessage.ruleId || '') || 0;

    return Math.max(severityConfidence, patternConfidence);
  }

  private generateFix(content: string, eslintFix: ESLint.Rule.Fix): string {
    const lines = content.split('\n');
    const fixedContent =
      content.slice(0, eslintFix.range[0]) + eslintFix.text + content.slice(eslintFix.range[1]);
    return fixedContent;
  }

  private calculateComplexity(sourceFile: ts.SourceFile): number {
    let complexity = 0;

    function visit(node: ts.Node) {
      switch (node.kind) {
        case ts.SyntaxKind.IfStatement:
        case ts.SyntaxKind.WhileStatement:
        case ts.SyntaxKind.ForStatement:
        case ts.SyntaxKind.ForInStatement:
        case ts.SyntaxKind.ForOfStatement:
        case ts.SyntaxKind.ConditionalExpression:
        case ts.SyntaxKind.CatchClause:
          complexity++;
          break;
        case ts.SyntaxKind.BinaryExpression:
          const binary = node as ts.BinaryExpression;
          if (
            binary.operatorToken.kind === ts.SyntaxKind.AmpersandAmpersandToken ||
            binary.operatorToken.kind === ts.SyntaxKind.BarBarToken
          ) {
            complexity++;
          }
          break;
      }
      ts.forEachChild(node, visit);
    }

    visit(sourceFile);
    return complexity;
  }

  private async calculateCoverage(filePath: string): Promise<number> {
    // This would integrate with your test coverage tool
    // For now, return a placeholder
    return 0.8;
  }

  private async processFixes() {
    const processedFiles = new Set<string>();

    for (const bug of this.fixQueue) {
      if (!processedFiles.has(bug.file)) {
        try {
          const content = await fs.readFile(bug.file, 'utf-8');
          if (bug.suggestedFix) {
            await fs.writeFile(bug.file, bug.suggestedFix);
            this.emit('fix-applied', {
              file: bug.file,
              bug,
            });
          }
          processedFiles.add(bug.file);
        } catch (error) {
          this.emit('fix-failed', {
            file: bug.file,
            bug,
            error,
          });
        }
      }
    }

    this.fixQueue = [];
  }

  public getAnalysisStatus() {
    return {
      analyzing: this.analyzing,
      queuedFixes: this.fixQueue.length,
      knownPatterns: this.knownPatterns.size,
    };
  }
}
