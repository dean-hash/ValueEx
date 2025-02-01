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
export declare class ContextRecovery {
  private static readonly SNAPSHOT_DIR;
  private static readonly MAX_SNAPSHOTS;
  private static readonly AUTO_SAVE_INTERVAL;
  private currentState;
  private autoSaveTimer;
  private lastAutoSave;
  constructor();
  private ensureDirectoryExists;
  private initializeState;
  private startAutoSave;
  stopAutoSave(): void;
  dispose(): void;
  updateState(partialState: Partial<ProjectState>): void;
  updateActiveTask(description: string, progress: string[], guidelines: string[]): void;
  private saveSnapshot;
  private loadLatestSnapshot;
  recoverLatestState(): Promise<ProjectState | null>;
  generateRecoveryReport(): string;
}
export {};
