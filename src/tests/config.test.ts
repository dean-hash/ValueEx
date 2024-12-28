import { configService } from '../config/configService';

// Test configuration loading
console.log('\n=== Testing Configuration Service ===\n');

// Test OpenAI Configuration
const openaiConfig = configService.getOpenAIConfig();
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
  it('should load configuration with test environment', () => {
    const config = configService['config'];
    expect(config).toBeDefined();
    expect(config.server.environment).toBe('test');
  });

  it('should have required configuration fields', () => {
    const config = configService['config'];
    expect(config.server).toBeDefined();
    expect(config.server.port).toBeDefined();
    expect(typeof config.server.port).toBe('number');
  });
});
