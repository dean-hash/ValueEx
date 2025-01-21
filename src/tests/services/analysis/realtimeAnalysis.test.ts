import { describe, expect, beforeEach, it } from '@jest/globals';
import { RealtimeAnalyzer } from '../../../services/analysis/realtimeAnalyzer';
import type { AnalysisConfig, AnalysisResult, ResourceSnapshot } from '../../../types/analysisTypes';
import { setupMinimalTestEnv } from '../../setup/minimal';

// Set up test environment
setupMinimalTestEnv();

describe('Real-Time Passive Analysis', () => {
  let analyzer: RealtimeAnalyzer;
  let config: AnalysisConfig;

  beforeEach(() => {
    config = {
      updateInterval: 1000,
      batchSize: 100,
      maxQueueSize: 1000
    };
    analyzer = new RealtimeAnalyzer(config);
  });

  describe('Core Functionality', () => {
    it('should process demand signals in real-time', async () => {
      const signal = {
        type: 'demand',
        source: 'test',
        value: 100
      };

      const result = await analyzer.processSignal(signal);
      
      expect(result).toBeDefined();
      expect(result.confidence).toBeGreaterThanOrEqual(0);
      expect(result.confidence).toBeLessThanOrEqual(1);
      expect(result.intensity).toBeGreaterThanOrEqual(0);
      expect(result.intensity).toBeLessThanOrEqual(1);
      expect(result.timestamp).toBeLessThanOrEqual(Date.now());
      expect(result.metrics).toBeDefined();
      expect(result.metrics.cpu).toBeGreaterThanOrEqual(0);
      expect(result.metrics.memory).toBeGreaterThanOrEqual(0);
      expect(result.metrics.latency).toBeGreaterThanOrEqual(0);
    });

    it('should track resource usage', async () => {
      const snapshots = await analyzer.getResourceSnapshots(60);
      
      expect(snapshots.length).toBeGreaterThan(0);
      snapshots.forEach(snapshot => {
        expect(snapshot.timestamp).toBeDefined();
        expect(snapshot.cpu).toBeGreaterThanOrEqual(0);
        expect(snapshot.cpu).toBeLessThanOrEqual(100);
        expect(snapshot.memory).toBeGreaterThanOrEqual(0);
        expect(snapshot.memory).toBeLessThanOrEqual(100);
        expect(snapshot.activeConnections).toBeGreaterThanOrEqual(0);
      });
    });

    it('should provide performance metrics', async () => {
      const metrics = await analyzer.getPerformanceMetrics();
      
      expect(metrics.averageCpu).toBeGreaterThanOrEqual(0);
      expect(metrics.averageCpu).toBeLessThanOrEqual(100);
      expect(metrics.averageMemory).toBeGreaterThanOrEqual(0);
      expect(metrics.averageMemory).toBeLessThanOrEqual(100);
      expect(metrics.averageLatency).toBeGreaterThanOrEqual(0);
      expect(metrics.throughput).toBeGreaterThanOrEqual(0);
    });
  });
});
