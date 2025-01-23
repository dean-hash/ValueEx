"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BugHunter = void 0;
const events_1 = require("events");
const intelligenceField_1 = require("../unified/intelligenceField");
const ts = __importStar(require("typescript"));
const ESLint = __importStar(require("eslint"));
const fs_1 = require("fs");
const path_1 = __importDefault(require("path"));
class BugHunter extends events_1.EventEmitter {
    constructor() {
        super();
        this.analyzing = false;
        this.fixQueue = [];
        this.knownPatterns = new Map();
        this.resonanceField = intelligenceField_1.ResonanceField.getInstance();
        this.eslint = new ESLint.ESLint({
            fix: true,
            extensions: ['.ts', '.tsx'],
        });
        this.initializePatternLearning();
    }
    static getInstance() {
        if (!BugHunter.instance) {
            BugHunter.instance = new BugHunter();
        }
        return BugHunter.instance;
    }
    async initializePatternLearning() {
        this.resonanceField.on('anomaly', async (anomaly) => {
            if (anomaly.type === 'code_pattern') {
                await this.learnPattern(anomaly.pattern);
            }
        });
    }
    async learnPattern(pattern) {
        const signature = this.getPatternSignature(pattern);
        const currentConfidence = this.knownPatterns.get(signature) || 0;
        this.knownPatterns.set(signature, Math.min(currentConfidence + 0.1, 1));
    }
    getPatternSignature(pattern) {
        return JSON.stringify(pattern);
    }
    async startHunting(directory) {
        if (this.analyzing)
            return;
        this.analyzing = true;
        try {
            const files = await this.findTypeScriptFiles(directory);
            for (const file of files) {
                await this.analyzeFile(file);
            }
            // Process fix queue
            await this.processFixes();
        }
        finally {
            this.analyzing = false;
        }
    }
    async findTypeScriptFiles(directory) {
        const files = [];
        async function walk(dir) {
            const entries = await fs_1.promises.readdir(dir, { withFileTypes: true });
            for (const entry of entries) {
                const fullPath = path_1.default.join(dir, entry.name);
                if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules') {
                    await walk(fullPath);
                }
                else if (entry.isFile() && /\.tsx?$/.test(entry.name)) {
                    files.push(fullPath);
                }
            }
        }
        await walk(directory);
        return files;
    }
    async analyzeFile(filePath) {
        const content = await fs_1.promises.readFile(filePath, 'utf-8');
        const bugs = [];
        // Static analysis
        const sourceFile = ts.createSourceFile(filePath, content, ts.ScriptTarget.Latest, true);
        // ESLint analysis
        const eslintResults = await this.eslint.lintFiles([filePath]);
        // Convert ESLint results to bug reports
        for (const result of eslintResults) {
            for (const message of result.messages) {
                const bug = {
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
        const analysis = {
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
    calculateConfidence(eslintMessage) {
        // Base confidence on rule severity and pattern recognition
        const severityConfidence = eslintMessage.severity === 2 ? 0.8 : 0.6;
        const patternConfidence = this.knownPatterns.get(eslintMessage.ruleId || '') || 0;
        return Math.max(severityConfidence, patternConfidence);
    }
    generateFix(content, eslintFix) {
        const lines = content.split('\n');
        const fixedContent = content.slice(0, eslintFix.range[0]) + eslintFix.text + content.slice(eslintFix.range[1]);
        return fixedContent;
    }
    calculateComplexity(sourceFile) {
        let complexity = 0;
        function visit(node) {
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
                    const binary = node;
                    if (binary.operatorToken.kind === ts.SyntaxKind.AmpersandAmpersandToken ||
                        binary.operatorToken.kind === ts.SyntaxKind.BarBarToken) {
                        complexity++;
                    }
                    break;
            }
            ts.forEachChild(node, visit);
        }
        visit(sourceFile);
        return complexity;
    }
    async calculateCoverage(filePath) {
        // This would integrate with your test coverage tool
        // For now, return a placeholder
        return 0.8;
    }
    async processFixes() {
        const processedFiles = new Set();
        for (const bug of this.fixQueue) {
            if (!processedFiles.has(bug.file)) {
                try {
                    const content = await fs_1.promises.readFile(bug.file, 'utf-8');
                    if (bug.suggestedFix) {
                        await fs_1.promises.writeFile(bug.file, bug.suggestedFix);
                        this.emit('fix-applied', {
                            file: bug.file,
                            bug,
                        });
                    }
                    processedFiles.add(bug.file);
                }
                catch (error) {
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
    getAnalysisStatus() {
        return {
            analyzing: this.analyzing,
            queuedFixes: this.fixQueue.length,
            knownPatterns: this.knownPatterns.size,
        };
    }
}
exports.BugHunter = BugHunter;
//# sourceMappingURL=bugHunter.js.map