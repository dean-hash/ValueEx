"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BugFixer = void 0;
const events_1 = require("events");
const fs_1 = require("fs");
const path_1 = __importDefault(require("path"));
const bugHunter_1 = require("./bugHunter");
const testRunner_1 = require("./testRunner");
const intelligenceField_1 = require("../unified/intelligenceField");
class BugFixer extends events_1.EventEmitter {
    constructor() {
        super();
        this.fixHistory = new Map();
        this.pendingFixes = [];
        this.bugHunter = bugHunter_1.BugHunter.getInstance();
        this.testRunner = testRunner_1.TestRunner.getInstance();
        this.resonanceField = intelligenceField_1.ResonanceField.getInstance();
        this.initializeEventHandlers();
    }
    static getInstance() {
        if (!BugFixer.instance) {
            BugFixer.instance = new BugFixer();
        }
        return BugFixer.instance;
    }
    initializeEventHandlers() {
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
    async handleBugs(file, bugs) {
        for (const bug of bugs) {
            if (bug.confidence >= 0.8 && bug.suggestedFix) {
                const fix = {
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
    async handleTestFailure(result) {
        const file = result.file;
        const content = await fs_1.promises.readFile(file, 'utf-8');
        // Use resonance field to analyze the failure
        const analysis = await this.resonanceField.analyzeCode(content);
        if (analysis.suggestedFix) {
            const fix = {
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
    async handleFixPattern(anomaly) {
        const { pattern, files } = anomaly;
        for (const file of files) {
            const content = await fs_1.promises.readFile(file, 'utf-8');
            if (this.matchesPattern(content, pattern)) {
                const fix = {
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
    async getOriginalCode(file, bug) {
        const content = await fs_1.promises.readFile(file, 'utf-8');
        const lines = content.split('\n');
        return lines[bug.line - 1];
    }
    matchesPattern(content, pattern) {
        return new RegExp(pattern.regex).test(content);
    }
    applyPattern(content, pattern) {
        return content.replace(new RegExp(pattern.regex), pattern.replacement);
    }
    async processPendingFixes() {
        while (this.pendingFixes.length > 0) {
            const fix = this.pendingFixes.shift();
            await this.applyFix(fix);
        }
    }
    async applyFix(fix) {
        const backup = await this.createBackup(fix.file);
        try {
            // Apply the fix
            await fs_1.promises.writeFile(fix.file, fix.fixed);
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
            }
            else {
                // Restore backup
                await fs_1.promises.copyFile(backup, fix.file);
                await this.resonanceField.monitorQAMetrics(`fix_${fix.type}`, 0);
                return {
                    success: false,
                    fix,
                    testsPassed: false,
                    error: 'Tests failed after applying fix',
                };
            }
        }
        catch (error) {
            // Restore backup
            await fs_1.promises.copyFile(backup, fix.file);
            await this.resonanceField.monitorQAMetrics(`fix_${fix.type}`, 0);
            return {
                success: false,
                fix,
                error: error.message,
            };
        }
        finally {
            // Clean up backup
            await fs_1.promises.unlink(backup);
        }
    }
    async createBackup(file) {
        const backupPath = `${file}.backup`;
        await fs_1.promises.copyFile(file, backupPath);
        return backupPath;
    }
    async verifyFix(fix) {
        // Run tests for the fixed file
        const testFile = fix.file.replace(/\.ts$/, '.test.ts');
        if (await fs_1.promises
            .access(testFile)
            .then(() => true)
            .catch(() => false)) {
            await this.testRunner.addTestSuite({
                name: `verify_fix_${path_1.default.basename(fix.file)}`,
                files: [testFile],
                config: {},
            });
            // Wait for test results
            return new Promise((resolve) => {
                const handler = (result) => {
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
    getFixStatus() {
        return {
            pendingFixes: this.pendingFixes.length,
            fixedFiles: this.fixHistory.size,
            totalFixes: Array.from(this.fixHistory.values()).reduce((acc, fixes) => acc + fixes.length, 0),
        };
    }
    async startFixing(directory) {
        // Start bug hunting
        await this.bugHunter.startHunting(directory);
    }
}
exports.BugFixer = BugFixer;
//# sourceMappingURL=bugFixer.js.map