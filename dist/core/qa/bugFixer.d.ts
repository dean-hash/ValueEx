import { EventEmitter } from 'events';
export declare class BugFixer extends EventEmitter {
    private static instance;
    private bugHunter;
    private testRunner;
    private resonanceField;
    private fixHistory;
    private pendingFixes;
    private constructor();
    static getInstance(): BugFixer;
    private initializeEventHandlers;
    private handleBugs;
    private handleTestFailure;
    private handleFixPattern;
    private getOriginalCode;
    private matchesPattern;
    private applyPattern;
    private processPendingFixes;
    private applyFix;
    private createBackup;
    private verifyFix;
    getFixStatus(): {
        pendingFixes: number;
        fixedFiles: number;
        totalFixes: number;
    };
    startFixing(directory: string): Promise<void>;
}
