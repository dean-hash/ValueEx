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
Object.defineProperty(exports, "__esModule", { value: true });
exports.ContextRecovery = void 0;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
class ContextRecovery {
    constructor() {
        this.autoSaveTimer = null;
        this.lastAutoSave = Date.now();
        this.ensureDirectoryExists();
        this.currentState = this.initializeState();
        this.startAutoSave();
    }
    ensureDirectoryExists() {
        const dir = path.resolve(process.cwd(), ContextRecovery.SNAPSHOT_DIR);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
    }
    initializeState() {
        return {
            timestamp: new Date().toISOString(),
            activeTask: {
                description: '',
                startTime: new Date().toISOString(),
                progress: [],
                guidelines: [],
            },
            codebaseState: {
                modifiedFiles: [],
                pendingChanges: [],
                recentCommits: [],
            },
            developmentContext: {
                currentPhase: '',
                blockers: [],
                nextSteps: [],
            },
            technicalContext: {
                activeSystems: [],
                recentChanges: [],
                openIssues: [],
            },
        };
    }
    startAutoSave() {
        this.autoSaveTimer = setInterval(() => {
            const now = Date.now();
            if (now - this.lastAutoSave >= ContextRecovery.AUTO_SAVE_INTERVAL) {
                this.saveSnapshot(this.currentState);
                this.lastAutoSave = now;
            }
        }, ContextRecovery.AUTO_SAVE_INTERVAL);
    }
    stopAutoSave() {
        if (this.autoSaveTimer) {
            clearInterval(this.autoSaveTimer);
            this.autoSaveTimer = null;
        }
    }
    dispose() {
        this.stopAutoSave();
        this.saveSnapshot(this.currentState); // Final save
    }
    updateState(partialState) {
        this.currentState = {
            ...this.currentState,
            ...partialState,
            timestamp: new Date().toISOString(),
        };
        this.saveSnapshot(this.currentState);
    }
    updateActiveTask(description, progress, guidelines) {
        this.currentState.activeTask = {
            description,
            startTime: new Date().toISOString(),
            progress,
            guidelines,
        };
        this.saveSnapshot(this.currentState);
    }
    async saveSnapshot(state) {
        try {
            const snapshotDir = '.cascade/snapshots';
            await fs.promises.mkdir(snapshotDir, { recursive: true });
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const filename = path.join(snapshotDir, `snapshot-${timestamp}.json`);
            // Get list of existing snapshots
            const files = await fs.promises.readdir(snapshotDir);
            const snapshots = files.filter((f) => f.startsWith('snapshot-') && f.endsWith('.json'));
            // Maintain max snapshots limit
            if (snapshots.length >= ContextRecovery.MAX_SNAPSHOTS) {
                // Sort by timestamp and remove oldest
                const oldestSnapshots = snapshots
                    .sort()
                    .slice(0, snapshots.length - ContextRecovery.MAX_SNAPSHOTS + 1);
                for (const oldSnapshot of oldestSnapshots) {
                    await fs.promises.unlink(path.join(snapshotDir, oldSnapshot));
                }
            }
            // Save new snapshot
            await fs.promises.writeFile(filename, JSON.stringify(state, null, 2));
        }
        catch (error) {
            console.error('Error saving snapshot:', error);
            throw error;
        }
    }
    async loadLatestSnapshot() {
        try {
            const snapshotDir = '.cascade/snapshots';
            const files = await fs.promises.readdir(snapshotDir);
            const snapshots = files.filter((f) => f.startsWith('snapshot-') && f.endsWith('.json'));
            if (snapshots.length === 0) {
                return null;
            }
            // Get latest snapshot
            const latestSnapshot = snapshots.sort().pop();
            if (!latestSnapshot) {
                return null;
            }
            const snapshotPath = path.join(snapshotDir, latestSnapshot);
            const content = await fs.promises.readFile(snapshotPath, 'utf8');
            return JSON.parse(content);
        }
        catch (error) {
            console.error('Error loading snapshot:', error);
            return null;
        }
    }
    async recoverLatestState() {
        const state = await this.loadLatestSnapshot();
        if (state) {
            this.currentState = state;
        }
        return this.currentState;
    }
    generateRecoveryReport() {
        const state = this.currentState;
        return `
# Context Recovery Report
Generated: ${new Date().toLocaleString()}

## Active Task
${state.activeTask.description}
Started: ${new Date(state.activeTask.startTime).toLocaleString()}

### Progress
${state.activeTask.progress.map((p) => `- ${p}`).join('\n')}

### Guidelines
${state.activeTask.guidelines.map((g) => `- ${g}`).join('\n')}

## Development Status
Current Phase: ${state.developmentContext.currentPhase}

### Blockers
${state.developmentContext.blockers.map((b) => `- ${b}`).join('\n')}

### Next Steps
${state.developmentContext.nextSteps.map((s) => `- ${s}`).join('\n')}

## Technical Context
Active Systems:
${state.technicalContext.activeSystems.map((s) => `- ${s}`).join('\n')}

Recent Changes:
${state.technicalContext.recentChanges.map((c) => `- ${c}`).join('\n')}

## Codebase State
Modified Files:
${state.codebaseState.modifiedFiles.map((f) => `- ${f}`).join('\n')}

Pending Changes:
${state.codebaseState.pendingChanges.map((c) => `- ${c}`).join('\n')}
`;
    }
}
exports.ContextRecovery = ContextRecovery;
ContextRecovery.SNAPSHOT_DIR = '.cascade/snapshots';
ContextRecovery.MAX_SNAPSHOTS = 10;
ContextRecovery.AUTO_SAVE_INTERVAL = 5 * 60 * 1000; // 5 minutes
//# sourceMappingURL=contextRecovery.js.map