import { describe, expect, beforeEach, test } from '@jest/globals';
import { ContextManager } from '../../../services/analysis/providers/contextManager';
import type { DemandSignal } from '../../../services/analysis/types';
import * as fs from 'fs';
import * as path from 'path';

jest.mock('fs');
jest.mock('chokidar');

describe('ContextManager', () => {
  let contextManager: ContextManager;
  let mockComponent: any;
  const mockProjectRoot = '/mock/project/root';

  beforeEach(() => {
    jest.clearAllMocks();
    (fs.promises.readdir as jest.Mock).mockResolvedValue(['test.ts']);
    (fs.promises.readFile as jest.Mock).mockResolvedValue('test file content');
    (fs.promises.stat as jest.Mock).mockResolvedValue({ mtimeMs: Date.now() });
    contextManager = new ContextManager(mockProjectRoot);
    mockComponent = {
      processSignal: jest.fn()
    };
  });

  describe('Initialization', () => {
    test('should initialize with correct properties', () => {
      expect(contextManager.name).toBe('context_manager');
      expect(contextManager.type).toBe('context');
      expect(contextManager.confidence).toBe(1.0);
    });

    test('should set up file watcher correctly', () => {
      expect(contextManager['watcher']).toBeDefined();
    });
  });

  describe('Signal Processing', () => {
    const mockSignal: DemandSignal = {
      id: 'test-signal',
      source: 'test',
      timestamp: Date.now(),
      type: 'explicit',
      confidence: 0.8,
      context: {
        keywords: ['test', 'mock'],
        sentiment: 0,
        urgency: 0.5,
        matches: [],
      },
      requirements: {
        features: ['feature1', 'feature2'],
        constraints: {} as any,
      },
    };

    test('should process signal without requirements', async () => {
      const signal = { ...mockSignal };
      delete signal.requirements;

      const processed = await contextManager.processSignal(signal);
      expect(processed).toBeDefined();
      expect(processed.context.matches).toEqual(signal.context.matches);
    });

    test('should process signal with requirements', async () => {
      const processed = await contextManager.processSignal(mockSignal);
      expect(processed).toBeDefined();
      expect(processed.context.matches).toBeDefined();
      expect(Array.isArray(processed.context.matches)).toBe(true);
    });
  });

  describe('Component Analysis', () => {
    const testComponent = {
      path: '/mock/Component.ts',
      content: `
        export class TestComponent {
          function testMethod() {}
        }
      `,
    };

    beforeEach(() => {
      (fs.promises.readFile as jest.Mock).mockResolvedValue(testComponent.content);
      (fs.promises.stat as jest.Mock).mockResolvedValue({ mtimeMs: Date.now() });
    });

    test('should analyze component metadata', async () => {
      const metadata = await contextManager['extractMetadata'](testComponent.path);
      expect(metadata).toBeDefined();
      expect(metadata.exports).toBeDefined();
    });

    test('should detect breaking changes', async () => {
      const oldMetadata = {
        id: 'test',
        name: 'test',
        path: '/test',
        type: 'component',
        dependencies: [],
        exports: ['oldMethod'],
        lastModified: Date.now() - 1000,
        functions: [
          {
            name: 'oldMethod',
            params: ['param1'],
            returnType: 'void',
          },
        ],
      };

      const newMetadata = {
        ...oldMetadata,
        functions: [
          {
            name: 'newMethod',
            params: ['param1', 'param2'],
            returnType: 'string',
          },
        ],
      };

      const hasChanges = await contextManager['checkFunctionChanges'](oldMetadata, newMetadata);
      expect(hasChanges).toBe(true);
    });
  });

  describe('Health Monitoring', () => {
    test('should validate alignment correctly', async () => {
      const isValid = await contextManager.validateAlignment();
      expect(typeof isValid).toBe('boolean');
    });

    test('should perform health check', async () => {
      const mockComponent = {
        metadata: {
          id: 'test',
          path: '/test/path',
          dependencies: [],
        },
      };

      await contextManager['performHealthCheck']();
      expect(contextManager['healthStatus'].size).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Error Handling', () => {
    test('should handle file read errors', async () => {
      (fs.promises.readFile as jest.Mock).mockRejectedValue(new Error('File not found'));

      const metadata = await contextManager['extractMetadata']('/nonexistent/file.ts');
      expect(metadata).toBeDefined();
      expect(metadata.exports).toEqual([]);
    });

    test('should handle invalid component paths', async () => {
      const health = await contextManager['checkComponentHealth']({
        id: 'invalid',
        name: 'invalid',
        type: 'unknown',
        features: [],
        metadata: {
          id: 'invalid',
          name: 'invalid',
          path: '/invalid/path',
          type: 'unknown',
          dependencies: [],
          exports: [],
          lastModified: Date.now(),
          functions: [],
        },
      });

      expect(health.status).toBe('error');
      expect(health.issues).toBeDefined();
      expect(health.issues!.length).toBeGreaterThan(0);
    });
  });
});
