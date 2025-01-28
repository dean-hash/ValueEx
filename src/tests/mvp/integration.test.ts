import axios from 'axios';
import { MeetingInfo, ValueMetrics } from '../../services/minimal';
import { MVPRunner } from '../../mvp/runner';
import { DemandMatcher } from '../../services/mvp/demandMatcher';
import { MVPStorage } from '../../services/mvp/storage';
import { TeamsChannelService } from '../../services/teams/TeamsChannelService';
import { HealthStatus } from '../../types/health';

const API_BASE = 'http://localhost:3000/api';

describe('ValueEx MVP Integration Tests', () => {
  let meetingInfo: MeetingInfo;
  let runner: MVPRunner;
  let matcher: DemandMatcher;
  let storage: MVPStorage;
  let teamsService: TeamsChannelService;

  beforeEach(() => {
    storage = MVPStorage.getInstance();
    matcher = DemandMatcher.getInstance();
    teamsService = TeamsChannelService.getInstance();
    runner = new MVPRunner();
  });

  beforeAll(() => {
    // Ensure server is running
    console.log('Ensure ValueEx MVP server is running on port 3000');
  });

  describe('Teams Integration', () => {
    it('should start a new meeting', async () => {
      const response = await axios.post(`${API_BASE}/meetings/start`, {
        subject: 'Test Meeting',
      });

      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('joinUrl');
      expect(response.data).toHaveProperty('threadId');
      expect(response.data.subject).toBe('Test Meeting');

      meetingInfo = response.data;
    });

    it('should generate valid Teams meeting URLs', () => {
      expect(meetingInfo.joinUrl).toMatch(/^https:\/\/teams\.microsoft\.com\/l\/meetup-join/);
    });
  });

  describe('Value Metrics', () => {
    it('should measure value for a given product', async () => {
      const testProduct = {
        id: 'test-product',
        name: 'Test Product',
        price: 99.99,
      };

      const testPattern = {
        type: 'purchase_intent',
        confidence: 0.85,
      };

      const response = await axios.post(`${API_BASE}/value/measure`, {
        product: testProduct,
        pattern: testPattern,
      });

      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('consumerValue');
      expect(response.data).toHaveProperty('merchantValue');
      expect(response.data).toHaveProperty('timestamp');

      const metrics: ValueMetrics = response.data;
      expect(metrics.consumerValue).toBeGreaterThanOrEqual(0);
      expect(metrics.merchantValue).toBeGreaterThanOrEqual(0);
      expect(new Date(metrics.timestamp)).toBeInstanceOf(Date);
    });
  });

  describe('Error Handling', () => {
    it('should handle missing required fields', async () => {
      try {
        await axios.post(`${API_BASE}/meetings/start`, {});
        fail('Should have thrown an error');
      } catch (error: any) {
        expect(error.response.status).toBe(500);
        expect(error.response.data).toHaveProperty('error');
      }
    });

    it('should handle invalid value measurement requests', async () => {
      try {
        await axios.post(`${API_BASE}/value/measure`, {});
        fail('Should have thrown an error');
      } catch (error: any) {
        expect(error.response.status).toBe(500);
        expect(error.response.data).toHaveProperty('error');
      }
    });
  });

  describe('Health Monitoring', () => {
    it('should report system health correctly', async () => {
      const healthStatus = await runner.checkHealth();
      expect(healthStatus).toBeDefined();
      expect(healthStatus.status).toMatch(/^(healthy|degraded|down)$/);
    });

    it('should notify Teams on health status changes', async () => {
      const mockAlert: HealthStatus = {
        service: 'MVP Runner',
        status: 'healthy',
        message: 'System operational',
      };

      const spy = jest.spyOn(teamsService, 'sendHealthAlert');
      await runner.start();

      expect(spy).toHaveBeenCalledWith(
        expect.objectContaining({
          service: 'MVP Runner',
          status: expect.stringMatching(/^(healthy|down)$/),
          message: expect.any(String),
        })
      );
    });
  });

  describe('Demand Matching', () => {
    it('should process demand requests', async () => {
      const demand = {
        id: 'test-demand-1',
        requirements: ['test requirement'],
        preferences: ['test preference'],
        constraints: {},
      };

      const result = await matcher.matchDemand(demand);
      expect(result.status).toMatch(/^(matched|queued|no_match)$/);
    });
  });
});
