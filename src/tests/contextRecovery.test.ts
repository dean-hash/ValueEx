import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { ContextRecovery } from '../utils/contextRecovery';
import { ContextService, ProjectState } from '../services/contextService';
import * as fs from 'fs';
import * as path from 'path';

// Mock fs module
jest.mock('fs', () => ({
  promises: {
    mkdir: jest.fn(),
    readdir: jest.fn(),
    writeFile: jest.fn(),
    readFile: jest.fn(),
    unlink: jest.fn(),
  },
  createWriteStream: jest.fn().mockReturnValue({
    write: jest.fn(),
    end: jest.fn(),
    on: jest.fn(),
    once: jest.fn(),
    emit: jest.fn(),
  }),
  mkdirSync: jest.fn(),
}));

jest.mock('path', () => ({
  join: jest.fn((...args) => args.join('/')),
  dirname: jest.fn((path) => path.split('/').slice(0, -1).join('/')),
}));

describe('Context Recovery System', () => {
  let recovery: ContextRecovery;
  let service: ContextService;

  beforeEach(() => {
    jest.clearAllMocks();
    recovery = new ContextRecovery();
    service = ContextService.getInstance();

    // Setup default mock implementations
    (fs.promises.mkdir as jest.Mock).mockResolvedValue(undefined);
    (fs.promises.readdir as jest.Mock).mockResolvedValue(['snapshot1.json', 'snapshot2.json']);
    (fs.promises.writeFile as jest.Mock).mockResolvedValue(undefined);
    (fs.promises.readFile as jest.Mock).mockResolvedValue(
      '{"activeTask":{"description":"Test Task"}}'
    );
    (path.join as jest.Mock).mockImplementation((...args: string[]) => args.join('/'));
  });

  afterEach(() => {
    if (service) {
      service.dispose();
    }
  });

  describe('State Management', () => {
    it('should create initial state correctly', async () => {
      const state = await recovery.recoverLatestState();
      expect(state).toBeDefined();
      if (state) {
        expect(state.activeTask).toBeDefined();
        expect(state.codebaseState).toBeDefined();
      }
    });

    it('should update state correctly', async () => {
      const timestamp = new Date().toISOString();
      const newState: Partial<ProjectState> = {
        activeTask: {
          description: 'Test Task',
          startTime: timestamp,
          progress: ['Step 1', 'Step 2'],
          guidelines: ['Guideline 1'],
        },
        codebaseState: {
          modifiedFiles: ['file1.ts', 'file2.ts'],
          pendingChanges: ['change1', 'change2'],
          recentCommits: ['commit1', 'commit2'],
        },
      };

      await recovery.updateState(newState);
      const state = await recovery.recoverLatestState();
      expect(state?.activeTask.description).toBe('Test Task');
    });

    it('should maintain snapshot history limit', async () => {
      // Create more than MAX_SNAPSHOTS
      const timestamp = new Date().toISOString();
      for (let i = 0; i < 12; i++) {
        await recovery.updateState({
          timestamp: new Date().toISOString(),
          activeTask: {
            description: `Task ${i}`,
            startTime: timestamp,
            progress: [],
            guidelines: [],
          },
          codebaseState: {
            modifiedFiles: [],
            pendingChanges: [],
            recentCommits: [],
          },
        });
      }

      const files = await fs.promises.readdir('.cascade/snapshots');
      expect(files.length).toBeLessThanOrEqual(10);
    });
  });

  describe('Recovery Process', () => {
    it('should generate accurate recovery report', async () => {
      const timestamp = new Date().toISOString();
      const testState: Partial<ProjectState> = {
        activeTask: {
          description: 'Test Task',
          startTime: timestamp,
          progress: ['Progress 1'],
          guidelines: ['Guideline 1'],
        },
        developmentContext: {
          currentPhase: 'Testing',
          blockers: [],
          nextSteps: ['Step 1'],
        },
        codebaseState: {
          modifiedFiles: ['file1.ts'],
          pendingChanges: ['change1'],
          recentCommits: ['commit1'],
        },
      };

      await recovery.updateState(testState);
      const state = await recovery.recoverLatestState();
      expect(state).toBeDefined();
      if (state) {
        expect(state.activeTask.description).toBe('Test Task');
        expect(state.developmentContext?.currentPhase).toBe('Testing');
      }
    });

    it('should handle recovery failures gracefully', async () => {
      (fs.promises.readdir as jest.Mock).mockRejectedValueOnce(new Error('Test Error'));
      const state = await recovery.recoverLatestState();
      expect(state).toBeNull();
    });
  });

  describe('Integration Tests', () => {
    it('should integrate with ContextService', async () => {
      const state = await service.getCurrentState();
      expect(state).toBeDefined();
    });

    it('should handle context loss events', async () => {
      const listener = jest.fn();
      service.on('contextLoss', listener);
      await service.clearState();
      expect(listener).toHaveBeenCalled();
    });

    it('should maintain context after multiple operations', async () => {
      const timestamp = new Date().toISOString();
      await service.updateState({
        activeTask: {
          description: 'Integration Test Task',
          startTime: timestamp,
          progress: [],
          guidelines: [],
        },
      });

      const state = await service.getCurrentState();
      expect(state?.activeTask.description).toBe('Integration Test Task');
    });
  });
});
