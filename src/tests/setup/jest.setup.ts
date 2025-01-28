import { jest } from '@jest/globals';
import type { AccessToken } from '@azure/identity';

// Mock Microsoft Graph Client
const mockGraphClient = {
  api: jest.fn().mockReturnThis(),
  filter: jest.fn().mockReturnThis(),
  get: jest.fn().mockResolvedValue({ value: [] }),
  post: jest.fn().mockImplementation((data?: any) => Promise.resolve({ id: 'mock-id' })),
  patch: jest.fn().mockImplementation(() => Promise.resolve({})),
  delete: jest.fn().mockImplementation(() => Promise.resolve()),
};

jest.mock('@microsoft/microsoft-graph-client', () => ({
  Client: {
    init: jest.fn().mockReturnValue(mockGraphClient),
  },
}));

// Mock MetricsCollector singleton
jest.mock('../services/monitoring/Metrics', () => ({
  MetricsCollector: {
    getInstance: jest.fn().mockReturnValue({
      trackApiMetrics: jest.fn(),
      trackError: jest.fn(),
      getApiMetrics: jest.fn(),
      getResourceMetrics: jest.fn(),
    }),
  },
}));

// Mock Azure Identity
jest.mock('@azure/identity', () => ({
  ClientSecretCredential: jest.fn().mockImplementation(() => ({
    getToken: jest.fn().mockResolvedValue({ token: 'mock-token' } as AccessToken),
  })),
}));

// Mock environment variables
process.env = {
  ...process.env,
  TEAMS_TENANT_ID: 'mock-tenant-id',
  TEAMS_CLIENT_ID: 'mock-client-id',
  TEAMS_CLIENT_SECRET: 'mock-client-secret',
  TEAMS_BOT_ID: 'mock-bot-id',
  TEAMS_BOT_PASSWORD: 'mock-bot-password',
};
