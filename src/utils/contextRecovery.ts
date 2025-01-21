import * as fs from 'fs';
import * as path from 'path';

interface ProjectState {
  timestamp: string;
  activeTask: {
    description: string;
    startTime: string;
    progress: string[];
    guidelines: string[];
  };
  codebaseState: {
    modifiedFiles: string[];
    pendingChanges: string[];
    recentCommits: string[];
  };
  developmentContext: {
    currentPhase: string;
    blockers: string[];
    nextSteps: string[];
  };
  technicalContext: {
    activeSystems: string[];
    recentChanges: string[];
    openIssues: string[];
  };
}

export class ContextRecovery {
  private static readonly SNAPSHOT_DIR = '.cascade/snapshots';
  private static readonly MAX_SNAPSHOTS = 10;
  private static readonly AUTO_SAVE_INTERVAL = 5 * 60 * 1000; // 5 minutes
  private currentState: ProjectState;
  private autoSaveTimer: NodeJS.Timeout | null = null;
  private lastAutoSave: number = Date.now();

  constructor() {
    this.ensureDirectoryExists();
    this.currentState = this.initializeState();
    this.startAutoSave();
  }

  private ensureDirectoryExists(): void {
    const dir = path.resolve(process.cwd(), ContextRecovery.SNAPSHOT_DIR);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  private initializeState(): ProjectState {
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

  private startAutoSave(): void {
    this.autoSaveTimer = setInterval(() => {
      const now = Date.now();
      if (now - this.lastAutoSave >= ContextRecovery.AUTO_SAVE_INTERVAL) {
        this.saveSnapshot(this.currentState);
        this.lastAutoSave = now;
      }
    }, ContextRecovery.AUTO_SAVE_INTERVAL);
  }

  public stopAutoSave(): void {
    if (this.autoSaveTimer) {
      clearInterval(this.autoSaveTimer);
      this.autoSaveTimer = null;
    }
  }

  public dispose(): void {
    this.stopAutoSave();
    this.saveSnapshot(this.currentState); // Final save
  }

  public updateState(partialState: Partial<ProjectState>): void {
    this.currentState = {
      ...this.currentState,
      ...partialState,
      timestamp: new Date().toISOString(),
    };
    this.saveSnapshot(this.currentState);
  }

  public updateActiveTask(description: string, progress: string[], guidelines: string[]): void {
    this.currentState.activeTask = {
      description,
      startTime: new Date().toISOString(),
      progress,
      guidelines,
    };
    this.saveSnapshot(this.currentState);
  }

  private async saveSnapshot(state: Partial<ProjectState>): Promise<void> {
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
    } catch (error) {
      console.error('Error saving snapshot:', error);
      throw error;
    }
  }

  private async loadLatestSnapshot(): Promise<Partial<ProjectState> | null> {
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
    } catch (error) {
      console.error('Error loading snapshot:', error);
      return null;
    }
  }

  public async recoverLatestState(): Promise<ProjectState | null> {
    const state = await this.loadLatestSnapshot();
    if (state) {
      this.currentState = state as ProjectState;
    }
    return this.currentState;
  }

  public generateRecoveryReport(): string {
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
