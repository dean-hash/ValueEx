import { CorrelationDashboard } from '../correlationDashboard';
import { DemandInsights } from '../../insights/DemandInsights';
import { CorrelationAnalyzer } from '../../analysis/CorrelationAnalyzer';
import { MetricsCollector } from '../../collectors/MetricsCollector';

jest.mock('../../insights/DemandInsights');
jest.mock('../../analysis/CorrelationAnalyzer');
jest.mock('../../collectors/MetricsCollector');

describe('CorrelationDashboard', () => {
  let dashboard: CorrelationDashboard;
  let mockDemandInsights: jest.Mocked<DemandInsights>;
  let mockAnalyzer: jest.Mocked<CorrelationAnalyzer>;
  let mockCollector: jest.Mocked<MetricsCollector>;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Setup mock instances
    mockDemandInsights = DemandInsights.getInstance() as jest.Mocked<DemandInsights>;
    mockAnalyzer = CorrelationAnalyzer.getInstance() as jest.Mocked<CorrelationAnalyzer>;
    mockCollector = MetricsCollector.getInstance() as jest.Mocked<MetricsCollector>;

    // Create dashboard instance
    dashboard = CorrelationDashboard.getInstance();
  });

  describe('calculateSignalStrength', () => {
    it('should calculate signal strength correctly', () => {
      const result = dashboard.calculateSignalStrength({
        intentSimilarity: 0.8,
        confidenceScore: 0.6,
        temporalProximity: 0.7
      });
      
      // 0.8 * 0.4 + 0.6 * 0.3 + 0.7 * 0.3 = 0.32 + 0.18 + 0.21 = 0.71
      expect(result).toBeCloseTo(0.71);
    });
  });

  describe('findRelatedSignals', () => {
    it('should return related signals with correct strength', () => {
      const mockSignals = [
        { topic: 'signal1', confidence: 0.8 },
        { topic: 'signal2', confidence: 0.6 }
      ];

      mockDemandInsights.getEmergingPatterns.mockReturnValue(mockSignals);
      
      const result = dashboard.findRelatedSignals('testSignal');
      expect(result).toHaveLength(2);
      expect(result[0]).toHaveProperty('strength');
    });
  });

  describe('updateVisualization', () => {
    it('should update network graph with new nodes and edges', () => {
      const mockData = {
        nodes: [{ id: 'node1', label: 'Node 1' }],
        edges: [{ from: 'node1', to: 'node2', strength: 0.5 }]
      };

      dashboard.updateVisualization(mockData);
      // Add assertions based on expected visualization updates
    });
  });
});
