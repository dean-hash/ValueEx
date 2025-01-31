import { config } from 'dotenv';
import { RedisConfig } from '../services/cache/redisConfig';
import dotenv from 'dotenv';

dotenv.config();

// Load environment variables
config();

// Mock environment variables for testing
process.env.REDIS_CONNECTION_STRING = 'redis://localhost:6379';
process.env.AWIN_API_KEY = 'test_awin_key';
process.env.AWIN_PUBLISHER_ID = 'test_publisher_id';
process.env.JASPER_API_KEY = 'test_jasper_key';
process.env.JASPER_AFFILIATE_ID = 'test_affiliate_id';
process.env.TEAMS_APP_ID = 'test_teams_id';
process.env.TEAMS_APP_PASSWORD = 'test_teams_password';
process.env.DYNAMICS_TENANT_ID = 'test_tenant_id';
process.env.DYNAMICS_CLIENT_ID = 'test_client_id';
process.env.DYNAMICS_CLIENT_SECRET = 'test_client_secret';
process.env.DYNAMICS_RESOURCE_URL = 'https://test.crm.dynamics.com';

// Increase timeout for all tests
jest.setTimeout(30000);

// Mock Redis for testing
jest.mock('ioredis', () => {
  return jest.fn().mockImplementation(() => ({
    ping: jest.fn().mockResolvedValue('PONG'),
    on: jest.fn(),
    quit: jest.fn().mockResolvedValue(undefined),
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
  }));
});

jest.mock('../utils/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
}));

// Clean up after all tests
afterAll(async () => {
  await RedisConfig.disconnect();
});
