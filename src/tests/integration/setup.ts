import { RedisConfig } from '../../services/cache/redisConfig';
import dotenv from 'dotenv';

dotenv.config();

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

// Mock Redis for testing
jest.mock('../../services/cache/redisConfig', () => ({
  RedisConfig: {
    initialize: jest.fn().mockResolvedValue(undefined),
    getInstance: jest.fn().mockReturnValue({
      get: jest.fn(),
      set: jest.fn(),
      del: jest.fn(),
    }),
    disconnect: jest.fn().mockResolvedValue(undefined),
  },
}));

// Clean up after tests
afterAll(async () => {
  await RedisConfig.disconnect();
});
