import { ConfigService } from '../config/configService';

// Test configuration loading
console.log('\n=== Testing Configuration Service ===\n');

// Test OpenAI Configuration
const openaiConfig = ConfigService.getInstance().get('openai');
console.log('OpenAI API Key exists:', !!openaiConfig.apiKey);
console.log('OpenAI API Key length:', openaiConfig.apiKey.length);

// Test GoDaddy Configuration
const godaddyConfig = {
  apiKey: process.env.GODADDY_API_KEY,
  secret: process.env.GODADDY_API_SECRET,
};
console.log('GoDaddy API Key exists:', !!godaddyConfig.apiKey);
console.log('GoDaddy Secret exists:', !!godaddyConfig.secret);

// Test Configuration Service Methods
console.log('\nConfiguration Service Status:');
console.log('- OpenAI Configured:', !!openaiConfig.apiKey);
console.log('- GoDaddy Configured:', !!(godaddyConfig.apiKey && godaddyConfig.secret));

describe('ConfigService', () => {
  let config: ConfigService;

  beforeEach(() => {
    config = ConfigService.getInstance();
  });

  describe('get', () => {
    it('should return runner configuration', () => {
      const runnerConfig = config.get('runner');
      expect(runnerConfig).toBeDefined();
      expect(runnerConfig.matchIntervalMs).toBeGreaterThan(0);
      expect(runnerConfig.analyticsIntervalMs).toBeGreaterThan(0);
      expect(runnerConfig.maxConcurrentMatches).toBeGreaterThan(0);
      expect(typeof runnerConfig.enableHealthChecks).toBe('boolean');
    });

    it('should return server configuration', () => {
      const serverConfig = config.get('server');
      expect(serverConfig).toBeDefined();
      expect(serverConfig.port).toBeGreaterThan(0);
      expect(['development', 'production', 'test']).toContain(serverConfig.environment);
    });

    it('should handle missing optional values', () => {
      const openaiConfig = config.get('openai');
      expect(openaiConfig).toBeDefined();
      expect(typeof openaiConfig.apiKey).toBe('string');
    });
  });
});
