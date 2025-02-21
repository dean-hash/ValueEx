import { EventEmitter } from 'events';
import { ResourceMonitor } from './monitoring/resourceMonitor';
import { ProjectState, SessionContext } from '../types/projectTypes';
export interface ProjectContext {
    sessionContext: SessionContext;
    projectState: ProjectState;
}
export declare class ContextService extends EventEmitter {
    private static instance;
    private recovery;
    private monitor;
    private saveTimer;
    private readonly AUTO_SAVE_INTERVAL;
    private constructor();
    static getInstance(): ContextService;
    private setupAutoSave;
    initialize(initialState?: Partial<ProjectState>): Promise<void>;
    getState(): Promise<ProjectState>;
    updateState(updates: Partial<ProjectState>): Promise<void>;
    private saveContext;
    dispose(): void;
    getMonitor(): ResourceMonitor;
    clearState(): void;
}
