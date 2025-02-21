import { EventEmitter } from 'events';
import { logger } from '../utils/logger';
import { ContextRecovery } from './contextRecovery';
import { ResourceMonitor } from './monitoring/resourceMonitor';
import { ProjectState, SessionContext } from '../types/projectTypes';

export interface ProjectContext {
  sessionContext: SessionContext;
  projectState: ProjectState;
}

export class ContextService extends EventEmitter {
  private static instance: ContextService;
  private recovery: ContextRecovery;
  private monitor: ResourceMonitor;
  private saveTimer: NodeJS.Timeout;
  private readonly AUTO_SAVE_INTERVAL = 60000; // 1 minute

  private constructor() {
    super();
    this.recovery = new ContextRecovery();
    this.monitor = new ResourceMonitor();
    this.setupAutoSave();
  }

  public static getInstance(): ContextService {
    if (!ContextService.instance) {
      ContextService.instance = new ContextService();
    }
    return ContextService.instance;
  }

  private setupAutoSave(): void {
    this.saveTimer = setInterval(() => {
      this.saveContext();
    }, this.AUTO_SAVE_INTERVAL);
  }

  public async initialize(initialState: Partial<ProjectState> = {}): Promise<void> {
    try {
      const savedState = await this.recovery.loadState();
      const mergedState: ProjectState = {
        ...savedState,
        ...initialState,
        sessionContext: {
          startTime: Date.now(),
          lastUpdated: Date.now(),
          activeUsers: [],
          metrics: {},
        },
      };

      await this.recovery.saveState(mergedState);
      this.emit('stateUpdated', mergedState);
    } catch (error) {
      logger.error('Failed to initialize context:', error);
      throw error;
    }
  }

  public async getState(): Promise<ProjectState> {
    try {
      return await this.recovery.loadState();
    } catch (error) {
      logger.error('Failed to get state:', error);
      throw error;
    }
  }

  public async updateState(updates: Partial<ProjectState>): Promise<void> {
    try {
      const currentState = await this.recovery.loadState();
      const updatedState: ProjectState = {
        ...currentState,
        ...updates,
        sessionContext: {
          ...currentState.sessionContext,
          lastUpdated: Date.now(),
        },
      };

      await this.recovery.saveState(updatedState);
      this.emit('stateUpdated', updatedState);
    } catch (error) {
      logger.error('Failed to update state:', error);
      throw error;
    }
  }

  private async saveContext(): Promise<void> {
    try {
      const currentState = await this.recovery.loadState();
      await this.recovery.saveState(currentState);
    } catch (error) {
      logger.error('Failed to save context:', error);
    }
  }

  public dispose(): void {
    if (this.saveTimer) {
      clearInterval(this.saveTimer);
    }
    this.monitor.stopMonitoring();
    this.removeAllListeners();
  }

  public getMonitor(): ResourceMonitor {
    return this.monitor;
  }

  public clearState(): void {
    this.recovery.clearState();
  }
}
