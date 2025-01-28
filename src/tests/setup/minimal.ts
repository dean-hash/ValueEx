import { jest } from '@jest/globals';
import { MetricsCollector } from '../../services/monitoring/Metrics';
import { setupTeamsTestEnv } from './teams.env';

// Minimal test environment setup
export const setupMinimalTestEnv = () => {
  // Set default test timeouts
  jest.setTimeout(30000);

  // Set up Teams test environment
  setupTeamsTestEnv();

  // Mock MetricsCollector
  const mockMetricsCollector = {
    trackApiMetrics: jest.fn(),
    trackError: jest.fn(),
    getApiMetrics: jest.fn().mockReturnValue({
      requests: 0,
      errors: 0,
      latency: 0,
    }),
    getResourceMetrics: jest.fn().mockReturnValue({
      cpu: 0,
      memory: 0,
      disk: 0,
      network: {
        latency: 0,
        bandwidth: 0,
      },
    }),
  };

  // Use modern jest.spyOn pattern
  jest.spyOn(MetricsCollector, 'getInstance').mockReturnValue(mockMetricsCollector);

  // Set up environment variables
  process.env.NODE_ENV = 'test';
  process.env.TEAMS_CLIENT_ID = 'test-client-id';
  process.env.TEAMS_CLIENT_SECRET = 'test-client-secret';
  process.env.TEAMS_TENANT_ID = 'test-tenant-id';

  // Set up global mocks
  jest.mock('../../services/logging/Logger', () => ({
    Logger: jest.fn().mockImplementation((serviceName: string) => ({
      info: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn(),
    })),
  }));
};
