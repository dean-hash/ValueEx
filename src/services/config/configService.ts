export interface ConfigValue {
  value: string | number | boolean;
  metadata?: Record<string, unknown>;
}

class ConfigService {
  private config: Map<string, ConfigValue> = new Map();

  constructor() {
    this.loadConfig();
  }

  private loadConfig() {
    // Load from environment variables
    this.config.set('GOOGLE_TRENDS_API_KEY', { value: process.env.GOOGLE_TRENDS_API_KEY || '' });
    this.config.set('OLLAMA_API_URL', {
      value: process.env.OLLAMA_API_URL || 'http://localhost:11434',
    });
    this.config.set('MAX_BATCH_SIZE', { value: parseInt(process.env.MAX_BATCH_SIZE || '10', 10) });
    this.config.set('PROCESSING_TIMEOUT', {
      value: parseInt(process.env.PROCESSING_TIMEOUT || '30000', 10),
    });
    this.config.set('RETRY_ATTEMPTS', { value: parseInt(process.env.RETRY_ATTEMPTS || '3', 10) });
    this.config.set('CACHE_ENABLED', { value: process.env.CACHE_ENABLED !== 'false' });

    // GoDaddy config
    this.config.set('GODADDY_API_KEY', { value: process.env.GODADDY_API_KEY || '' });
    this.config.set('GODADDY_API_SECRET', { value: process.env.GODADDY_API_SECRET || '' });
  }

  get(key: string): ConfigValue | undefined {
    return this.config.get(key);
  }

  set(key: string, value: ConfigValue): void {
    this.config.set(key, value);
  }

  update(key: string, value: Partial<ConfigValue>): void {
    const existingValue = this.config.get(key);
    if (existingValue) {
      this.config.set(key, { ...existingValue, ...value });
    } else {
      this.config.set(key, value as ConfigValue);
    }
  }

  getGodaddyConfig() {
    return {
      apiKey: this.get('GODADDY_API_KEY')?.value as string,
      apiSecret: this.get('GODADDY_API_SECRET')?.value as string,
    };
  }
}

export const configService = new ConfigService();
